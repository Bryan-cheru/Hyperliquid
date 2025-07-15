// Debug script to show exactly what payload should be sent
import { ethers } from 'ethers';
import msgpack from 'msgpack-lite';

const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';

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

async function showCorrectPayload() {
  console.log('🔍 CORRECT PAYLOAD STRUCTURE FOR HYPERLIQUID');
  console.log('===========================================');
  
  const orderAction = {
    type: "order",
    orders: [{
      a: 0, // BTC
      b: true, // buy
      p: "95000", // price
      s: "0.0001", // size
      r: false,
      t: { limit: { tif: "Gtc" } }
    }],
    grouping: "na"
  };
  
  const payload = await signAction(orderAction, PRIVATE_KEY, null);
  
  console.log('📦 EXACT PAYLOAD TO SEND:');
  console.log(JSON.stringify(payload, null, 2));
  
  console.log('\n🔑 KEY POINTS:');
  console.log('✅ vaultAddress: null (not undefined, not missing)');
  console.log('✅ action.type: "order"');
  console.log('✅ action.grouping: "na"');
  console.log('✅ orders[0].t: { limit: { tif: "Gtc" } }');
  console.log('✅ orders[0].p: string (not number)');
  console.log('✅ orders[0].s: string (not number)');
  console.log('✅ signature: { r, s, v } (not ethers format)');
  
  console.log('\n❌ COMMON MISTAKES THAT CAUSE 422 ERROR:');
  console.log('❌ vaultAddress: undefined (should be null)');
  console.log('❌ Missing vaultAddress field entirely');
  console.log('❌ orders[0].p as number (should be string)');
  console.log('❌ orders[0].s as number (should be string)');
  console.log('❌ Wrong signature format');
  console.log('❌ Extra fields in payload');
}

showCorrectPayload().catch(console.error);
