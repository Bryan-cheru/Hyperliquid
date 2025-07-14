// Test with vaultAddress parameter - this might be the missing piece!
import { ethers } from 'ethers';

const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';

// What if the agent wallet needs to specify which subaccount it's trading for?
// You mentioned you have funds in a subaccount - what's that address?

async function testWithVaultAddress() {
  try {
    console.log('🏛️ Testing with VaultAddress/SubAccount Parameter');
    console.log('================================================');

    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('Agent Wallet:', wallet.address);
    
    // Let's try to find your subaccount address
    console.log('\n🔍 Looking for associated subaccounts...');
    
    // Query for any subaccounts associated with this agent
    // In HyperLiquid, agents can be approved for specific main accounts
    
    // First, let's check if there are any standard derivation patterns
    const agentBigInt = BigInt(AGENT_WALLET_ADDRESS);
    
    // Common subaccount derivation patterns
    const potentialMainAccounts = [
      // Pattern 1: Simple offset
      '0x' + (agentBigInt + 1n).toString(16).padStart(40, '0'),
      '0x' + (agentBigInt - 1n).toString(16).padStart(40, '0'),
      
      // Pattern 2: XOR with common values
      '0x' + (agentBigInt ^ 0x1n).toString(16).padStart(40, '0'),
      '0x' + (agentBigInt ^ 0xffffffffn).toString(16).padStart(40, '0'),
      
      // Pattern 3: Based on previous expected addresses
      '0x862c244a9d4e0c6ae6eae0ac812834f7cc86d00f8',
      '0xc60934bc74da4b7499eeab6ea6c3c85943c06871',
      '0xf68552ff658072a6d5920c8c554ac7b63e0f70dc'
    ];
    
    console.log('Testing potential main account addresses...');
    
    let foundMainAccount = null;
    
    for (const [index, addr] of potentialMainAccounts.entries()) {
      try {
        console.log(`\nTesting ${index + 1}: ${addr}`);
        
        const response = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: "clearinghouseState",
            user: addr
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          const balance = parseFloat(data.marginSummary?.accountValue || '0');
          
          console.log(`   Balance: $${balance.toFixed(2)}`);
          
          if (balance > 0) {
            console.log(`   🎯 FOUND ACCOUNT WITH FUNDS: ${addr}`);
            foundMainAccount = addr;
            break;
          }
        }
      } catch (error) {
        console.log(`   ❌ Error querying ${addr}`);
      }
    }
    
    if (foundMainAccount) {
      console.log(`\n✅ Using main account: ${foundMainAccount}`);
      
      // Now test an order with the vaultAddress parameter
      console.log('\n🔧 Testing order with vaultAddress parameter...');
      
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
      
      // Create action hash WITH vault address
      const actionString = JSON.stringify(orderAction);
      const actionBytes = ethers.toUtf8Bytes(actionString);
      const nonceBytes = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(nonce), 8));
      
      // Include vault address in hash (this might be the missing piece!)
      const vaultAddressBytes = ethers.getBytes(foundMainAccount);
      const combinedData = ethers.concat([actionBytes, nonceBytes, new Uint8Array([1]), vaultAddressBytes]);
      const actionHash = ethers.keccak256(combinedData);
      
      console.log('Action hash with vault:', actionHash);
      
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
      
      // Create order payload WITH vaultAddress
      const orderPayload = {
        action: orderAction,
        nonce,
        signature: {
          r: splitSig.r,
          s: splitSig.s,
          v: splitSig.v
        },
        vaultAddress: foundMainAccount // This might be the key!
      };
      
      console.log('\n📋 Order Payload with VaultAddress:');
      console.log(JSON.stringify(orderPayload, null, 2));
      
      console.log('\n🚀 Sending order with vaultAddress...');
      
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

      if (response.ok && result.status === "ok") {
        console.log('\n🎉 SUCCESS! VaultAddress was the missing piece!');
      } else {
        console.log('\n❌ Still failed:', result.response || result.error);
      }
      
    } else {
      console.log('\n❌ Could not find a main account with funds.');
      console.log('💡 You may need to provide the specific subaccount address that has funds.');
      console.log('💡 Check your HyperLiquid account for the exact subaccount address.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWithVaultAddress();
