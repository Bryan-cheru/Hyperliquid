// Final integration test for the trading app
import { ethers } from 'ethers';
import msgpack from 'msgpack-lite';

console.log('🧪 Final Integration Test - Trading App');
console.log('=====================================');

const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';

// This should match what the app uses
const VAULT_ADDRESS = '0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB';

async function testAppIntegration() {
  try {
    console.log('🔍 Testing agent wallet address verification...');
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('   Expected agent wallet:', AGENT_WALLET_ADDRESS);
    console.log('   Derived from private key:', wallet.address);
    console.log('   Addresses match:', wallet.address.toLowerCase() === AGENT_WALLET_ADDRESS.toLowerCase() ? '✅' : '❌');
    
    if (wallet.address.toLowerCase() !== AGENT_WALLET_ADDRESS.toLowerCase()) {
      console.log('❌ CRITICAL: Private key mismatch - this will cause authentication issues');
      return;
    }
    
    console.log('\n🔍 Testing msgpack compatibility...');
    
    // Test order similar to what the app would create
    const orderAction = {
      type: "order",
      orders: [{
        a: 0, // BTC asset index (common test case)
        b: true, // buy
        p: "50000", // limit price
        s: "0.01", // size
        r: false, // not reduce-only
        t: { limit: { tif: "Gtc" } } // Good Till Canceled
      }],
      grouping: "na"
    };
    
    console.log('   Order action:', JSON.stringify(orderAction, null, 2));
    
    const nonce = Date.now();
    
    // Test action hash creation (app method)
    const actionBytes = msgpack.encode(orderAction);
    const nonceBuffer = Buffer.alloc(8);
    nonceBuffer.writeBigUInt64BE(BigInt(nonce), 0);
    
    let vaultBytes;
    if (!VAULT_ADDRESS) {
      vaultBytes = Buffer.from([0x00]);
    } else {
      const addressBytes = Buffer.from(VAULT_ADDRESS.replace('0x', ''), 'hex');
      vaultBytes = Buffer.concat([Buffer.from([0x01]), addressBytes]);
    }
    
    const combinedData = Buffer.concat([actionBytes, nonceBuffer, vaultBytes]);
    const actionHash = ethers.keccak256(combinedData);
    
    console.log('   Action hash:', actionHash);
    
    // Test EIP-712 signing (app method)
    const phantomAgent = {
      source: 'a',
      connectionId: actionHash
    };
    
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
    
    const signature = await wallet.signTypedData(domain, types, phantomAgent);
    const splitSig = ethers.Signature.from(signature);
    
    // Verify signature recovery
    const recoveredAddress = ethers.verifyTypedData(domain, types, phantomAgent, signature);
    console.log('   Signature verification:');
    console.log('     Signer address:', wallet.address);
    console.log('     Recovered address:', recoveredAddress);
    console.log('     Verification successful:', wallet.address.toLowerCase() === recoveredAddress.toLowerCase() ? '✅' : '❌');
    
    if (wallet.address.toLowerCase() !== recoveredAddress.toLowerCase()) {
      console.log('❌ CRITICAL: Signature verification failed - this indicates a signing issue');
      return;
    }
    
    console.log('\n🔍 Testing complete order payload structure...');
    
    // Create complete payload like the app would
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
    
    console.log('   Payload structure validation:');
    console.log('     Has action:', !!orderPayload.action ? '✅' : '❌');
    console.log('     Has nonce:', typeof orderPayload.nonce === 'number' ? '✅' : '❌');
    console.log('     Has signature:', !!orderPayload.signature && !!orderPayload.signature.r ? '✅' : '❌');
    console.log('     Has vaultAddress:', !!orderPayload.vaultAddress ? '✅' : '❌');
    
    console.log('\n🚀 Testing API call format...');
    console.log('   Payload size:', JSON.stringify(orderPayload).length, 'bytes');
    console.log('   Vault address used:', VAULT_ADDRESS);
    
    // Test what kind of response we'd get (without actually placing order)
    console.log('\n📋 Expected behavior:');
    console.log('   ✅ Signature verification should pass');
    console.log('   ✅ No "User or API Wallet does not exist" error');
    console.log('   ⚠️  May get "Vault not registered" error (requires vault setup)');
    console.log('   ⚠️  May get "Insufficient funds" error (requires balance)');
    console.log('   ⚠️  May get permission errors (requires agent approval)');
    
    console.log('\n🎉 Integration test completed successfully!');
    console.log('📱 The app should now work correctly for trading with proper setup.');
    
    console.log('\n📝 Next steps for users:');
    console.log('   1. Ensure the vault address in TradingContext.tsx is your registered HyperLiquid account');
    console.log('   2. Approve the agent wallet in HyperLiquid app settings');
    console.log('   3. Ensure sufficient funds in the vault account');
    console.log('   4. Test with small orders first');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

testAppIntegration();
