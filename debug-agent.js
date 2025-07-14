// Deep debug script for HyperLiquid agent wallet issue
import { ethers } from 'ethers';

const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';

async function deepDebug() {
  try {
    console.log('🔬 Deep Debug: HyperLiquid Agent Wallet Issue');
    console.log('==============================================');

    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('Agent Wallet:', wallet.address);
    
    // Test 1: Check what HyperLiquid sees for this agent wallet
    console.log('\n1️⃣ Testing Agent Wallet Recognition...');
    
    const agentInfoResponse = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: "clearinghouseState",
        user: AGENT_WALLET_ADDRESS
      })
    });
    
    const agentInfo = await agentInfoResponse.json();
    console.log('Agent wallet info:', agentInfo);
    
    // Test 2: Try different action hash methods
    console.log('\n2️⃣ Testing Different Action Hash Methods...');
    
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
    
    // Method 1: Our current method
    console.log('\nMethod 1: Current implementation');
    const actionString1 = JSON.stringify(orderAction);
    const actionBytes1 = ethers.toUtf8Bytes(actionString1);
    const nonceBytes1 = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(nonce), 8));
    const combinedData1 = ethers.concat([actionBytes1, nonceBytes1, new Uint8Array([0])]);
    const actionHash1 = ethers.keccak256(combinedData1);
    console.log('   Action hash:', actionHash1);
    
    // Method 2: Try without the extra 0 byte
    console.log('\nMethod 2: Without extra byte');
    const combinedData2 = ethers.concat([actionBytes1, nonceBytes1]);
    const actionHash2 = ethers.keccak256(combinedData2);
    console.log('   Action hash:', actionHash2);
    
    // Method 3: Try with msgpack-like encoding
    console.log('\nMethod 3: Alternative encoding');
    const actionString3 = JSON.stringify(orderAction, null, 0); // No spaces
    const actionBytes3 = ethers.toUtf8Bytes(actionString3);
    const combinedData3 = ethers.concat([actionBytes3, nonceBytes1, new Uint8Array([0])]);
    const actionHash3 = ethers.keccak256(combinedData3);
    console.log('   Action hash:', actionHash3);
    
    // Test 3: Create signatures for each method and see what addresses they derive
    console.log('\n3️⃣ Testing Signature Recovery for Each Method...');
    
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
    
    for (let i = 1; i <= 3; i++) {
      const actionHash = i === 1 ? actionHash1 : i === 2 ? actionHash2 : actionHash3;
      const phantomAgent = {
        source: 'a',
        connectionId: actionHash
      };
      
      const signature = await wallet.signTypedData(domain, types, phantomAgent);
      const recovered = ethers.verifyTypedData(domain, types, phantomAgent, signature);
      
      console.log(`\nMethod ${i}:`);
      console.log('   Action Hash:', actionHash);
      console.log('   Signer:', wallet.address);
      console.log('   Recovered:', recovered);
      console.log('   Match:', wallet.address.toLowerCase() === recovered.toLowerCase() ? '✅' : '❌');
    }
    
    // Test 4: Try different source values
    console.log('\n4️⃣ Testing Different Source Values...');
    
    const sources = ['a', 'b', '0', '1', 'mainnet'];
    
    for (const source of sources) {
      const phantomAgent = {
        source: source,
        connectionId: actionHash1
      };
      
      const signature = await wallet.signTypedData(domain, types, phantomAgent);
      const recovered = ethers.verifyTypedData(domain, types, phantomAgent, signature);
      
      console.log(`\nSource "${source}":`);
      console.log('   Recovered:', recovered);
      console.log('   Match:', wallet.address.toLowerCase() === recovered.toLowerCase() ? '✅' : '❌');
    }
    
    // Test 5: Check if there's a specific pattern in the "expected" addresses
    console.log('\n5️⃣ Analysis of Expected Addresses...');
    const expectedAddresses = [
      '0x862c244a9d4e0c6ae6eae0ac812834f7cc86d00f8',
      '0xc60934bc74da4b7499eeab6ea6c3c85943c06871'
    ];
    
    console.log('Expected addresses from previous attempts:');
    expectedAddresses.forEach((addr, i) => {
      console.log(`   Attempt ${i + 1}: ${addr}`);
    });
    
    console.log('\nLet\'s see if these follow any pattern...');
    
    // Test 6: Try to reverse engineer what HyperLiquid might be doing
    console.log('\n6️⃣ Reverse Engineering Attempt...');
    
    // Maybe HyperLiquid uses the nonce as part of address derivation?
    console.log('Testing if nonce affects address derivation...');
    
    const testNonces = [nonce, nonce + 1, Math.floor(nonce / 1000) * 1000];
    
    for (const testNonce of testNonces) {
      const testNonceBytes = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(testNonce), 8));
      const testCombinedData = ethers.concat([actionBytes1, testNonceBytes, new Uint8Array([0])]);
      const testActionHash = ethers.keccak256(testCombinedData);
      
      const phantomAgent = {
        source: 'a',
        connectionId: testActionHash
      };
      
      const signature = await wallet.signTypedData(domain, types, phantomAgent);
      const recovered = ethers.verifyTypedData(domain, types, phantomAgent, signature);
      
      console.log(`   Nonce ${testNonce}: ${recovered}`);
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

deepDebug();
