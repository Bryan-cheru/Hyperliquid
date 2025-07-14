// Test to match the exact Python SDK test case
import { ethers } from 'ethers';

console.log('🧪 Testing Against Python SDK Test Case');
console.log('=======================================');

// Exact test case from Python SDK
const EXPECTED_CONNECTION_ID = "0x0fcbeda5ae3c4950a548021552a4fea2226858c4453571bf3f24ba017eac2908";
const TIMESTAMP = 1677777606040;

// Order from Python test
const ORDER_REQUEST = {
  coin: "ETH",
  is_buy: true,
  sz: 0.0147,
  limit_px: 1670.1,
  reduce_only: false,
  order_type: { limit: { tif: "Ioc" } },
  cloid: null
};

// Convert to HyperLiquid wire format
const ORDER_WIRE = {
  a: 4, // ETH asset index from Python test
  b: true,
  p: "1670.1",
  s: "0.0147", 
  r: false,
  t: { limit: { tif: "Ioc" } }
};

const ORDER_ACTION = {
  type: "order",
  orders: [ORDER_WIRE],
  grouping: "na"
};

// Msgpack encoding functions (exact same as before)
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

async function actionHash(action, vaultAddress, nonce, expiresAfter) {
  // Step 1: Encode the action with msgpack
  const actionData = encodeValue(action);
  
  // Step 2: Add nonce as 8 bytes big-endian  
  const nonceBytes = new Uint8Array(8);
  const nonceView = new DataView(nonceBytes.buffer);
  nonceView.setBigUint64(0, BigInt(nonce), false);
  
  // Step 3: Add vault address
  let vaultBytes;
  if (!vaultAddress) {
    vaultBytes = new Uint8Array([0x00]);
  } else {
    const addressBytes = ethers.getBytes(vaultAddress);
    vaultBytes = new Uint8Array(1 + addressBytes.length);
    vaultBytes[0] = 0x01;
    vaultBytes.set(addressBytes, 1);
  }
  
  // Step 4: Add expires_after if present (Python SDK format)
  let expiresBytes = new Uint8Array(0);
  if (expiresAfter !== null && expiresAfter !== undefined) {
    const expiresData = new Uint8Array(9);
    expiresData[0] = 0x00; // flag for expires_after
    const expiresView = new DataView(expiresData.buffer, 1);
    expiresView.setBigUint64(0, BigInt(expiresAfter), false);
    expiresBytes = expiresData;
  }
  
  // Step 5: Concatenate all data exactly like Python SDK
  const totalData = concatenateUint8Arrays([actionData, nonceBytes, vaultBytes, expiresBytes]);
  
  // Step 6: Keccak hash
  return ethers.keccak256(totalData);
}

function constructPhantomAgent(hash, isMainnet) {
  return {
    source: isMainnet ? "a" : "b",
    connectionId: hash
  };
}

async function testPythonSDKMatch() {
  try {
    console.log('📋 Test data:');
    console.log('   Timestamp:', TIMESTAMP);
    console.log('   Order action:', JSON.stringify(ORDER_ACTION, null, 2));
    console.log('   Expected connectionId:', EXPECTED_CONNECTION_ID);
    
    // Step 1: Calculate action hash exactly like Python SDK
    const hash = await actionHash(ORDER_ACTION, null, TIMESTAMP, null);
    console.log('\n🔍 Results:');
    console.log('   Calculated hash:', hash);
    
    // Step 2: Create phantom agent
    const phantomAgent = constructPhantomAgent(hash, true); // mainnet = true
    console.log('   Phantom agent connectionId:', phantomAgent.connectionId);
    
    // Step 3: Compare with expected
    const matches = phantomAgent.connectionId.toLowerCase() === EXPECTED_CONNECTION_ID.toLowerCase();
    console.log('   Matches Python SDK:', matches ? '✅' : '❌');
    
    if (!matches) {
      console.log('\n🔧 DEBUGGING:');
      console.log('   Expected:', EXPECTED_CONNECTION_ID);
      console.log('   Got:     ', phantomAgent.connectionId);
      console.log('   This indicates our msgpack encoding or action hash logic differs from Python SDK');
    } else {
      console.log('\n🎉 SUCCESS! Our implementation matches the Python SDK exactly!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testPythonSDKMatch();
