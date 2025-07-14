// Final comparison test to match HyperLiquid exactly
import { ethers } from 'ethers';

const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';
const VAULT_ADDRESS = '0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB';

// Browser-compatible msgpack encoding (current implementation)
function encodeFloat(value) {
  const buffer = new ArrayBuffer(9);
  const view = new DataView(buffer);
  view.setUint8(0, 0xcb);
  view.setFloat64(1, value, false);
  return new Uint8Array(buffer);
}

function encodeInt(value) {
  if (value >= 0 && value <= 127) {
    return new Uint8Array([value]);
  } else if (value >= -32 && value < 0) {
    return new Uint8Array([0xe0 + (32 + value)]);
  } else if (value >= 0 && value <= 255) {
    return new Uint8Array([0xcc, value]);
  } else if (value >= 0 && value <= 65535) {
    const buffer = new ArrayBuffer(3);
    const view = new DataView(buffer);
    view.setUint8(0, 0xcd);
    view.setUint16(1, value, false);
    return new Uint8Array(buffer);
  } else if (value >= 0 && value <= 4294967295) {
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);
    view.setUint8(0, 0xce);
    view.setUint32(1, value, false);
    return new Uint8Array(buffer);
  } else {
    const buffer = new ArrayBuffer(9);
    const view = new DataView(buffer);
    view.setUint8(0, 0xcf);
    view.setBigUint64(1, BigInt(value), false);
    return new Uint8Array(buffer);
  }
}

function encodeString(value) {
  const utf8Encoder = new TextEncoder();
  const utf8Bytes = utf8Encoder.encode(value);
  const length = utf8Bytes.length;
  
  if (length <= 31) {
    const result = new Uint8Array(1 + length);
    result[0] = 0xa0 + length;
    result.set(utf8Bytes, 1);
    return result;
  } else if (length <= 255) {
    const result = new Uint8Array(2 + length);
    result[0] = 0xd9;
    result[1] = length;
    result.set(utf8Bytes, 2);
    return result;
  } else if (length <= 65535) {
    const result = new Uint8Array(3 + length);
    const view = new DataView(result.buffer);
    view.setUint8(0, 0xda);
    view.setUint16(1, length, false);
    result.set(utf8Bytes, 3);
    return result;
  } else {
    const result = new Uint8Array(5 + length);
    const view = new DataView(result.buffer);
    view.setUint8(0, 0xdb);
    view.setUint32(1, length, false);
    result.set(utf8Bytes, 5);
    return result;
  }
}

function encodeBool(value) {
  return new Uint8Array([value ? 0xc3 : 0xc2]);
}

function encodeArray(array) {
  const length = array.length;
  let header;
  
  if (length <= 15) {
    header = new Uint8Array([0x90 + length]);
  } else if (length <= 65535) {
    const buffer = new ArrayBuffer(3);
    const view = new DataView(buffer);
    view.setUint8(0, 0xdc);
    view.setUint16(1, length, false);
    header = new Uint8Array(buffer);
  } else {
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);
    view.setUint8(0, 0xdd);
    view.setUint32(1, length, false);
    header = new Uint8Array(buffer);
  }
  
  const encodedItems = array.map(item => encodeValue(item));
  return concatenateUint8Arrays([header, ...encodedItems]);
}

function encodeMap(obj) {
  const keys = Object.keys(obj).sort();
  const length = keys.length;
  let header;
  
  if (length <= 15) {
    header = new Uint8Array([0x80 + length]);
  } else if (length <= 65535) {
    const buffer = new ArrayBuffer(3);
    const view = new DataView(buffer);
    view.setUint8(0, 0xde);
    view.setUint16(1, length, false);
    header = new Uint8Array(buffer);
  } else {
    const buffer = new ArrayBuffer(5);
    const view = new DataView(buffer);
    view.setUint8(0, 0xdf);
    view.setUint32(1, length, false);
    header = new Uint8Array(buffer);
  }
  
  const encodedPairs = [];
  for (const key of keys) {
    encodedPairs.push(encodeString(key));
    encodedPairs.push(encodeValue(obj[key]));
  }
  
  return concatenateUint8Arrays([header, ...encodedPairs]);
}

function concatenateUint8Arrays(arrays) {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

function encodeValue(value) {
  if (value === null) {
    return new Uint8Array([0xc0]);
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
  } else if (typeof value === 'object' && value !== null) {
    return encodeMap(value);
  } else {
    throw new Error(`Unsupported value type: ${typeof value}`);
  }
}

function msgpackHashWithNonceAndVault(obj, vaultAddress, nonce) {
  // Step 1: Encode the action with msgpack
  const actionData = encodeValue(obj);
  
  // Step 2: Add nonce as 8 bytes big-endian
  const nonceBytes = new Uint8Array(8);
  const nonceView = new DataView(nonceBytes.buffer);
  nonceView.setBigUint64(0, BigInt(nonce), false);
  
  // Step 3: Add vault address flag and bytes
  let vaultBytes;
  if (!vaultAddress) {
    vaultBytes = new Uint8Array([0x00]);
  } else {
    const addressBytes = ethers.getBytes(vaultAddress);
    vaultBytes = new Uint8Array(1 + addressBytes.length);
    vaultBytes[0] = 0x01;
    vaultBytes.set(addressBytes, 1);
  }
  
  // Step 4: Concatenate all data
  const totalData = concatenateUint8Arrays([actionData, nonceBytes, vaultBytes]);
  
  // Step 5: Keccak hash
  return ethers.keccak256(totalData);
}

async function compareImplementations() {
  try {
    console.log('🔬 FINAL COMPARISON: Browser vs Expected');
    console.log('========================================');

    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('Agent Wallet:', wallet.address);
    console.log('Vault Address:', VAULT_ADDRESS);
    
    // Use the exact same action structure as the app
    const action = {
      type: "order",
      orders: [
        {
          a: 0,
          b: true,
          p: "0",
          s: "0.1",
          r: false,
          t: {
            limit: {
              tif: "Ioc"
            }
          }
        }
      ],
      grouping: "na"
    };
    
    // Use a fixed nonce for consistency
    const nonce = 1752531996440; // From the app logs
    
    console.log('\n📋 Action structure:');
    console.log(JSON.stringify(action, null, 2));
    console.log('\n🔍 Nonce:', nonce);
    console.log('🏛️ Vault:', VAULT_ADDRESS);
    
    // Test our implementation
    console.log('\n🧪 Testing our msgpack implementation...');
    const ourHash = msgpackHashWithNonceAndVault(action, VAULT_ADDRESS, nonce);
    console.log('📊 Our hash:', ourHash);
    
    // Create signature data and sign
    const signatureData = ethers.solidityPackedKeccak256(
      ['bytes32', 'uint64'],
      [ourHash, nonce]
    );
    
    console.log('🔐 Signature data:', signatureData);
    
    const signature = await wallet.signMessage(ethers.getBytes(signatureData));
    const { r, s, v } = ethers.Signature.from(signature);
    
    // Verify signature locally
    const recovered = ethers.verifyMessage(ethers.getBytes(signatureData), signature);
    console.log('\n🔍 Local verification:');
    console.log('   Signer:', wallet.address);
    console.log('   Recovered:', recovered);
    console.log('   Match:', wallet.address.toLowerCase() === recovered.toLowerCase() ? '✅' : '❌');
    
    // Test without vault address to see the difference
    console.log('\n🧪 Testing WITHOUT vault address...');
    const hashWithoutVault = msgpackHashWithNonceAndVault(action, null, nonce);
    console.log('📊 Hash without vault:', hashWithoutVault);
    
    const signatureDataNoVault = ethers.solidityPackedKeccak256(
      ['bytes32', 'uint64'],
      [hashWithoutVault, nonce]
    );
    
    const signatureNoVault = await wallet.signMessage(ethers.getBytes(signatureDataNoVault));
    const recoveredNoVault = ethers.verifyMessage(ethers.getBytes(signatureDataNoVault), signatureNoVault);
    console.log('   Recovered (no vault):', recoveredNoVault);
    
    // Test the order submission to see what HyperLiquid expects
    console.log('\n🚀 Testing with HyperLiquid API...');
    
    const payload = {
      action,
      nonce,
      signature: { r, s, v },
      vaultAddress: VAULT_ADDRESS
    };
    
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    const responseText = await response.text();
    console.log('📥 HyperLiquid response:', response.status, responseText);
    
    try {
      const parsedResponse = JSON.parse(responseText);
      if (parsedResponse.status === 'err') {
        const addressMatch = parsedResponse.response.match(/0x[a-fA-F0-9]{40}/);
        if (addressMatch) {
          console.log('\n🎯 ANALYSIS:');
          console.log('   HyperLiquid expects:', addressMatch[0]);
          console.log('   Our agent wallet:', wallet.address);
          console.log('   Our vault address:', VAULT_ADDRESS);
          console.log('   Expected == Agent:', addressMatch[0].toLowerCase() === wallet.address.toLowerCase() ? '✅' : '❌');
          console.log('   Expected == Vault:', addressMatch[0].toLowerCase() === VAULT_ADDRESS.toLowerCase() ? '✅' : '❌');
          
          // The key insight: if HyperLiquid expects a different address,
          // it means our action hash is still slightly different
          console.log('\n💡 Next steps:');
          console.log('   - Our msgpack encoding might still have minor differences');
          console.log('   - We might need to adjust float encoding, key ordering, or type handling');
          console.log('   - The difference is small since we\'re getting consistent but wrong addresses');
        }
      } else {
        console.log('🎉 SUCCESS! Order was accepted!');
      }
    } catch (e) {
      console.log('⚠️ Could not parse response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the comparison
compareImplementations();
