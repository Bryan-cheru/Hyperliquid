// Test with vaultAddress at the TOP LEVEL of the payload
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

function msgpackHash(obj, vaultAddress, nonce) {
  // Step 1: Encode the action with msgpack
  const actionData = encodeValue(obj);
  
  // Step 2: Add nonce as 8 bytes big-endian (required for HyperLiquid)
  const nonceBuffer = Buffer.allocUnsafe(8);
  nonceBuffer.writeBigUInt64BE(BigInt(nonce), 0);
  
  // Step 3: Add vault address flag and bytes (HyperLiquid format)
  let vaultBuffer;
  if (!vaultAddress) {
    vaultBuffer = Buffer.from([0x00]); // null vault
  } else {
    const addressBytes = Buffer.from(vaultAddress.slice(2), 'hex'); // remove 0x
    vaultBuffer = Buffer.concat([Buffer.from([0x01]), addressBytes]); // has vault
  }
  
  // Step 4: Concatenate all data exactly like HyperLiquid Python SDK
  const totalData = Buffer.concat([actionData, nonceBuffer, vaultBuffer]);
  
  // Step 5: Keccak hash the concatenated data
  return ethers.keccak256(totalData);
}

async function testTopLevelVaultAddress() {
  try {
    console.log('🎯 CORRECTED: vaultAddress at TOP LEVEL');
    console.log('=====================================');

    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('Agent Wallet:', wallet.address);
    console.log('Vault Address:', VAULT_ADDRESS);
    
    // Create action WITHOUT vaultAddress (it goes in the payload instead)
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
      grouping: "na"
      // NO vaultAddress here!
    };
    
    console.log('\n📋 Action (clean):');
    console.log(JSON.stringify(action, null, 2));
    
    // Sign
    const nonce = Date.now();
    
    // Create msgpack hash with nonce and vault address
    const actionHash = msgpackHash(action, VAULT_ADDRESS, nonce);
    console.log('\n🔍 Action hash:', actionHash);
    
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
    
    // Create payload with vaultAddress at TOP LEVEL
    const payload = {
      action,
      nonce,
      signature: {
        r,
        s,
        v
      },
      vaultAddress: VAULT_ADDRESS  // 🔑 KEY: vaultAddress at payload level!
    };
    
    console.log('\n📋 Payload with TOP-LEVEL vaultAddress:');
    console.log(JSON.stringify(payload, null, 2));
    
    // Submit to HyperLiquid
    console.log('\n🚀 Sending order with TOP-LEVEL vaultAddress...');
    
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    console.log('📥 Response:', response.status, responseText);
    
    if (response.status === 422) {
      console.log('❌ Still getting 422 - structure might need further adjustment');
    } else if (response.status === 200) {
      try {
        const parsedResponse = JSON.parse(responseText);
        console.log('📊 Parsed Response:', parsedResponse);
        
        if (parsedResponse.status === 'err') {
          console.log('🔍 Error details:', parsedResponse.response);
          
          if (parsedResponse.response.includes('does not exist')) {
            console.log('💡 Still getting "does not exist" - but structure is now valid!');
            console.log('💡 This suggests the agent approval or vault relationship needs attention');
          } else {
            console.log('🎉 NEW ERROR TYPE - we\'re making progress!');
          }
        } else {
          console.log('🎉 SUCCESS! Order was accepted!');
          console.log('✅ Agent wallet trading is now fully functional!');
        }
      } catch (parseError) {
        console.log('⚠️ Could not parse response as JSON');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the test
testTopLevelVaultAddress();
