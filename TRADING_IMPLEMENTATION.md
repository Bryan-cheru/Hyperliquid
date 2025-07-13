# HyperLiquid Trading Integration Guide

## Current Implementation Status

✅ **Completed:**
- Trading context with connected account management
- Real HyperLiquid API integration for account data fetching
- Trading controls with connected account awareness
- Order structure preparation according to HyperLiquid API spec
- Position and order fetching for close/cancel operations

⚠️ **Demo Mode (Signature Required for Live Trading):**
- Order execution (structure ready, needs signature)
- Position closing (structure ready, needs signature)
- Order cancellation (structure ready, needs signature)

## To Enable Live Trading

### 1. Install Required Dependencies

```bash
npm install ethers
```

### 2. Implement EIP-712 Signature Generation

Create a new file `src/utils/hyperLiquidSigning.ts`:

```typescript
import { ethers } from 'ethers';

// HyperLiquid EIP-712 domain
const HYPERLIQUID_DOMAIN = {
  name: "HyperliquidSignTransaction",
  version: "1",
  chainId: 42161, // Arbitrum
  verifyingContract: "0x0000000000000000000000000000000000000000"
};

// Sign order payload for HyperLiquid
export async function signOrderPayload(orderPayload: any, privateKey: string) {
  const wallet = new ethers.Wallet(privateKey);
  
  // Define the types for order signing
  const types = {
    Agent: [
      { name: "source", type: "string" },
      { name: "connectionId", type: "bytes32" }
    ],
    // Add other required types based on HyperLiquid documentation
  };

  const signature = await wallet._signTypedData(
    HYPERLIQUID_DOMAIN,
    types,
    orderPayload
  );

  return ethers.utils.splitSignature(signature);
}
```

### 3. Update Trading Context

Replace the mock signature in `TradingContext.tsx`:

```typescript
// In executeOrder function, replace:
signature: {
  r: "0x0000000000000000000000000000000000000000000000000000000000000000",
  s: "0x0000000000000000000000000000000000000000000000000000000000000000",
  v: 28
}

// With:
signature: await signOrderPayload(orderPayload, connectedAccount.privateKey)
```

### 4. Security Considerations

- **Private Key Handling:** Consider using secure key storage
- **Environment Variables:** Store sensitive data in environment variables
- **Rate Limiting:** Implement proper rate limiting for API calls
- **Error Handling:** Add comprehensive error handling for network issues

### 5. Testing Process

1. **Testnet First:** Test on HyperLiquid testnet before mainnet
2. **Small Orders:** Start with minimal position sizes
3. **Monitor Logs:** Check all console logs for proper data flow
4. **Verify Signatures:** Ensure signatures are properly generated

## Current API Integrations

### Account Connection ✅
- Fetches real balance, PnL, and positions from HyperLiquid
- Updates UI with live account data
- Stores credentials for trading operations

### Order Preparation ✅
- Fetches asset metadata for correct asset indexing
- Builds proper HyperLiquid order structure
- Handles market vs limit order types
- Ready for signature and submission

### Position Management ✅
- Fetches open positions from API
- Prepares close orders with reduce-only flag
- Ready for signature and submission

### Order Management ✅
- Fetches open orders from API
- Prepares cancel payload with order IDs
- Ready for signature and submission

## Demo Mode Features

All trading functions are currently in demo mode showing:
- ✅ Real account data fetching
- ✅ Proper API payload preparation
- ✅ Order structure validation
- ⚠️ Simulated execution (pending signature implementation)

## Next Steps for Live Trading

1. Implement the signing utility with ethers.js
2. Replace mock signatures with real ones
3. Test thoroughly on testnet
4. Enable live trading by uncommenting API calls
5. Add proper error handling and logging

The foundation is complete - only signature generation needed for live trading!
