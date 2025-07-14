// Test script for real HyperLiquid order submission with EIP-712 signing
import { ethers } from 'ethers';

// Your agent wallet credentials (from environment)
const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';
const VAULT_ADDRESS = '0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB'; // Main account with funds

console.log('🧪 Testing Real HyperLiquid Order Submission with EIP-712');
console.log('=========================================================');

// Browser-compatible msgpack encoding for HyperLiquid
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

async function msgpackHash(obj, vaultAddress, nonce) {
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

async function testRealOrder() {
  try {
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('🔑 Using agent wallet:', wallet.address);
    console.log('🏛️ Trading for vault:', VAULT_ADDRESS);

    // Step 1: Get BTC asset info
    console.log('\n1️⃣ Getting asset metadata...');
    const metaResponse = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: "meta" })
    });

    const metaData = await metaResponse.json();
    const btcIndex = metaData.universe.findIndex(asset => asset.name === 'BTC');
    console.log('   BTC asset index:', btcIndex);

    // Step 2: Create a small test order
    console.log('\n2️⃣ Creating test order...');
    const orderAction = {
      type: "order",
      orders: [{
        a: btcIndex,     // BTC
        b: true,         // buy
        p: "0",          // market price
        s: "0.001",      // very small size
        r: false,        // not reduceOnly
        t: { limit: { tif: "Ioc" } } // Immediate or Cancel
      }],
      grouping: "na"
    };

    console.log('   Order action:', JSON.stringify(orderAction, null, 2));

    // Step 3: Create signature using EIP-712
    console.log('\n3️⃣ Creating EIP-712 signature...');
    const nonce = Date.now();
    
    // Create action hash exactly like HyperLiquid Python SDK
    const actionHash = await msgpackHash(orderAction, VAULT_ADDRESS, nonce);
    console.log('   Action hash:', actionHash);
    
    // Create phantom agent - use actionHash directly as connectionId
    const phantomAgent = {
      source: 'a',
      connectionId: actionHash
    };
    
    // EIP-712 domain and types
    const domain = {
      chainId: 1337,
      name: 'Exchange',
      verifyingContract: '0x0000000000000000000000000000000000000000',
      version: '1'
    };

    const types = {
      Agent: [
        { name: 'source', type: 'string' },
        { name: 'connectionId', type: 'bytes32' }
      ]
    };
    
    // Sign with EIP-712
    const signature = await wallet.signTypedData(domain, types, phantomAgent);
    const splitSig = ethers.Signature.from(signature);
    
    console.log('   Signature created successfully');
    
    // Verify locally
    const recovered = ethers.verifyTypedData(domain, types, phantomAgent, signature);
    console.log('   Local verification:', wallet.address === recovered ? '✅' : '❌');

    // Step 4: Build final payload
    console.log('\n4️⃣ Building order payload...');
    const orderPayload = {
      action: orderAction,
      nonce,
      signature: {
        r: splitSig.r,
        s: splitSig.s,
        v: splitSig.v
      },
      vaultAddress: VAULT_ADDRESS
    };

    console.log('   Final payload:', JSON.stringify(orderPayload, null, 2));

    // Step 5: Submit to HyperLiquid
    console.log('\n5️⃣ Submitting to HyperLiquid...');
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const responseText = await response.text();
    console.log('   Response status:', response.status);
    console.log('   Response body:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = { raw: responseText };
    }

    if (response.ok && result.status === "ok") {
      console.log('\n🎉 SUCCESS! Order submitted successfully');
      console.log('📊 Response:', result);
    } else {
      console.log('\n❌ ORDER FAILED');
      console.log('📊 Error response:', result);
      
      // Check for specific error messages
      const errorMsg = result.response || result.error || responseText;
      if (typeof errorMsg === 'string') {
        if (errorMsg.includes('User or API Wallet')) {
          console.log('\n🔧 DIAGNOSIS: The agent wallet is not approved by the main account');
          console.log('   Solution: Have your main account approve this agent wallet first');
        } else if (errorMsg.includes('Unable to recover signer')) {
          console.log('\n🔧 DIAGNOSIS: Signature recovery failed');
          console.log('   The signature format or signing process may be incorrect');
        }
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testRealOrder();
