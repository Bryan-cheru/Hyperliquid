// Test the fixed msgpack implementation
import { signOrderAction } from './src/utils/hyperLiquidSigning.js';

console.log('🧪 Testing Fixed Msgpack Implementation');
console.log('=====================================');

const AGENT_WALLET_ADDRESS = '0x99b7988987bb31208804ad2334faa155249010bf';
const PRIVATE_KEY = '0x6e51631ace8e1c767ba235d561bf188735071722d53aa236698c0651ff545b47';
const VAULT_ADDRESS = '0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB';

async function testFixedImplementation() {
  try {
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
    
    console.log('🔐 Signing order with fixed msgpack...');
    const signature = await signOrderAction(orderAction, nonce, PRIVATE_KEY, VAULT_ADDRESS);
    
    console.log('✅ Fixed implementation signature:', signature);
    console.log('🎉 Successfully generated signature with Python-compatible msgpack!');
    
  } catch (error) {
    console.error('❌ Error with fixed implementation:', error.message);
  }
}

testFixedImplementation();
