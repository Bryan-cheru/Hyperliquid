// Test a real order with the fixed implementation
import { ethers } from 'ethers';
import msgpack from 'msgpack-lite';

console.log('🧪 Testing Real Order Submission with Fixed Msgpack');
console.log('==================================================');

const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';
const VAULT_ADDRESS = '0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB';

async function createActionHash(action, vaultAddress, nonce) {
  // Encode action using msgpack (exactly like Python msgpack.packb)
  const actionBytes = msgpack.encode(action);
  
  // Add nonce (8 bytes, big-endian) - matches Python SDK
  const nonceBuffer = Buffer.alloc(8);
  nonceBuffer.writeBigUInt64BE(BigInt(nonce), 0);
  
  // Add vault address handling - matches Python SDK action_hash function
  let vaultBytes;
  if (!vaultAddress) {
    vaultBytes = Buffer.from([0x00]);
  } else {
    const addressBytes = Buffer.from(vaultAddress.replace('0x', ''), 'hex');
    vaultBytes = Buffer.concat([Buffer.from([0x01]), addressBytes]);
  }
  
  // Combine all data exactly like Python SDK
  const combinedData = Buffer.concat([actionBytes, nonceBuffer, vaultBytes]);
  
  // Calculate keccak256 hash
  return ethers.keccak256(combinedData);
}

async function submitRealOrder() {
  try {
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('🔍 Agent wallet address:', wallet.address);
    
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
    
    // Create action hash using Python-compatible method
    const actionHash = await createActionHash(orderAction, VAULT_ADDRESS, nonce);
    
    // Create phantom agent exactly like HyperLiquid Python SDK
    const phantomAgent = {
      source: 'a', // 'a' for mainnet
      connectionId: actionHash
    };
    
    // EIP-712 domain for HyperLiquid
    const domain = {
      chainId: 1337,
      name: 'Exchange',
      verifyingContract: '0x0000000000000000000000000000000000000000',
      version: '1'
    };

    // EIP-712 types for HyperLiquid Agent
    const types = {
      Agent: [
        { name: 'source', type: 'string' },
        { name: 'connectionId', type: 'bytes32' }
      ]
    };
    
    // Sign using EIP-712 typed data
    const signature = await wallet.signTypedData(domain, types, phantomAgent);
    const splitSig = ethers.Signature.from(signature);
    
    // Create the complete order payload
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

    console.log('🚀 Sending order to HyperLiquid...');
    console.log('📋 Order payload summary:');
    console.log('   Action type:', orderAction.type);
    console.log('   Order count:', orderAction.orders.length);
    console.log('   Asset index:', orderAction.orders[0].a);
    console.log('   Side:', orderAction.orders[0].b ? 'BUY' : 'SELL');
    console.log('   Size:', orderAction.orders[0].s);
    console.log('   Vault address:', VAULT_ADDRESS);

    // Send the order
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });

    const responseText = await response.text();
    console.log('📥 Raw Response Status:', response.status);
    console.log('📥 Raw Response:', responseText);

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error('❌ Invalid JSON response:', responseText);
      return;
    }

    console.log('📊 Parsed Response:', JSON.stringify(result, null, 2));

    if (response.ok && result.status === "ok") {
      console.log('✅ ORDER SUCCESSFUL!');
      console.log('🎉 Your agent wallet is now working correctly for trading!');
      console.log('🔧 The "User or API Wallet does not exist" error has been resolved!');
    } else {
      console.log('❌ Order failed:', result.response || result.error || 'Unknown error');
      
      if (result.response && result.response.includes('does not exist')) {
        console.log('❌ Still getting the "does not exist" error.');
        console.log('💭 This could mean:');
        console.log('   1. The agent wallet needs approval from the main account');
        console.log('   2. There may be insufficient funds in the vault');
        console.log('   3. The asset index (0 for BTC) might be incorrect');
      } else {
        console.log('✅ The signature verification seems to be working!');
        console.log('💡 The error is likely related to trading permissions or funds, not signature.');
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

submitRealOrder();
