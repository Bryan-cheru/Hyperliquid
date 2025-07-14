// Test with corrected order structure - fixing the 422 error
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

async function testCorrectedStructure() {
  try {
    console.log('🔧 Testing with CORRECTED order structure');
    console.log('=========================================');

    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('Agent Wallet:', wallet.address);
    console.log('Vault Address:', VAULT_ADDRESS);
    
    console.log('\n📋 Testing different order structures...');
    
    // Let's try the structure without vaultAddress first to see if that's causing the 422
    const actionWithoutVault = {
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
    };
    
    console.log('\n1️⃣ Testing WITHOUT vaultAddress (baseline):');
    await testOrderStructure(wallet, actionWithoutVault, 'without-vault');
    
    // Now test with vaultAddress 
    const actionWithVault = {
      type: "order",
      orders: [
        {
          a: 0,          
          b: true,       
          p: "0",        
          s: "0.001",    
          r: false,      
          t: {           
            limit: {
              tif: "Ioc"
            }
          }
        }
      ],
      grouping: "na",
      vaultAddress: VAULT_ADDRESS
    };
    
    console.log('\n2️⃣ Testing WITH vaultAddress:');
    await testOrderStructure(wallet, actionWithVault, 'with-vault');
    
    // Test with different order type structure
    const actionAltStructure = {
      type: "order",
      orders: [
        {
          a: 0,          
          b: true,       
          p: "0",        
          s: "0.001",    
          r: false,      
          t: {           
            limit: {
              tif: "Ioc"
            }
          },
          c: null  // cloid (client order id) - sometimes required
        }
      ],
      grouping: "na",
      vaultAddress: VAULT_ADDRESS
    };
    
    console.log('\n3️⃣ Testing WITH cloid field:');
    await testOrderStructure(wallet, actionAltStructure, 'with-cloid');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testOrderStructure(wallet, action, testName) {
  try {
    console.log(`\n📋 ${testName} action:`, JSON.stringify(action, null, 2));
    
    // Create msgpack hash
    const actionHash = msgpackHash(action);
    console.log(`🔍 ${testName} hash:`, actionHash);
    
    // Sign
    const nonce = Date.now();
    const signatureData = ethers.solidityPackedKeccak256(
      ['bytes32', 'uint64'],
      [actionHash, nonce]
    );
    
    const signature = await wallet.signMessage(ethers.getBytes(signatureData));
    const { r, s, v } = ethers.Signature.from(signature);
    
    const payload = {
      action,
      nonce,
      signature: {
        r,
        s,
        v
      }
    };
    
    console.log(`🚀 Sending ${testName} order...`);
    
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    console.log(`📥 ${testName} response:`, response.status, responseText);
    
    if (response.status === 422) {
      console.log(`❌ ${testName}: Structure issue (422)`);
    } else if (response.status === 200) {
      try {
        const parsedResponse = JSON.parse(responseText);
        if (parsedResponse.status === 'err') {
          console.log(`🔍 ${testName}: API error - ${parsedResponse.response}`);
        } else {
          console.log(`✅ ${testName}: SUCCESS!`);
        }
      } catch (e) {
        console.log(`⚠️ ${testName}: Response not JSON`);
      }
    }
    
    // Add delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
    
  } catch (error) {
    console.log(`❌ ${testName} error:`, error.message);
  }
}

// Run the test
testCorrectedStructure();
