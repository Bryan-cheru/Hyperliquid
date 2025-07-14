// Test script to approve agent wallet for HyperLiquid trading
import { ethers } from 'ethers';

// Your main account credentials (the one that has funds and will approve the agent)
const MAIN_ACCOUNT_PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';
const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';

console.log('🧪 Testing Agent Wallet Approval');
console.log('=================================');

// Msgpack encoding functions (same as before)
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
  const actionData = encodeValue(obj);
  
  const nonceBytes = new Uint8Array(8);
  const nonceView = new DataView(nonceBytes.buffer);
  nonceView.setBigUint64(0, BigInt(nonce), false);
  
  let vaultBytes;
  if (!vaultAddress) {
    vaultBytes = new Uint8Array([0x00]);
  } else {
    const addressBytes = ethers.getBytes(vaultAddress);
    vaultBytes = new Uint8Array(1 + addressBytes.length);
    vaultBytes[0] = 0x01;
    vaultBytes.set(addressBytes, 1);
  }
  
  const totalData = concatenateUint8Arrays([actionData, nonceBytes, vaultBytes]);
  return ethers.keccak256(totalData);
}

async function approveAgent() {
  try {
    const mainWallet = new ethers.Wallet(MAIN_ACCOUNT_PRIVATE_KEY);
    console.log('🔑 Main account:', mainWallet.address);
    console.log('🤖 Agent to approve:', AGENT_WALLET_ADDRESS);

    // Step 1: Create approval action
    console.log('\n1️⃣ Creating approval action...');
    const approveAction = {
      type: "approveAgent",
      agent: AGENT_WALLET_ADDRESS
    };

    console.log('   Approve action:', JSON.stringify(approveAction, null, 2));

    // Step 2: Sign the approval (main account signs for itself)
    console.log('\n2️⃣ Signing approval with main account...');
    const nonce = Date.now();
    
    // For approval, the main account signs without vaultAddress
    const actionHash = await msgpackHash(approveAction, null, nonce);
    console.log('   Action hash:', actionHash);
    
    // Create phantom agent for main account (not using vault)
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
    
    // Sign with main account
    const signature = await mainWallet.signTypedData(domain, types, phantomAgent);
    const splitSig = ethers.Signature.from(signature);
    
    console.log('   Signature created successfully');
    
    // Verify locally
    const recovered = ethers.verifyTypedData(domain, types, phantomAgent, signature);
    console.log('   Local verification:', mainWallet.address === recovered ? '✅' : '❌');

    // Step 3: Build approval payload
    console.log('\n3️⃣ Building approval payload...');
    const approvalPayload = {
      action: approveAction,
      nonce,
      signature: {
        r: splitSig.r,
        s: splitSig.s,
        v: splitSig.v
      }
      // No vaultAddress for approval - main account signs for itself
    };

    console.log('   Approval payload:', JSON.stringify(approvalPayload, null, 2));

    // Step 4: Submit approval to HyperLiquid
    console.log('\n4️⃣ Submitting approval to HyperLiquid...');
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(approvalPayload)
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
      console.log('\n🎉 SUCCESS! Agent wallet approved successfully');
      console.log('📊 Response:', result);
      console.log('\n✅ Your agent wallet is now approved for trading!');
      console.log('   Agent address:', AGENT_WALLET_ADDRESS);
      console.log('   Can now trade on behalf of:', mainWallet.address);
    } else {
      console.log('\n❌ APPROVAL FAILED');
      console.log('📊 Error response:', result);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Full error:', error);
  }
}

// Run the approval
approveAgent();
