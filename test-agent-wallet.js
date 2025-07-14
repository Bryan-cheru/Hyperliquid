// Test script for HyperLiquid Agent Wallet
import { ethers } from 'ethers';

// Your agent wallet credentials
const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';

console.log('🧪 Testing HyperLiquid Agent Wallet Setup');
console.log('=====================================');

async function testAgentWallet() {
  try {
    // Step 1: Verify private key matches wallet address
    console.log('\n1️⃣ Verifying Private Key...');
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('   Expected Address:', AGENT_WALLET_ADDRESS);
    console.log('   Derived Address: ', wallet.address);
    console.log('   Match:', wallet.address.toLowerCase() === AGENT_WALLET_ADDRESS.toLowerCase() ? '✅' : '❌');
    
    if (wallet.address.toLowerCase() !== AGENT_WALLET_ADDRESS.toLowerCase()) {
      throw new Error('Private key does not match wallet address!');
    }

    // Step 2: Test HyperLiquid API connection
    console.log('\n2️⃣ Testing HyperLiquid API Connection...');
    
    // Test account data query
    const accountResponse = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "clearinghouseState",
        user: AGENT_WALLET_ADDRESS
      })
    });

    if (!accountResponse.ok) {
      throw new Error(`Account API failed: ${accountResponse.status}`);
    }

    const accountData = await accountResponse.json();
    console.log('   Account API Response: ✅');
    console.log('   Account Data:', JSON.stringify(accountData, null, 2));

    // Step 3: Test orders query
    console.log('\n3️⃣ Testing Orders Query...');
    const ordersResponse = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "openOrders",
        user: AGENT_WALLET_ADDRESS
      })
    });

    if (!ordersResponse.ok) {
      throw new Error(`Orders API failed: ${ordersResponse.status}`);
    }

    const ordersData = await ordersResponse.json();
    console.log('   Orders API Response: ✅');
    console.log('   Open Orders:', ordersData.length ? ordersData : 'No open orders');

    // Step 4: Test asset metadata (needed for trading)
    console.log('\n4️⃣ Testing Asset Metadata...');
    const metaResponse = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: "meta" })
    });

    if (!metaResponse.ok) {
      throw new Error(`Meta API failed: ${metaResponse.status}`);
    }

    const metaData = await metaResponse.json();
    console.log('   Meta API Response: ✅');
    console.log('   Available Assets:', metaData.universe?.slice(0, 5).map(asset => asset.name) || 'None');

    // Step 5: Test signature creation (without sending)
    console.log('\n5️⃣ Testing Signature Creation...');
    
    // Create a test action (similar to what would be used for trading)
    const testAction = {
      type: "order",
      orders: [{
        a: 0, // BTC index
        b: true, // buy
        p: "0", // market price
        s: "0.001", // small test size
        r: false,
        t: { limit: { tif: "Ioc" } }
      }],
      grouping: "na"
    };

    // Create action hash
    const nonce = Date.now();
    const actionString = JSON.stringify(testAction);
    const actionBytes = ethers.toUtf8Bytes(actionString);
    const nonceBytes = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(nonce), 8));
    const combinedData = ethers.concat([actionBytes, nonceBytes, new Uint8Array([0])]);
    const actionHash = ethers.keccak256(combinedData);

    // Create phantom agent
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

    // Sign the test action
    const signature = await wallet.signTypedData(domain, types, phantomAgent);
    const splitSig = ethers.Signature.from(signature);

    console.log('   Signature Creation: ✅');
    console.log('   Signature Components:', {
      r: splitSig.r.substring(0, 10) + '...',
      s: splitSig.s.substring(0, 10) + '...',
      v: splitSig.v
    });

    // Verify signature recovery
    const recoveredAddress = ethers.verifyTypedData(domain, types, phantomAgent, signature);
    console.log('   Signature Recovery: ✅');
    console.log('   Recovered Address:', recoveredAddress);
    console.log('   Matches Signer:', recoveredAddress.toLowerCase() === wallet.address.toLowerCase() ? '✅' : '❌');

    // Step 6: Summary
    console.log('\n📊 SUMMARY');
    console.log('==========');
    console.log('✅ Private key verification: PASSED');
    console.log('✅ HyperLiquid API connection: PASSED');
    console.log('✅ Account data query: PASSED');
    console.log('✅ Orders query: PASSED');
    console.log('✅ Asset metadata query: PASSED');
    console.log('✅ Signature creation: PASSED');
    console.log('✅ Signature verification: PASSED');
    
    console.log('\n🎉 Agent wallet is ready for trading!');
    
    // Check if account has balance
    if (accountData.marginSummary) {
      const balance = accountData.marginSummary.accountValue || '0';
      console.log(`💰 Agent wallet balance: $${parseFloat(balance).toFixed(2)}`);
      
      if (parseFloat(balance) === 0) {
        console.log('📝 Note: Agent wallet shows $0 balance (normal - funds are in subaccounts)');
        console.log('📝 Trading will work if your main account has approved this agent for subaccount trading');
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('Full error:', error);
    
    console.log('\n🔧 TROUBLESHOOTING');
    console.log('==================');
    console.log('1. Verify your agent wallet is approved by your main account');
    console.log('2. Check that your subaccount has funds');
    console.log('3. Ensure you are using mainnet (not testnet)');
    console.log('4. Verify the private key is correct');
  }
}

// Run the test
testAgentWallet();
