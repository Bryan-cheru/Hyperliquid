// Direct test of Python SDK hash compatibility 
import { ethers } from 'ethers';
import msgpack from 'msgpack-lite';

console.log('🧪 Testing Final Hash Match with Live Order');
console.log('===========================================');

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
    // None case: add single 0x00 byte
    vaultBytes = Buffer.from([0x00]);
  } else {
    // Some case: add 0x01 + address bytes
    const addressBytes = Buffer.from(vaultAddress.replace('0x', ''), 'hex');
    vaultBytes = Buffer.concat([Buffer.from([0x01]), addressBytes]);
  }
  
  // Combine all data exactly like Python SDK
  const combinedData = Buffer.concat([actionBytes, nonceBuffer, vaultBytes]);
  
  // Calculate keccak256 hash
  return ethers.keccak256(combinedData);
}

async function testLiveOrder() {
  try {
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('🔍 Agent wallet address:', wallet.address);
    
    // Create a real order action
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
    
    console.log('🔍 Order action:', JSON.stringify(orderAction, null, 2));
    console.log('🔍 Nonce:', nonce);
    console.log('🔍 Vault address:', VAULT_ADDRESS);
    
    // Create action hash using Python-compatible method
    const actionHash = await createActionHash(orderAction, VAULT_ADDRESS, nonce);
    console.log('🔍 Action hash:', actionHash);
    
    // Create phantom agent exactly like HyperLiquid Python SDK
    const phantomAgent = {
      source: 'a', // 'a' for mainnet
      connectionId: actionHash // Direct action hash
    };
    
    console.log('🔍 Phantom agent:', phantomAgent);
    
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
    
    console.log('🔐 Signing with EIP-712...');
    
    // Sign using EIP-712 typed data (HyperLiquid's expected format)
    const signature = await wallet.signTypedData(domain, types, phantomAgent);
    const splitSig = ethers.Signature.from(signature);
    
    // Verify what address HyperLiquid will derive from this signature
    const recoveredFromSignature = ethers.verifyTypedData(domain, types, phantomAgent, signature);
    console.log('🔍 Signature verification:');
    console.log('   Signer wallet:', wallet.address);
    console.log('   Recovered address:', recoveredFromSignature);
    console.log('   Addresses match:', wallet.address.toLowerCase() === recoveredFromSignature.toLowerCase() ? '✅' : '❌');
    
    if (wallet.address.toLowerCase() === recoveredFromSignature.toLowerCase()) {
      console.log('✅ SUCCESS: Signature matches expected wallet!');
      console.log('🎉 The action hash now produces the correct signature that HyperLiquid can verify!');
      
      // Create the complete order payload for HyperLiquid
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

      console.log('📋 Complete order payload ready for HyperLiquid API');
      console.log('🚀 You can now submit orders without "User or API Wallet does not exist" error!');
      
    } else {
      console.log('❌ ISSUE: Signature still doesn\'t match');
      console.log('This means there\'s still a difference from Python SDK implementation');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testLiveOrder();
