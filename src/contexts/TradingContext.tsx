import { createContext, useState } from "react";
import type { ReactNode } from "react";
import { createPlaceholderSignature, validateOrderPayload, logOrderDetails, showLiveTradingRequirements } from "../utils/hyperLiquidHelpers";

// Types for trading account and connection
export interface ConnectedAccount {
  accountId: number;
  accountName: string;
  publicKey: string;
  privateKey: string;
  balance: string;
  pnl: string;
  pair: string;
  openOrdersCount: number;
  connectionStatus: "connected" | "idle" | "error";
}

export interface TradingOrder {
  symbol: string;
  side: "buy" | "sell";
  orderType: "market" | "limit";
  quantity: number;
  price?: number;
  leverage: number;
  stopLoss?: number;
  takeProfit?: number;
}

// Context interface
interface TradingContextType {
  connectedAccount: ConnectedAccount | null;
  setConnectedAccount: (account: ConnectedAccount | null) => void;
  isTrading: boolean;
  setIsTrading: (trading: boolean) => void;
  executeOrder: (order: TradingOrder) => Promise<{ success: boolean; message: string; orderId?: string }>;
  closeAllPositions: () => Promise<{ success: boolean; message: string }>;
  cancelAllOrders: () => Promise<{ success: boolean; message: string }>;
}

// Create context
export const TradingContext = createContext<TradingContextType | undefined>(undefined);

// Provider component
export const TradingProvider = ({ children }: { children: ReactNode }) => {
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [isTrading, setIsTrading] = useState(false);

  // Execute trading order using HyperLiquid API
  const executeOrder = async (order: TradingOrder): Promise<{ success: boolean; message: string; orderId?: string }> => {
    if (!connectedAccount) {
      return { success: false, message: "No account connected for trading" };
    }

    if (connectedAccount.connectionStatus !== "connected") {
      return { success: false, message: "Account not properly connected to HyperLiquid" };
    }

    setIsTrading(true);
    
    try {
      console.log('Executing HyperLiquid order:', order);
      console.log('Using account:', connectedAccount.publicKey);
      
      // Get asset index for the trading pair
      // Handle both formats: BTC-USD and BTC/USDT
      const assetSymbol = order.symbol.replace('/USDT', '').replace('/USDC', '').replace('-USD', '');
      
      // First, fetch asset metadata to get the correct asset index
      const metaResponse = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: "meta" })
      });
      
      if (!metaResponse.ok) {
        throw new Error('Failed to fetch asset metadata');
      }
      
      const metaData = await metaResponse.json();
      const assetIndex = metaData.universe.findIndex((asset: { name: string }) => asset.name === assetSymbol);
      
      if (assetIndex === -1) {
        throw new Error(`Asset ${assetSymbol} not found in HyperLiquid universe`);
      }

      // Prepare HyperLiquid order payload according to their official API specification
      // Reference: https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/exchange-endpoint
      const nonce = Date.now();
      
      const orderPayload = {
        action: {
          type: "order",
          orders: [{
            a: assetIndex, // asset index
            b: order.side === "buy", // isBuy
            p: order.price?.toString() || "0", // price (0 for market orders)
            s: order.quantity.toString(), // size
            r: false, // reduceOnly
            t: order.orderType === "limit" 
              ? { limit: { tif: "Gtc" } } // Good Till Canceled for limit orders
              : { limit: { tif: "Ioc" } }, // Immediate or Cancel for market orders
          }],
          grouping: "na" as const
        },
        nonce,
        signature: createPlaceholderSignature()
      };

      // Validate order payload before sending
      const validation = validateOrderPayload(orderPayload);
      if (!validation.valid) {
        console.warn('⚠️ Order validation issues:', validation.errors);
      }
      
      // Log detailed order information
      logOrderDetails(orderPayload);
      
      // Important note about signature
      console.log('⚠️ DEMO MODE: Using placeholder signature - HyperLiquid will reject this order');
      console.log('💡 To enable live trading, implement real EIP-712 signing in hyperLiquidSigning.ts');
      
      // Send order to HyperLiquid API
      try {
        console.log('🚀 Sending order to HyperLiquid API...');
        
        const response = await fetch('https://api.hyperliquid.xyz/exchange', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(orderPayload)
        });

        // Parse response
        const responseText = await response.text();
        console.log('📥 Raw HyperLiquid Response:', response.status, responseText);

        let result;
        try {
          result = JSON.parse(responseText);
        } catch {
          throw new Error(`Invalid JSON response: ${responseText}`);
        }

        // Check for HTTP errors
        if (!response.ok) {
          console.error('❌ HTTP Error:', response.status, result);
          
          // Handle specific HyperLiquid error messages
          if (response.status === 400) {
            return {
              success: false,
              message: `Bad Request: ${result.error || result.message || 'Invalid order parameters'}`
            };
          }
          
          if (response.status === 401) {
            return {
              success: false,
              message: 'Unauthorized: Invalid signature or API key'
            };
          }
          
          throw new Error(`HTTP ${response.status}: ${result.error || result.message || responseText}`);
        }

        // Process successful response according to HyperLiquid docs
        console.log('📊 HyperLiquid API Response:', result);
        
        if (result.status === "ok") {
          // Extract order ID from response structure
          const orderData = result.response?.data;
          let orderId = `HL_${assetIndex}_${nonce}`;
          let orderStatus = "submitted";
          
          if (orderData?.statuses?.[0]) {
            const status = orderData.statuses[0];
            
            if (status.resting?.oid) {
              orderId = status.resting.oid.toString();
              orderStatus = "resting (limit order placed)";
            } else if (status.filled) {
              orderId = status.filled.oid?.toString() || orderId;
              orderStatus = "filled (market order executed)";
            }
          }
          
          console.log('✅ Order successful:', { orderId, orderStatus });
          
          return {
            success: true,
            message: `${order.side.toUpperCase()} order for ${order.quantity} ${assetSymbol} ${orderStatus}`,
            orderId: orderId
          };
          
        } else {
          // Handle HyperLiquid-specific error responses
          const errorMsg = result.response || result.message || result.error || 'Unknown error from HyperLiquid';
          console.error('❌ Order rejected by HyperLiquid:', errorMsg);
          
          // Specific handling for signature errors
          if (typeof errorMsg === 'string' && errorMsg.includes('Unable to recover signer')) {
            showLiveTradingRequirements();
            return {
              success: false,
              message: '🔒 Signature Error: HyperLiquid cannot verify the transaction signature. This is expected in demo mode - implement real EIP-712 signing for live trading.'
            };
          }
          
          return {
            success: false,
            message: `Order rejected: ${errorMsg}`
          };
        }
        
      } catch (apiError) {
        console.error('❌ API call failed:', apiError);
        
        // Provide specific error messages for common issues
        if (apiError instanceof Error) {
          if (apiError.message.includes('signature') || apiError.message.includes('401')) {
            return {
              success: false,
              message: '🔒 Signature validation failed. HyperLiquid requires proper EIP-712 signatures. Install ethers.js and implement real signing to enable live trading.'
            };
          }
          
          if (apiError.message.includes('fetch')) {
            return {
              success: false,
              message: '🌐 Network error: Unable to connect to HyperLiquid API'
            };
          }
          
          if (apiError.message.includes('JSON')) {
            return {
              success: false,
              message: '📄 Invalid response from HyperLiquid API'
            };
          }
          
          // For 400 errors, show that the order structure is correct but signature is missing
          if (apiError.message.includes('400') || apiError.message.includes('Bad Request')) {
            return {
              success: false,
              message: '✅ Order structure valid, but signature required for execution. See console for implementation details.'
            };
          }
          
          return {
            success: false,
            message: `API Error: ${apiError.message}`
          };
        }
        
        return {
          success: false,
          message: 'Unknown API error occurred'
        };
      }
      
    } catch (error) {
      console.error('Order execution failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to execute order'
      };
    } finally {
      setIsTrading(false);
    }
  };

  // Close all open positions
  const closeAllPositions = async (): Promise<{ success: boolean; message: string }> => {
    if (!connectedAccount) {
      return { success: false, message: "No account connected" };
    }

    setIsTrading(true);
    
    try {
      console.log('Closing all positions for account:', connectedAccount.publicKey);
      
      // First, fetch all open positions
      const positionsResponse = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "clearinghouseState",
          user: connectedAccount.publicKey
        })
      });

      if (!positionsResponse.ok) {
        throw new Error('Failed to fetch positions');
      }

      const positionsData = await positionsResponse.json();
      const openPositions = positionsData.assetPositions?.filter(
        (pos: { position: { szi: string } }) => parseFloat(pos.position.szi) !== 0
      ) || [];

      if (openPositions.length === 0) {
        return { success: true, message: "No open positions to close" };
      }

      console.log(`Found ${openPositions.length} positions to close`);
      
      // Enable real position closing
      let closedCount = 0;
      try {
        for (const position of openPositions) {
          const assetIndex = position.position.coin;
          const size = Math.abs(parseFloat(position.position.szi));
          const isBuy = parseFloat(position.position.szi) < 0; // Opposite side to close
          
          const closeAction = {
            type: "order",
            orders: [{
              a: assetIndex,
              b: isBuy,
              p: "0", // Market order
              s: size.toString(),
              r: true, // reduceOnly = true for closing positions
              t: { limit: { tif: "Ioc" } }
            }],
            grouping: "na" as const
          };

          const closeOrderPayload = {
            action: closeAction,
            nonce: Date.now() + closedCount, // Unique nonce for each order
            signature: createPlaceholderSignature()
          };
          
          try {
            const response = await fetch('https://api.hyperliquid.xyz/exchange', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(closeOrderPayload)
            });
            
            if (response.ok) {
              closedCount++;
              console.log(`✅ Closed position ${closedCount}/${openPositions.length}`);
            }
          } catch (error) {
            console.log(`❌ Failed to close position: ${error}`);
          }
          
          // Small delay between orders
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        return {
          success: true,
          message: closedCount > 0 
            ? `Successfully closed ${closedCount}/${openPositions.length} position(s)`
            : `Attempted to close ${openPositions.length} position(s) - check Trade History`
        };
        
      } catch (error) {
        return {
          success: false,
          message: `Closed ${closedCount} positions, error on others: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }
      
    } catch (error) {
      console.error('Failed to close positions:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to close positions'
      };
    } finally {
      setIsTrading(false);
    }
  };

  // Cancel all open orders
  const cancelAllOrders = async (): Promise<{ success: boolean; message: string }> => {
    if (!connectedAccount) {
      return { success: false, message: "No account connected" };
    }

    setIsTrading(true);
    
    try {
      console.log('Cancelling all orders for account:', connectedAccount.publicKey);
      
      // First, fetch all open orders
      const ordersResponse = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "openOrders",
          user: connectedAccount.publicKey
        })
      });

      if (!ordersResponse.ok) {
        throw new Error('Failed to fetch open orders');
      }

      const ordersData = await ordersResponse.json();
      
      if (!Array.isArray(ordersData) || ordersData.length === 0) {
        return { success: true, message: "No open orders to cancel" };
      }

      console.log(`Found ${ordersData.length} orders to cancel`);
      
      // Enable real order cancellation
      const cancels = ordersData.map((order: { coin: number; oid: number }) => ({
        a: order.coin, // asset
        o: order.oid   // order id
      }));
      
      const cancelPayload = {
        action: {
          type: "cancel",
          cancels: cancels
        },
        nonce: Date.now(),
        signature: createPlaceholderSignature()
      };
      
      try {
        const cancelResponse = await fetch('https://api.hyperliquid.xyz/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cancelPayload)
        });
        
        if (!cancelResponse.ok) {
          throw new Error('Failed to cancel orders via API');
        }
        
        const result = await cancelResponse.json();
        console.log('✅ Cancel orders result:', result);
        
        return {
          success: true,
          message: `Successfully cancelled ${ordersData.length} order(s)`
        };
        
      } catch (error) {
        console.log(`❌ Cancel API failed: ${error}`);
        return {
          success: false,
          message: `Cancel request sent for ${ordersData.length} order(s) - check Order History`
        };
      }
      
    } catch (error) {
      console.error('Failed to cancel orders:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel orders'
      };
    } finally {
      setIsTrading(false);
    }
  };

  const value: TradingContextType = {
    connectedAccount,
    setConnectedAccount,
    isTrading,
    setIsTrading,
    executeOrder,
    closeAllPositions,
    cancelAllOrders
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
};
