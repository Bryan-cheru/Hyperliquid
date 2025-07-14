// Direct test with the provided vault address
import { ethers } from 'ethers';

const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';
const VAULT_ADDRESS = '0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB';

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

async function checkAccountDetails(address) {
  try {
    console.log(`🔍 Detailed account check for ${address}:`);
    
    // Check clearinghouse state
    const chResponse = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'clearinghouseState',
        user: address
      })
    });
    
    const chData = await chResponse.json();
    console.log('   Clearinghouse state:', JSON.stringify(chData, null, 2));
    
    // Check if this account exists
    const metaResponse = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'metaAndAssetCtxs'
      })
    });
    
    const metaData = await metaResponse.json();
    console.log('   Meta data available:', !!metaData);
    
    return chData;
  } catch (error) {
    console.log('   Error:', error.message);
    return null;
  }
}

async function testDirectVaultAddress() {
  try {
    console.log('🎯 FINAL TEST: Direct vault address trade');
    console.log('=========================================');

    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('Agent Wallet:', wallet.address);
    console.log('Vault Address:', VAULT_ADDRESS);
    
    // Check account details first
    await checkAccountDetails(VAULT_ADDRESS);
    
    console.log('\n📋 Creating order with vaultAddress...');
    
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
      vaultAddress: VAULT_ADDRESS  // The key parameter!
    };
    
    console.log('📋 Action with vaultAddress:');
    console.log(JSON.stringify(action, null, 2));
    
    // Create msgpack hash
    const actionHash = msgpackHash(action);
    console.log('\n🔍 Action hash:', actionHash);
    
    // Sign
    const nonce = Date.now();
    const signatureData = ethers.solidityPackedKeccak256(
      ['bytes32', 'uint64'],
      [actionHash, nonce]
    );
    
    console.log('🔐 Signature data:', signatureData);
    
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
    
    console.log('\n📋 Final payload:');
    console.log(JSON.stringify(payload, null, 2));
    
    // Submit to HyperLiquid
    console.log('\n🚀 Sending order with vault address...');
    
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
        
        // Check what address HyperLiquid is expecting now
        const addressMatch = parsedResponse.response.match(/0x[a-fA-F0-9]{40}/);
        if (addressMatch) {
          console.log('\n🔍 Analysis:');
          console.log('   HyperLiquid expects:', addressMatch[0]);
          console.log('   Our agent wallet:', wallet.address);
          console.log('   Our vault address:', VAULT_ADDRESS);
          console.log('   Agent == Expected:', addressMatch[0].toLowerCase() === wallet.address.toLowerCase() ? '✅' : '❌');
          console.log('   Vault == Expected:', addressMatch[0].toLowerCase() === VAULT_ADDRESS.toLowerCase() ? '✅' : '❌');
        }
        
        // Check if the error changed
        if (parsedResponse.response.includes('does not exist')) {
          console.log('\n💡 Still getting "does not exist" - this could mean:');
          console.log('   1. The vault address is incorrect');
          console.log('   2. The agent is not approved for this vault');
          console.log('   3. The msgpack encoding still needs refinement');
        }
      } else {
        console.log('🎉 SUCCESS! Order was accepted!');
        console.log('✅ Trading with agent wallet is now working!');
      }
    } catch (parseError) {
      console.log('⚠️ Could not parse response as JSON');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testDirectVaultAddress();
