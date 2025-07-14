// Debug script to compare different encoding approaches
import { ethers } from 'ethers';

const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';
const VAULT_ADDRESS = '0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB';

console.log('🔍 Debug: Comparing Encoding Approaches');
console.log('========================================');

// Test different approaches to see which one HyperLiquid expects

async function testDifferentApproaches() {
  const wallet = new ethers.Wallet(PRIVATE_KEY);
  console.log('🔑 Wallet address:', wallet.address);

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

  // EIP-712 setup
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

  console.log('\n🧪 Test 1: No vault address (main account trading for itself)');
  try {
    // Simple JSON hash approach
    const actionString = JSON.stringify(orderAction);
    const actionBytes = ethers.toUtf8Bytes(actionString);
    const nonceBytes = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(nonce), 8));
    const combinedData = ethers.concat([actionBytes, nonceBytes, new Uint8Array([0])]);
    const actionHash = ethers.keccak256(combinedData);

    const phantomAgent = {
      source: 'a',
      connectionId: actionHash
    };

    const signature = await wallet.signTypedData(domain, types, phantomAgent);
    const splitSig = ethers.Signature.from(signature);
    
    const recovered = ethers.verifyTypedData(domain, types, phantomAgent, signature);
    console.log('   Action hash:', actionHash);
    console.log('   Expected address:', wallet.address);
    console.log('   Recovered address:', recovered);
    console.log('   Match:', wallet.address === recovered ? '✅' : '❌');

    // Test with HyperLiquid
    const payload = {
      action: orderAction,
      nonce,
      signature: { r: splitSig.r, s: splitSig.s, v: splitSig.v }
    };

    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.text();
    console.log('   HyperLiquid response:', result.substring(0, 200));
    
    if (result.includes('does not exist')) {
      const match = result.match(/0x[a-fA-F0-9]{40}/);
      if (match) {
        console.log('   HyperLiquid recovered:', match[0]);
      }
    }

  } catch (error) {
    console.log('   Error:', error.message);
  }

  console.log('\n🧪 Test 2: Using same account as vault (self-trading)');
  try {
    // Use wallet address as vault address
    const actionString = JSON.stringify(orderAction);
    const actionBytes = ethers.toUtf8Bytes(actionString);
    const nonceBytes = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(nonce + 1), 8));
    const vaultBytes = ethers.concat([new Uint8Array([1]), ethers.getBytes(wallet.address)]);
    const combinedData = ethers.concat([actionBytes, nonceBytes, vaultBytes]);
    const actionHash = ethers.keccak256(combinedData);

    const phantomAgent = {
      source: 'a',
      connectionId: actionHash
    };

    const signature = await wallet.signTypedData(domain, types, phantomAgent);
    const splitSig = ethers.Signature.from(signature);
    
    const recovered = ethers.verifyTypedData(domain, types, phantomAgent, signature);
    console.log('   Action hash:', actionHash);
    console.log('   Expected address:', wallet.address);
    console.log('   Recovered address:', recovered);
    console.log('   Match:', wallet.address === recovered ? '✅' : '❌');

    // Test with HyperLiquid
    const payload = {
      action: orderAction,
      nonce: nonce + 1,
      signature: { r: splitSig.r, s: splitSig.s, v: splitSig.v },
      vaultAddress: wallet.address
    };

    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.text();
    console.log('   HyperLiquid response:', result.substring(0, 200));
    
    if (result.includes('does not exist')) {
      const match = result.match(/0x[a-fA-F0-9]{40}/);
      if (match) {
        console.log('   HyperLiquid recovered:', match[0]);
      }
    }

  } catch (error) {
    console.log('   Error:', error.message);
  }

  console.log('\n🧪 Test 3: Simple message signing (not EIP-712)');
  try {
    const actionString = JSON.stringify(orderAction);
    const message = `${actionString}${nonce + 2}${wallet.address}`;
    const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
    
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));
    const splitSig = ethers.Signature.from(signature);
    
    const recovered = ethers.verifyMessage(ethers.getBytes(messageHash), signature);
    console.log('   Message hash:', messageHash);
    console.log('   Expected address:', wallet.address);
    console.log('   Recovered address:', recovered);
    console.log('   Match:', wallet.address === recovered ? '✅' : '❌');

    // Test with HyperLiquid
    const payload = {
      action: orderAction,
      nonce: nonce + 2,
      signature: { r: splitSig.r, s: splitSig.s, v: splitSig.v },
      vaultAddress: wallet.address
    };

    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.text();
    console.log('   HyperLiquid response:', result.substring(0, 200));

  } catch (error) {
    console.log('   Error:', error.message);
  }
}

testDifferentApproaches();
