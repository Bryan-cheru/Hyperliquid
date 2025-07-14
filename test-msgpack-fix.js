// Fixed test with correct msgpack-based action hash
import { ethers } from 'ethers';

const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';

// Simple msgpack-like encoder for our specific use case
function packValue(value) {
  if (typeof value === 'string') {
    const bytes = new TextEncoder().encode(value);
    if (bytes.length < 32) {
      return new Uint8Array([0xa0 + bytes.length, ...bytes]);
    } else {
      throw new Error('String too long for simple msgpack');
    }
  } else if (typeof value === 'number') {
    if (Number.isInteger(value) && value >= 0 && value < 128) {
      return new Uint8Array([value]);
    } else {
      throw new Error('Number too complex for simple msgpack');
    }
  } else if (typeof value === 'boolean') {
    return new Uint8Array([value ? 0xc3 : 0xc2]);
  } else if (Array.isArray(value)) {
    if (value.length < 16) {
      const parts = [new Uint8Array([0x90 + value.length])];
      for (const item of value) {
        parts.push(packValue(item));
      }
      return ethers.concat(parts);
    } else {
      throw new Error('Array too long for simple msgpack');
    }
  } else if (typeof value === 'object' && value !== null) {
    const keys = Object.keys(value).sort(); // Sort keys for consistency
    if (keys.length < 16) {
      const parts = [new Uint8Array([0x80 + keys.length])];
      for (const key of keys) {
        parts.push(packValue(key));
        parts.push(packValue(value[key]));
      }
      return ethers.concat(parts);
    } else {
      throw new Error('Object too complex for simple msgpack');
    }
  } else {
    throw new Error(`Unsupported type: ${typeof value}`);
  }
}

function createCorrectActionHash(action, vaultAddress, nonce, expiresAfter) {
  // Pack the action using msgpack-like encoding
  const actionBytes = packValue(action);
  
  // Add nonce as 8 bytes big-endian
  const nonceBytes = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(nonce), 8));
  
  let dataArrays = [actionBytes, nonceBytes];
  
  // Add vault address byte
  if (vaultAddress === null) {
    dataArrays.push(new Uint8Array([0x00]));
  } else {
    dataArrays.push(new Uint8Array([0x01]));
    dataArrays.push(ethers.getBytes(vaultAddress));
  }
  
  // Add expires after if provided
  if (expiresAfter !== null) {
    dataArrays.push(new Uint8Array([0x00]));
    const expiresBytes = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(expiresAfter), 8));
    dataArrays.push(expiresBytes);
  }
  
  const combinedData = ethers.concat(dataArrays);
  return ethers.keccak256(combinedData);
}

async function testWithCorrectActionHash() {
  try {
    console.log('🔧 Testing with CORRECT Action Hash (msgpack-based)');
    console.log('==================================================');

    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('Agent Wallet:', wallet.address);
    
    // Create the same order action
    const orderAction = {
      type: "order",
      orders: [{
        a: 0,
        b: true,
        p: "0",
        s: "0.001",
        r: false,
        t: { limit: { tif: "Ioc" } }
      }],
      grouping: "na"
    };

    const nonce = Date.now();
    
    console.log('\n🔍 Creating CORRECT action hash...');
    
    // Use the correct msgpack-based action hash
    const correctActionHash = createCorrectActionHash(orderAction, null, nonce, null);
    console.log('Correct action hash:', correctActionHash);
    
    // Compare with our old method
    const oldActionString = JSON.stringify(orderAction);
    const oldActionBytes = ethers.toUtf8Bytes(oldActionString);
    const oldNonceBytes = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(nonce), 8));
    const oldCombinedData = ethers.concat([oldActionBytes, oldNonceBytes, new Uint8Array([0])]);
    const oldActionHash = ethers.keccak256(oldCombinedData);
    console.log('Old action hash:    ', oldActionHash);
    console.log('Hashes match:', correctActionHash === oldActionHash ? '✅' : '❌');
    
    // Create phantom agent with correct hash
    const phantomAgent = {
      source: 'a',
      connectionId: correctActionHash
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
    
    console.log('\n🔐 Signing with correct action hash...');
    const signature = await wallet.signTypedData(domain, types, phantomAgent);
    const splitSig = ethers.Signature.from(signature);
    
    // Verify signature recovery
    const recoveredAddress = ethers.verifyTypedData(domain, types, phantomAgent, signature);
    console.log('🔍 Signature Verification:');
    console.log('   Signer:', wallet.address);
    console.log('   Recovered:', recoveredAddress);
    console.log('   Match:', wallet.address.toLowerCase() === recoveredAddress.toLowerCase() ? '✅' : '❌');
    
    // Create order payload with correct signature
    const orderPayload = {
      action: orderAction,
      nonce,
      signature: {
        r: splitSig.r,
        s: splitSig.s,
        v: splitSig.v
      }
    };
    
    console.log('\n📋 Order Payload with Correct Hash:');
    console.log(JSON.stringify(orderPayload, null, 2));
    
    console.log('\n🚀 Sending order with CORRECT action hash...');
    
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const responseText = await response.text();
    console.log('📥 Response:', response.status, responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    console.log('📊 Parsed Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.status === "ok") {
      console.log('\n🎉 SUCCESS! Order executed with correct action hash!');
      console.log('✅ The msgpack-based action hash fixed the issue!');
    } else {
      console.log('\n❌ Still failed:', result.response || result.error || 'Unknown error');
      
      if (result.response && result.response.includes('does not exist')) {
        const expectedAddress = result.response.match(/0x[a-fA-F0-9]{40}/)?.[0];
        if (expectedAddress) {
          console.log('🔍 HyperLiquid still expects address:', expectedAddress);
          console.log('📝 This means the msgpack encoding might need further refinement.');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWithCorrectActionHash();
