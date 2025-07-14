// Test subaccount relationships and agent approvals
import { ethers } from 'ethers';

const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';

async function testSubaccountRelations() {
  try {
    console.log('🔍 Testing Subaccount Relations & Agent Approvals');
    console.log('=================================================');

    // Test 1: Check what accounts/subaccounts this agent is approved for
    console.log('\n1️⃣ Checking Agent Approvals...');
    
    // Try to find any reference to our agent wallet in the system
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    console.log('Agent Wallet:', wallet.address);
    
    // Test 2: Try to query subaccount information
    console.log('\n2️⃣ Looking for Associated Accounts...');
    
    // Sometimes agents are tied to specific master accounts
    // Let's see if we can find any patterns in the expected addresses
    const expectedAddresses = [
      '0x862c244a9d4e0c6ae6eae0ac812834f7cc86d00f8',
      '0xc60934bc74da4b7499eeab6ea6c3c85943c06871'
    ];
    
    console.log('Checking if expected addresses have account data...');
    
    for (const [index, addr] of expectedAddresses.entries()) {
      console.log(`\nChecking expected address ${index + 1}: ${addr}`);
      
      try {
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
          console.log(`   Response:`, data);
          
          if (data.marginSummary && parseFloat(data.marginSummary.accountValue) > 0) {
            console.log(`   💰 This address has funds: $${data.marginSummary.accountValue}`);
          }
        } else {
          console.log(`   ❌ No data for ${addr}`);
        }
      } catch (error) {
        console.log(`   ❌ Error querying ${addr}:`, error.message);
      }
    }
    
    // Test 3: Try to find the pattern in address derivation
    console.log('\n3️⃣ Analyzing Address Patterns...');
    
    // Convert addresses to see if there's a pattern
    expectedAddresses.forEach((addr, i) => {
      console.log(`Expected ${i + 1}: ${addr}`);
      console.log(`   As number: ${BigInt(addr)}`);
      console.log(`   XOR with agent: ${BigInt(addr) ^ BigInt(AGENT_WALLET_ADDRESS)}`);
    });
    
    // Test 4: Check if this might be a vault or subaccount address
    console.log('\n4️⃣ Testing Vault/Subaccount Theory...');
    
    // Maybe the agent is associated with a specific subaccount/vault
    // and HyperLiquid derives the address based on some relationship
    
    const agentBigInt = BigInt(AGENT_WALLET_ADDRESS);
    console.log('Agent address as BigInt:', agentBigInt);
    
    // Try some common derivation patterns
    const patterns = [
      agentBigInt + 1n,
      agentBigInt + 2n,
      agentBigInt ^ 0x1n,
      agentBigInt ^ 0xffffffffn,
      BigInt(ethers.keccak256(ethers.toUtf8Bytes(AGENT_WALLET_ADDRESS))),
      BigInt(ethers.keccak256(ethers.getBytes(AGENT_WALLET_ADDRESS)))
    ];
    
    patterns.forEach((pattern, i) => {
      const derivedAddr = '0x' + pattern.toString(16).padStart(40, '0');
      console.log(`Pattern ${i + 1}: ${derivedAddr}`);
      
      // Check if this matches any expected address
      if (expectedAddresses.some(exp => exp.toLowerCase() === derivedAddr.toLowerCase())) {
        console.log(`   🎯 MATCH! This pattern generated an expected address!`);
      }
    });
    
    // Test 5: Try to create an approve agent transaction to see what happens
    console.log('\n5️⃣ Testing Agent Approval Transaction...');
    
    const approveAction = {
      type: "approveAgent",
      agent: AGENT_WALLET_ADDRESS
    };
    
    const nonce = Date.now();
    const actionString = JSON.stringify(approveAction);
    const actionBytes = ethers.toUtf8Bytes(actionString);
    const nonceBytes = ethers.getBytes(ethers.zeroPadValue(ethers.toBeHex(nonce), 8));
    const combinedData = ethers.concat([actionBytes, nonceBytes, new Uint8Array([0])]);
    const actionHash = ethers.keccak256(combinedData);
    
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
    
    const approveSignature = await wallet.signTypedData(domain, types, phantomAgent);
    const approveSplitSig = ethers.Signature.from(approveSignature);
    
    const approvePayload = {
      action: approveAction,
      nonce,
      signature: {
        r: approveSplitSig.r,
        s: approveSplitSig.s,
        v: approveSplitSig.v
      }
    };
    
    console.log('Approve agent payload:', JSON.stringify(approvePayload, null, 2));
    
    // Don't actually send this, just see what the payload looks like
    console.log('\n📝 Note: Not sending approve transaction (might duplicate existing approval)');

  } catch (error) {
    console.error('❌ Error in subaccount testing:', error);
  }
}

testSubaccountRelations();
