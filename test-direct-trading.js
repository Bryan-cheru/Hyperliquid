// Direct trading approach - skip registration, go straight to trading
import { ethers } from 'ethers';
import msgpack from 'msgpack-lite';

console.log('🚀 Direct HyperLiquid Trading Test');
console.log('==================================');

const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';
const VAULT_ADDRESS = '0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB';

async function createActionHash(action, vaultAddress, nonce) {
  const actionBytes = msgpack.encode(action);
  const nonceBuffer = Buffer.alloc(8);
  nonceBuffer.writeBigUInt64BE(BigInt(nonce), 0);
  
  let vaultBytes;
  if (!vaultAddress) {
    vaultBytes = Buffer.from([0x00]);
  } else {
    const addressBytes = Buffer.from(vaultAddress.replace('0x', ''), 'hex');
    vaultBytes = Buffer.concat([Buffer.from([0x01]), addressBytes]);
  }
  
  const combinedData = Buffer.concat([actionBytes, nonceBuffer, vaultBytes]);
  return ethers.keccak256(combinedData);
}

async function signAction(action, privateKey, vaultAddress = null) {
  const wallet = new ethers.Wallet(privateKey);
  const nonce = Date.now();
  
  const actionHash = await createActionHash(action, vaultAddress, nonce);
  
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

async function testDirectTrading() {
  console.log('💰 Account has $17.50 available for trading');
  console.log('🎯 Attempting small BTC trade...');
  
  // Try an even smaller order - $5 worth of BTC
  const orderAction = {
    type: "order",
    orders: [{
      a: 0, // BTC asset index
      b: true, // buy
      p: "0", // market order
      s: "0.00005", // ~$5 worth of BTC at ~$100k
      r: false,
      t: { limit: { tif: "Ioc" } }
    }],
    grouping: "na"
  };
  
  console.log('📋 Order Details:');
  console.log('   Asset: BTC');
  console.log('   Side: BUY');
  console.log('   Size: 0.00005 BTC (~$5)');
  console.log('   Available: $17.50');
  
  try {
    const payload = await signAction(orderAction, PRIVATE_KEY, VAULT_ADDRESS);
    
    console.log('🚀 Sending order to HyperLiquid...');
    
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('📥 Response Status:', response.status);
    console.log('📥 Response:', responseText);

    if (response.status === 200) {
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('📊 Parsed Response:', JSON.stringify(result, null, 2));
        
        if (result.status === "ok") {
          console.log('✅ 🎉 TRADE SUCCESSFUL! 🎉');
          console.log('🚀 Your HyperLiquid trading is now ACTIVE!');
          console.log('💯 The technical implementation is working perfectly!');
          return true;
        } else {
          console.log('❌ Trade failed:', result.response || result.error);
          return false;
        }
      } catch {
        console.log('❌ Invalid JSON response');
        return false;
      }
    } else {
      console.log('❌ HTTP Error:', response.status);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Also test with the main account directly (no vault)
async function testMainAccountTrading() {
  console.log('\n🔄 Testing with Main Account (No Vault)');
  console.log('=======================================');
  
  const orderAction = {
    type: "order",
    orders: [{
      a: 0, // BTC
      b: true, // buy
      p: "0", // market
      s: "0.00005", // tiny amount
      r: false,
      t: { limit: { tif: "Ioc" } }
    }],
    grouping: "na"
  };
  
  try {
    // Sign without vault address (direct account trading)
    const payload = await signAction(orderAction, PRIVATE_KEY, null);
    
    console.log('🚀 Testing direct account trading...');
    
    const response = await fetch('https://api.hyperliquid.xyz/exchange', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log('📥 Main Account Response:', responseText);

    if (response.status === 200) {
      const result = JSON.parse(responseText);
      if (result.status === "ok") {
        console.log('✅ MAIN ACCOUNT TRADING WORKS!');
        return true;
      }
    }
  } catch (error) {
    console.log('❌ Main account error:', error.message);
  }
  
  return false;
}

async function main() {
  console.log('🔍 Wallet:', AGENT_WALLET_ADDRESS);
  console.log('🏛️ Vault:', VAULT_ADDRESS);
  
  // Try vault trading first
  const vaultSuccess = await testDirectTrading();
  
  if (!vaultSuccess) {
    // Try main account trading
    const mainSuccess = await testMainAccountTrading();
    
    if (mainSuccess) {
      console.log('\n💡 Main account trading works!');
      console.log('🔧 For vault trading, you may need to register at:');
      console.log('🌐 https://app.hyperliquid.xyz');
    } else {
      console.log('\n📋 Summary of Issues:');
      console.log('⚠️ Vault trading: Needs registration');
      console.log('⚠️ Main account: Check response above');
      console.log('\n🔧 Next Steps:');
      console.log('1. Visit https://app.hyperliquid.xyz');
      console.log('2. Connect your wallet');
      console.log('3. Enable API trading');
      console.log('4. Register vault if needed');
    }
  }
}

main().catch(console.error);
