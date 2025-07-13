// HyperLiquid Signature Utility
// Based on official documentation: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint

/**
 * Creates a placeholder signature for HyperLiquid API calls
 * 
 * ⚠️  WARNING: This is a placeholder implementation that will be rejected by HyperLiquid!
 * 
 * For production trading, you need to:
 * 
 * 1. Install ethers.js:
 *    npm install ethers
 * 
 * 2. Implement proper EIP-712 structured data signing:
 *    ```typescript
 *    import { ethers } from 'ethers';
 *    
 *    export async function signL1Action(action: any, nonce: number, privateKey: string) {
 *      const wallet = new ethers.Wallet(privateKey);
 *      
 *      // HyperLiquid EIP-712 domain
 *      const domain = {
 *        name: 'HyperLiquid',
 *        version: '1',
 *        chainId: 42161, // Arbitrum One
 *        verifyingContract: '0x0000000000000000000000000000000000000000'
 *      };
 *      
 *      // Type definitions for L1 action signing
 *      const types = {
 *        Agent: [
 *          { name: 'source', type: 'string' },
 *          { name: 'connectionId', type: 'bytes32' }
 *        ]
 *      };
 *      
 *      // Message to sign
 *      const value = {
 *        source: 'a', // 'a' for API
 *        connectionId: ethers.utils.formatBytes32String('')
 *      };
 *      
 *      const signature = await wallet._signTypedData(domain, types, value);
 *      return ethers.utils.splitSignature(signature);
 *    }
 *    ```
 * 
 * 3. Replace this function call in TradingContext with the real signing function
 * 
 * Expected behavior with placeholder:
 * - HyperLiquid will return 400/401 error due to invalid signature
 * - Order structure validation will pass (confirming API integration works)
 * - Error message will indicate signature is the missing piece
 * 
 * See HyperLiquid docs: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint
 */
export function createPlaceholderSignature() {
  console.warn('🚨 USING PLACEHOLDER SIGNATURE - This will be rejected by HyperLiquid!');
  console.info('💡 Implement real EIP-712 signing for live trading');
  
  return {
    r: "0x0000000000000000000000000000000000000000000000000000000000000000",
    s: "0x0000000000000000000000000000000000000000000000000000000000000000",
    v: 28
  };
}

/**
 * Shows what needs to be implemented for live trading
 */
export function showLiveTradingRequirements() {
  console.group('🔧 Live Trading Implementation Requirements');
  console.log('1. Install ethers.js: npm install ethers');
  console.log('2. Implement EIP-712 signature generation');
  console.log('3. Replace createPlaceholderSignature() with real signing');
  console.log('4. Use private key from connected account for signing');
  console.log('📖 Docs: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint');
  console.groupEnd();
}

// HyperLiquid API Types
interface HyperLiquidOrder {
  a: number; // asset
  b: boolean; // isBuy
  p: string; // price
  s: string; // size
  r: boolean; // reduceOnly
  t: { limit: { tif: string } }; // type
}

interface HyperLiquidAction {
  type: string;
  orders?: HyperLiquidOrder[];
  cancels?: { a: number; o: number }[];
  grouping?: string;
}

interface HyperLiquidSignature {
  r: string;
  s: string;
  v: number;
}

interface HyperLiquidPayload {
  action: HyperLiquidAction;
  nonce: number;
  signature: HyperLiquidSignature;
}

/**
 * Validates order payload structure according to HyperLiquid documentation
 */
export function validateOrderPayload(payload: HyperLiquidPayload): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check required top-level fields
  if (!payload.action) errors.push("Missing 'action' field");
  if (!payload.nonce) errors.push("Missing 'nonce' field");
  if (!payload.signature) errors.push("Missing 'signature' field");
  
  // Check action structure
  if (payload.action) {
    if (!payload.action.type) errors.push("Missing 'action.type' field");
    if (payload.action.type === "order" && !payload.action.orders) {
      errors.push("Missing 'action.orders' field for order type");
    }
    if (payload.action.orders && Array.isArray(payload.action.orders)) {
      payload.action.orders.forEach((order: HyperLiquidOrder, index: number) => {
        if (typeof order.a !== 'number') errors.push(`Order ${index}: 'a' (asset) must be a number`);
        if (typeof order.b !== 'boolean') errors.push(`Order ${index}: 'b' (isBuy) must be a boolean`);
        if (typeof order.p !== 'string') errors.push(`Order ${index}: 'p' (price) must be a string`);
        if (typeof order.s !== 'string') errors.push(`Order ${index}: 's' (size) must be a string`);
        if (typeof order.r !== 'boolean') errors.push(`Order ${index}: 'r' (reduceOnly) must be a boolean`);
        if (!order.t) errors.push(`Order ${index}: Missing 't' (type) field`);
      });
    }
  }
  
  // Check signature structure
  if (payload.signature) {
    if (typeof payload.signature.r !== 'string') errors.push("Signature 'r' must be a string");
    if (typeof payload.signature.s !== 'string') errors.push("Signature 's' must be a string");
    if (typeof payload.signature.v !== 'number') errors.push("Signature 'v' must be a number");
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Logs detailed order information for debugging
 */
export function logOrderDetails(payload: HyperLiquidPayload) {
  console.log('🔍 Order Validation:', validateOrderPayload(payload));
  console.log('📋 Full Order Payload:', JSON.stringify(payload, null, 2));
  
  if (payload.action?.orders?.[0]) {
    const order = payload.action.orders[0];
    console.log('📊 Order Details:', {
      asset: order.a,
      isBuy: order.b,
      price: order.p,
      size: order.s,
      reduceOnly: order.r,
      type: order.t
    });
  }
}
