// Test with vaultAddress parameter - the final piece!
import { ethers } from 'ethers';

const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';

// You mentioned you have funds in a subaccount - we need that main account address
// Let's try some common patterns or you can provide the exact address

function encodeFloat(value) {
  const buffer = Buffer.allocUnsafe(9);
  buffer.writeUInt8(0xcb, 0);
  buffer.writeDoubleBE(parseFloat(value), 1);
  return buffer;
}

function encodeInt(value) {
  if (value >= 0 && value <= 127) {
    return Buffer.from([value]);
  } else if (value >= -32 && value < 0) {
    return Buffer.from([0xe0 + (32 + value)]);
  } else if (value >= 0 && value <= 255) {
    return Buffer.from([0xcc, value]);
  } else if (value >= 0 && value <= 65535) {
    const buffer = Buffer.allocUnsafe(3);
    buffer.writeUInt8(0xcd, 0);
    buffer.writeUInt16BE(value, 1);
    return buffer;
  } else if (value >= 0 && value <= 4294967295) {
    const buffer = Buffer.allocUnsafe(5);
    buffer.writeUInt8(0xce, 0);
    buffer.writeUInt32BE(value, 1);
    return buffer;
  } else {
    const buffer = Buffer.allocUnsafe(9);
    buffer.writeUInt8(0xcf, 0);
    buffer.writeBigUInt64BE(BigInt(value), 1);
    return buffer;
  }
}

function encodeString(value) {
  const utf8Buffer = Buffer.from(value, 'utf8');
  const length = utf8Buffer.length;
  
  if (length <= 31) {
    return Buffer.concat([Buffer.from([0xa0 + length]), utf8Buffer]);
  } else if (length <= 255) {
    return Buffer.concat([Buffer.from([0xd9, length]), utf8Buffer]);
  } else if (length <= 65535) {
    const header = Buffer.allocUnsafe(3);
    header.writeUInt8(0xda, 0);
    header.writeUInt16BE(length, 1);
    return Buffer.concat([header, utf8Buffer]);
  } else {
    const header = Buffer.allocUnsafe(5);
    header.writeUInt8(0xdb, 0);
    header.writeUInt32BE(length, 1);
    return Buffer.concat([header, utf8Buffer]);
  }
}

function encodeBool(value) {
  return Buffer.from([value ? 0xc3 : 0xc2]);
}

function encodeArray(array) {
  const length = array.length;
  let header;
  
  if (length <= 15) {
    header = Buffer.from([0x90 + length]);
  } else if (length <= 65535) {
    header = Buffer.allocUnsafe(3);
    header.writeUInt8(0xdc, 0);
    header.writeUInt16BE(length, 1);
  } else {
    header = Buffer.allocUnsafe(5);
    header.writeUInt8(0xdd, 0);
    header.writeUInt32BE(length, 1);
  }
  
  const encodedItems = array.map(item => encodeValue(item));
  return Buffer.concat([header, ...encodedItems]);
}

function encodeMap(obj) {
  const keys = Object.keys(obj).sort();
  const length = keys.length;
  let header;
  
  if (length <= 15) {
    header = Buffer.from([0x80 + length]);
  } else if (length <= 65535) {
    header = Buffer.allocUnsafe(3);
    header.writeUInt8(0xde, 0);
    header.writeUInt16BE(length, 1);
  } else {
    header = Buffer.allocUnsafe(5);
    header.writeUInt8(0xdf, 0);
    header.writeUInt32BE(length, 1);
  }
  
  const encodedPairs = [];
  for (const key of keys) {
    encodedPairs.push(encodeString(key));
    encodedPairs.push(encodeValue(obj[key]));
  }
  
  return Buffer.concat([header, ...encodedPairs]);
}

function encodeValue(value) {
  if (value === null) {
    return Buffer.from([0xc0]);
  } else if (typeof value === 'boolean') {
    return encodeBool(value);
  } else if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return encodeInt(value);
    } else {
      return encodeFloat(value);
    }
  } else if (typeof value === 'string') {
    return encodeString(value);
  } else if (Array.isArray(value)) {
    return encodeArray(value);
  } else if (typeof value === 'object') {
    return encodeMap(value);
  } else {
    throw new Error(`Unsupported value type: ${typeof value}`);
  }
}

function msgpackHash(obj) {
  const encoded = encodeValue(obj);
  return ethers.keccak256(encoded);
}

async function checkAccountInfo(address) {
  try {
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'clearinghouseState',
        user: address
      })
    });
    
    const data = await response.json();
    if (data.balances && data.balances.length > 0) {
      const totalBalance = data.balances.reduce((sum, balance) => {
        return sum + parseFloat(balance.hold) + parseFloat(balance.total);
      }, 0);
      return { hasBalance: totalBalance > 0, balance: totalBalance, data };
    }
    return { hasBalance: false, balance: 0, data };
  } catch (error) {
    return { hasBalance: false, balance: 0, error: error.message };
  }
}

async function testWithVaultAddress() {
  try {
    console.log('🎯 Testing with vaultAddress parameter');
    console.log('=====================================');

    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('Agent Wallet:', wallet.address);
    
    // Let's try to derive or guess the main account address
    // You mentioned you have funds in a subaccount - we need to find that main account
    
    console.log('\n🔍 Searching for the main account with funds...');
    
    // Using the actual main account address provided by the user
    const potentialVaultAddresses = [
      '0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB',  // Main account with funds
      
      // Fallback addresses (keeping for reference)
      '0x862c244a9d4e0c6ae6eae0ac812834f7cc86d00f8',
      '0xc60934bc74da4b7499eeab6ea6c3c85943c06871',
      '0xf68552ff658072a6d5920c8c554ac7b63e0f70dc',
    ];
    
    let mainAccountWithFunds = null;
    
    for (const vaultAddr of potentialVaultAddresses) {
      console.log(`\nChecking ${vaultAddr}...`);
      const accountInfo = await checkAccountInfo(vaultAddr);
      
      if (accountInfo.hasBalance) {
        console.log(`✅ Found funds! Balance: $${accountInfo.balance.toFixed(2)}`);
        mainAccountWithFunds = vaultAddr;
        break;
      } else {
        console.log(`❌ No funds`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (!mainAccountWithFunds) {
      console.log('❌ Could not find a main account with funds.');
      console.log('💡 Please provide your main account address that has funds.');
      console.log('💡 You can find this in your HyperLiquid account interface.');
      return;
    }
    
    console.log(`\n🎯 Using vault address: ${mainAccountWithFunds}`);
    
    // Create action with vaultAddress
    const action = {
      type: "order",
      orders: [
        {
          a: 0,          // asset (ETH-USD)
          b: true,       // is_buy
          p: "0",        // price (market order)
          s: "0.001",    // size
          r: false,      // reduce_only
          t: {           // order_type
            limit: {
              tif: "Ioc"
            }
          }
        }
      ],
      grouping: "na",
      vaultAddress: mainAccountWithFunds  // This is the key!
    };
    
    console.log('\n📋 Action with vaultAddress:');
    console.log(JSON.stringify(action, null, 2));
    
    // Create msgpack hash
    const actionHash = msgpackHash(action);
    console.log('\n🔍 Action hash with vaultAddress:', actionHash);
    
    // Sign
    const nonce = Date.now();
    const signatureData = ethers.solidityPackedKeccak256(
      ['bytes32', 'uint64'],
      [actionHash, nonce]
    );
    
    const signature = await wallet.signMessage(ethers.getBytes(signatureData));
    const { r, s, v } = ethers.Signature.from(signature);
    
    // Verify signature recovery
    const recovered = ethers.verifyMessage(ethers.getBytes(signatureData), signature);
    console.log('\n🔍 Signature Verification:');
    console.log('   Signer:', wallet.address);
    console.log('   Recovered:', recovered);
    console.log('   Match:', wallet.address.toLowerCase() === recovered.toLowerCase() ? '✅' : '❌');
    
    // Prepare payload
    const payload = {
      action,
      nonce,
      signature: {
        r,
        s,
        v
      }
    };
    
    console.log('\n📋 Complete payload:');
    console.log(JSON.stringify(payload, null, 2));
    
    // Submit to HyperLiquid
    console.log('\n🚀 Sending order with vaultAddress...');
    
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    console.log('📥 Response:', response.status, responseText);
    
    try {
      const parsedResponse = JSON.parse(responseText);
      console.log('📊 Parsed Response:', parsedResponse);
      
      if (parsedResponse.status === 'err') {
        console.log('❌ Error:', parsedResponse.response);
        
        // Check if it's still an address mismatch
        const addressMatch = parsedResponse.response.match(/0x[a-fA-F0-9]{40}/);
        if (addressMatch) {
          console.log('🔍 HyperLiquid expects address:', addressMatch[0]);
          console.log('🤔 Our agent wallet:', wallet.address);
          console.log('🏛️ Our vault address:', mainAccountWithFunds);
        }
      } else {
        console.log('✅ SUCCESS! Order submitted successfully!');
        console.log('🎉 The vaultAddress parameter was the missing piece!');
      }
    } catch (parseError) {
      console.log('⚠️ Could not parse response as JSON');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testWithVaultAddress();
