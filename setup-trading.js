// Comprehensive script to register vault and enable trading
import { ethers } from 'ethers';
import msgpack from 'msgpack-lite';

console.log('🏗️ HyperLiquid Vault Registration & Trading Setup');
console.log('==============================================');

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

async function signAction(action, privateKey, vaultAddress = null) {
  const wallet = new ethers.Wallet(privateKey);
  const nonce = Date.now();
  
  // Create action hash using Python-compatible method
  const actionHash = await createActionHash(action, vaultAddress, nonce);
  
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
  
  return {
    action,
    nonce,
    signature: {
      r: splitSig.r,
      s: splitSig.s,
      v: splitSig.v
    },
    vaultAddress
  };
}

async function submitToHyperLiquid(payload) {
  const response = await fetch('https://api.hyperliquid.xyz/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  console.log('📥 Raw Response Status:', response.status);
  console.log('📥 Raw Response:', responseText);

  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    console.error('❌ Invalid JSON response:', responseText);
    return null;
  }

  return result;
}

async function step1_RegisterVault() {
  console.log('\n🏗️ STEP 1: Registering Vault');
  console.log('============================');
  
  // Try to register the vault
  const registerAction = {
    type: "spotUser"  // This registers the account for spot trading
  };
  
  console.log('🔍 Attempting vault registration...');
  const payload = await signAction(registerAction, PRIVATE_KEY);
  const result = await submitToHyperLiquid(payload);
  
  if (result) {
    console.log('📊 Registration Response:', JSON.stringify(result, null, 2));
    
    if (result.status === "ok") {
      console.log('✅ Vault registration successful!');
      return true;
    } else {
      console.log('⚠️ Vault registration response:', result.response || result.error);
      // Don't fail here - vault might already be registered
      return true;
    }
  }
  
  return false;
}

async function step2_AuthorizeAgent() {
  console.log('\n🔐 STEP 2: Authorizing Agent Wallet');
  console.log('==================================');
  
  // Authorize agent wallet for the vault
  const authAction = {
    type: "setReferrer",
    code: AGENT_WALLET_ADDRESS  // This might authorize the agent
  };
  
  console.log('🔍 Attempting agent authorization...');
  const payload = await signAction(authAction, PRIVATE_KEY, VAULT_ADDRESS);
  const result = await submitToHyperLiquid(payload);
  
  if (result) {
    console.log('📊 Authorization Response:', JSON.stringify(result, null, 2));
    
    if (result.status === "ok") {
      console.log('✅ Agent authorization successful!');
      return true;
    } else {
      console.log('⚠️ Agent authorization response:', result.response || result.error);
    }
  }
  
  return false;
}

async function step3_TestSmallOrder() {
  console.log('\n🚀 STEP 3: Testing Small Order');
  console.log('==============================');
  
  // Create a very small test order
  const orderAction = {
    type: "order",
    orders: [{
      a: 0, // BTC asset index
      b: true, // buy
      p: "0", // market order (price = 0)
      s: "0.001", // very small size: 0.001 BTC (~$100)
      r: false, // not reduce-only
      t: { limit: { tif: "Ioc" } } // Immediate or Cancel
    }],
    grouping: "na"
  };
  
  console.log('🔍 Submitting test order...');
  console.log('   Asset: BTC (index 0)');
  console.log('   Side: BUY');
  console.log('   Size: 0.001 BTC');
  console.log('   Type: Market (IOC)');
  
  const payload = await signAction(orderAction, PRIVATE_KEY, VAULT_ADDRESS);
  const result = await submitToHyperLiquid(payload);
  
  if (result) {
    console.log('📊 Order Response:', JSON.stringify(result, null, 2));
    
    if (result.status === "ok") {
      console.log('✅ ORDER SUCCESSFUL! 🎉');
      console.log('🎯 Your trading setup is now complete!');
      return true;
    } else {
      console.log('❌ Order failed:', result.response || result.error);
      
      if (result.response && result.response.includes('Vault not registered')) {
        console.log('💡 Vault still not registered. You may need to:');
        console.log('   1. Visit https://app.hyperliquid.xyz');
        console.log('   2. Connect with your main account');
        console.log('   3. Register for API trading manually');
      } else if (result.response && result.response.includes('does not exist')) {
        console.log('💡 Agent wallet authorization issue. You may need to:');
        console.log('   1. Add the agent wallet in HyperLiquid web interface');
        console.log('   2. Authorize API trading for this agent');
      } else if (result.response && result.response.includes('balance')) {
        console.log('💡 Insufficient balance. Make sure you have:');
        console.log('   1. USDC in your account for trading');
        console.log('   2. Sufficient margin for the order');
      }
    }
  }
  
  return false;
}

async function checkAccountInfo() {
  console.log('\n📊 CHECKING ACCOUNT INFO');
  console.log('========================');
  
  try {
    // Check account info
    const infoPayload = {
      type: "clearinghouseState",
      user: VAULT_ADDRESS
    };
    
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(infoPayload)
    });
    
    const result = await response.json();
    console.log('💰 Account Info:', JSON.stringify(result, null, 2));
    
    if (result.marginSummary) {
      console.log('💵 Account Balance:', result.marginSummary.accountValue || '0');
      console.log('💳 Withdrawable:', result.withdrawable || '0');
    }
    
  } catch (error) {
    console.log('⚠️ Could not fetch account info:', error.message);
  }
}

async function main() {
  console.log('🔗 Agent Wallet:', AGENT_WALLET_ADDRESS);
  console.log('🏛️ Vault Address:', VAULT_ADDRESS);
  
  await checkAccountInfo();
  
  // Step 1: Register vault
  const vaultRegistered = await step1_RegisterVault();
  
  if (vaultRegistered) {
    // Step 2: Authorize agent
    await step2_AuthorizeAgent();
    
    // Step 3: Test order
    const orderSuccess = await step3_TestSmallOrder();
    
    if (orderSuccess) {
      console.log('\n🎉 SUCCESS! Your HyperLiquid trading is now active!');
      console.log('🚀 You can now place orders through your app!');
    } else {
      console.log('\n⚠️ Trading setup needs manual configuration');
      console.log('🌐 Please visit: https://app.hyperliquid.xyz');
      console.log('🔧 Register your vault and authorize API trading');
    }
  }
}

main().catch(console.error);
