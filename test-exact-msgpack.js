// Test exact Python SDK action_hash logic
import { ethers } from 'ethers';
import msgpack from 'msgpack-lite';

console.log('🧪 Testing Exact Python SDK Action Hash Logic');
console.log('==============================================');

// Test case from Python SDK
const TIMESTAMP = 1677777606040;
const ORDER_REQUEST = {
  coin: "ETH",
  is_buy: true,
  sz: 0.0147,
  limit_px: 1670.1,
  reduce_only: false,
  order_type: { limit: { tif: "Ioc" } },
  cloid: null
};

// Convert to order wire format (from order_request_to_order_wire)
const ORDER_WIRE = {
  a: 4, // ETH asset index
  b: true,
  p: "1670.1",
  s: "0.0147", 
  r: false,
  t: { limit: { tif: "Ioc" } }
};

// Convert to order action (from order_wires_to_order_action)
const ORDER_ACTION = {
  type: "order",
  orders: [ORDER_WIRE],
  grouping: "na"
};

console.log('📋 Order action:', JSON.stringify(ORDER_ACTION, null, 2));

// Use Python's msgpack to pack the action exactly like Python SDK
console.log('🔍 Using msgpack-lite (closest to Python msgpack)...');
const actionBytes = msgpack.encode(ORDER_ACTION);

console.log('📊 Action bytes length:', actionBytes.length);
console.log('📊 Action bytes (hex):', Buffer.from(actionBytes).toString('hex'));

// Add nonce (8 bytes, big-endian)
const nonceBuffer = Buffer.alloc(8);
nonceBuffer.writeBigUInt64BE(BigInt(TIMESTAMP), 0);

console.log('📊 Nonce:', TIMESTAMP);
console.log('📊 Nonce bytes:', nonceBuffer.toString('hex'));

// Add vault_address (None in test case)
const vaultAddressBytes = Buffer.from([0x00]); // None = 0x00

console.log('📊 Vault address bytes:', vaultAddressBytes.toString('hex'));

// expires_after is None in test case, so no additional bytes

// Combine all data
const allData = Buffer.concat([actionBytes, nonceBuffer, vaultAddressBytes]);

console.log('📊 Combined data length:', allData.length);
console.log('📊 Combined data (hex):', allData.toString('hex'));

// Calculate keccak256 hash
const hash = ethers.keccak256(allData);

console.log('🔍 Results:');
console.log('   Expected hash: 0x0fcbeda5ae3c4950a548021552a4fea2226858c4453571bf3f24ba017eac2908');
console.log('   Calculated hash:', hash);
console.log('   Matches Python SDK:', hash === '0x0fcbeda5ae3c4950a548021552a4fea2226858c4453571bf3f24ba017eac2908' ? '✅' : '❌');
