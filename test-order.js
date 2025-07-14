// Test a small order with your agent wallet
import { ethers } from 'ethers';

const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';

async function testOrder() {
  try {
    console.log('🧪 Testing Small Order with Agent Wallet');
    console.log('=========================================');

    const wallet = new ethers.Wallet(PRIVATE_KEY);
    
    // Create a very small test order for BTC
    const orderAction = {
      type: "order",
      orders: [{
        a: 0, // BTC asset index
        b: true, // buy
        p: "0", // market order (price = 0)
        s: "0.001", // very small size: 0.001 BTC
        r: false, // not reduce-only
        t: { limit: { tif: "Ioc" } } // Immediate or Cancel
      }],
      grouping: "na"
    };

    const nonce = Date.now();
    
    // Create action hash exactly like HyperLiquid Python SDK
    console.log('🔍 Creating action hash...');
    const actionString = JSON.stringify(orderAction);
    const actionBytes = ethers.toUtf8Bytes(actionString);
    const nonceBytes = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(nonce), 8));
    const combinedData = ethers.concat([actionBytes, nonceBytes, new Uint8Array([0])]);
    const actionHash = ethers.keccak256(combinedData);
    
    // Create phantom agent for signing
    const phantomAgent = {
      source: 'a',
      connectionId: actionHash
    };
    
    console.log('🔍 Signature Debug (before signing):');
    console.log('   Signer Wallet:', wallet.address);
    console.log('   Action Hash:', actionHash);
    console.log('   Phantom Agent:', phantomAgent);

    // HyperLiquid EIP-712 domain
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

    // Sign the order
    console.log('🔐 Signing order...');
    const signature = await wallet.signTypedData(domain, types, phantomAgent);
    const splitSig = ethers.Signature.from(signature);
    
    // Verify what address HyperLiquid will derive from this signature
    const recoveredFromSignature = ethers.verifyTypedData(domain, types, phantomAgent, signature);
    console.log('🔍 Signature Verification:');
    console.log('   Signer Wallet:', wallet.address);
    console.log('   Recovered Address:', recoveredFromSignature);
    console.log('   Addresses Match:', wallet.address.toLowerCase() === recoveredFromSignature.toLowerCase() ? '✅' : '❌');
    
    if (wallet.address.toLowerCase() !== recoveredFromSignature.toLowerCase()) {
      console.log('❌ CRITICAL: Signature recovery mismatch!');
      console.log('HyperLiquid will expect:', recoveredFromSignature);
      console.log('But we provided:', wallet.address);
      console.log('This explains the "User or API Wallet does not exist" error.');
    }

    // Create the complete order payload
    const orderPayload = {
      action: orderAction,
      nonce,
      signature: {
        r: splitSig.r,
        s: splitSig.s,
        v: splitSig.v
      }
    };

    console.log('📋 Order Payload:', JSON.stringify(orderPayload, null, 2));
    console.log('');
    console.log('🚀 Sending order to HyperLiquid...');

    // Send the order
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const responseText = await response.text();
    console.log('📥 Raw Response:', response.status, responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      throw new Error(`Invalid JSON response: ${responseText}`);
    }

    console.log('📊 Parsed Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.status === "ok") {
      console.log('✅ ORDER SUCCESSFUL!');
      console.log('🎉 Your agent wallet is working for trading!');
    } else {
      console.log('❌ Order failed:', result.response || result.error || 'Unknown error');
      
      if (result.response && result.response.includes('does not exist')) {
        console.log('');
        console.log('🔧 SOLUTION:');
        console.log('Your agent wallet needs to be approved by your main account.');
        console.log('Go to HyperLiquid app and approve this agent wallet for subaccount trading.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Uncomment the line below to test an actual order
testOrder();

console.log('🛡️  Test order script ready.');
console.log('To test an actual order, uncomment the testOrder() call at the bottom of this file.');
console.log('⚠️  This will attempt to place a real 0.001 BTC buy order!');
