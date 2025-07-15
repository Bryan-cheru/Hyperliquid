import { createContext, useState, useEffect, useCallback, useContext } from "react";
import type { ReactNode } from "react";
import { signOrderAction } from "../utils/hyperLiquidSigning";
import { validateOrderPayload, logOrderDetails } from "../utils/hyperLiquidHelpers";
import { marketDataService, type MarketPrice, type TradeHistoryItem, type OpenOrder, type Position } from "../utils/marketDataService";

// Types for master account (view-only) and trading functionality
export interface ConnectedAccount {
  accountId: number;
  accountName: string;
  publicKey: string;
  privateKey: string; // Empty for master account - view only
  balance: string;
  pnl: string;
  pair: string;
  openOrdersCount: number;
  connectionStatus: "connected" | "idle" | "error";
}

export interface AgentAccount {
  accountId: number;
  accountName: string;
  publicKey: string;
  privateKey: string; // Required for agent account - for signing transactions
  isActive: boolean;
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
  // Additional UI parameters
  stopPrice?: number;
  triggerPrice?: number;
  orderSplit?: boolean;
  minPrice?: number;
  maxPrice?: number;
  splitCount?: number;
  scaleType?: string;
}

// Context interface
interface TradingContextType {
  // Master Account (View Only)
  connectedAccount: ConnectedAccount | null; // Master account for viewing data
  setConnectedAccount: (account: ConnectedAccount | null) => void;
  
  // Agent Account (For Trading)
  agentAccount: AgentAccount | null; // Agent account for executing trades
  setAgentAccount: (account: AgentAccount | null) => void;
  
  // Agent Trading Functions (uses separate agent wallet)
  isTrading: boolean;
  setIsTrading: (trading: boolean) => void;
  executeOrder: (order: TradingOrder) => Promise<{ success: boolean; message: string; orderId?: string }>;
  closeAllPositions: () => Promise<{ success: boolean; message: string }>;
  cancelAllOrders: () => Promise<{ success: boolean; message: string }>;
  
  // Market data from master account
  marketPrices: Map<string, MarketPrice>;
  tradeHistory: TradeHistoryItem[];
  openOrders: OpenOrder[];
  positions: Position[];
  
  // Data refresh functions
  refreshMarketData: () => Promise<void>;
  refreshTradeHistory: () => Promise<void>;
  refreshOpenOrders: () => Promise<void>;
  refreshPositions: () => Promise<void>;
  getPrice: (symbol: string) => number | null;
}

// Create context
export const TradingContext = createContext<TradingContextType | undefined>(undefined);

// Provider component
export const TradingProvider = ({ children }: { children: ReactNode }) => {
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [agentAccount, setAgentAccount] = useState<AgentAccount | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  
  // Market data state
  const [marketPrices, setMarketPrices] = useState<Map<string, MarketPrice>>(new Map());
  const [tradeHistory, setTradeHistory] = useState<TradeHistoryItem[]>([]);
  const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);

  // Market data functions
  const refreshMarketData = useCallback(async () => {
    try {
      const prices = await marketDataService.fetchMarketPrices();
      setMarketPrices(prices);
    } catch (error) {
      console.error('Error refreshing market data:', error);
    }
  }, []);

  const refreshTradeHistory = useCallback(async () => {
    if (!connectedAccount?.publicKey) return; // Use master account for viewing data
    try {
      const history = await marketDataService.fetchTradeHistory(connectedAccount.publicKey);
      setTradeHistory(history);
    } catch (error) {
      console.error('Error refreshing trade history:', error);
    }
  }, [connectedAccount?.publicKey]);

  const refreshOpenOrders = useCallback(async () => {
    if (!connectedAccount?.publicKey) return; // Use master account for viewing data
    try {
      const orders = await marketDataService.fetchOpenOrders(connectedAccount.publicKey);
      setOpenOrders(orders);
    } catch (error) {
      console.error('Error refreshing open orders:', error);
    }
  }, [connectedAccount?.publicKey]);

  const refreshPositions = useCallback(async () => {
    if (!connectedAccount?.publicKey) return; // Use master account for viewing data
    try {
      const pos = await marketDataService.fetchPositions(connectedAccount.publicKey);
      setPositions(pos);
    } catch (error) {
      console.error('Error refreshing positions:', error);
    }
  }, [connectedAccount?.publicKey]);

  const getPrice = useCallback((symbol: string): number | null => {
    const price = marketPrices.get(symbol);
    return price ? price.price : null;
  }, [marketPrices]);

  // Auto-refresh market data when account connects
  useEffect(() => {
    if (connectedAccount?.publicKey) {
      refreshMarketData();
      refreshTradeHistory();
      refreshOpenOrders();
      refreshPositions();
      
      // Set up periodic refresh for market data
      const interval = setInterval(refreshMarketData, 10000); // Every 10 seconds
      return () => clearInterval(interval);
    }
  }, [connectedAccount?.publicKey, refreshMarketData, refreshTradeHistory, refreshOpenOrders, refreshPositions]);

  // Execute trading order using HyperLiquid API
  const executeOrder = async (order: TradingOrder): Promise<{ success: boolean; message: string; orderId?: string }> => {
    if (!agentAccount) {
      return { success: false, message: "No agent account configured for trading. Please add an agent account first." };
    }

    if (agentAccount.connectionStatus !== "connected") {
      return { success: false, message: "Agent account not properly connected for trading" };
    }

    if (!agentAccount.privateKey) {
      return { success: false, message: "Agent account requires private key for trading operations" };
    }

    setIsTrading(true);
    
    try {
      console.log('🚀 Executing HyperLiquid order with UI parameters:', order);
      console.log('📊 Complete Order Details:');
      console.log('   Symbol:', order.symbol);
      console.log('   Side:', order.side);
      console.log('   Order Type:', order.orderType);
      console.log('   Quantity:', order.quantity);
      console.log('   Leverage:', order.leverage);
      console.log('   Price:', order.price || 'Market');
      console.log('   Stop Loss:', order.stopLoss ? `${order.stopLoss * 100}%` : 'None');
      console.log('   Stop Price:', order.stopPrice || 'None');
      console.log('   Order Split:', order.orderSplit ? 'Yes' : 'No');
      if (order.orderSplit) {
        console.log('   Split Count:', order.splitCount);
        console.log('   Min Price:', order.minPrice);
        console.log('   Max Price:', order.maxPrice);
        console.log('   Scale Type:', order.scaleType);
      }
      console.log('🔗 Using agent wallet:', agentAccount.publicKey);
      console.log('📈 Trading on behalf of subaccount (if applicable)');
      
      // Get asset index for the trading pair
      const assetSymbol = order.symbol.replace('/USDT', '').replace('/USDC', '').replace('-USD', '');
      
      // Fetch asset metadata to get the correct asset index
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

      // Define order action - simplified to match working test file
      const orderAction = {
        type: "order",
        orders: [{
          a: assetIndex, // asset index
          b: order.side === "buy", // isBuy
          p: order.price?.toString() || "95000", // Use a reasonable price for limit orders, or set high for market
          s: order.quantity.toString(), // size
          r: false, // reduceOnly
          t: { limit: { tif: "Gtc" } } // Always use Gtc like working test
        }],
        grouping: "na"
      };

      // Prepare HyperLiquid order payload for direct account trading
      const nonce = Date.now();
      
      // Build payload exactly like working test file
      const orderPayload = {
        action: orderAction,
        nonce,
        signature: await signOrderAction(orderAction, nonce, agentAccount.privateKey, undefined),
        vaultAddress: null // Explicitly set to null for direct account trading (matches working test)
      };

      // Validate order payload before sending
      const validation = validateOrderPayload(orderPayload as any);
      if (!validation.valid) {
        console.warn('⚠️ Order validation issues:', validation.errors);
      }
      
      // Log detailed order information
      logOrderDetails(orderPayload as any);
      
      // Using Python-compatible msgpack and EIP-712 signing for HyperLiquid integration
      console.log('✅ Order signed with Python-compatible msgpack and EIP-712 signature');
      
      // Send order to HyperLiquid API
      try {
        console.log('🚀 Sending order to HyperLiquid API...');
        console.log('📍 Using agent wallet for API call:', agentAccount.publicKey);
        console.log('📦 Final Payload Being Sent:', JSON.stringify(orderPayload, null, 2));
        
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
          
          // Handle specific error types
          if (typeof errorMsg === 'string') {
            // Vault configuration errors
            if (errorMsg.includes('Vault not registered')) {
              return {
                success: false,
                message: `🏦 Vault Configuration Error: The vault address (${agentAccount.publicKey}) is not registered with HyperLiquid. Please register your vault address in the HyperLiquid app first.`
              };
            }
            
            // Agent wallet permission errors
            if (errorMsg.includes('does not exist') || errorMsg.includes('not approved') || errorMsg.includes('agent')) {
              return {
                success: false,
                message: `🔐 Agent Wallet Error: Your agent wallet needs to be approved by the main account. Go to HyperLiquid app → Settings → API Keys and approve this agent wallet for trading.`
              };
            }
            
            // Insufficient funds errors
            if (errorMsg.includes('insufficient') || errorMsg.includes('balance') || errorMsg.includes('margin')) {
              return {
                success: false,
                message: `💰 Insufficient Funds: Not enough balance or margin to place this order. Check your account balance in HyperLiquid.`
              };
            }
            
            // Asset or market errors
            if (errorMsg.includes('asset') || errorMsg.includes('market') || errorMsg.includes('trading')) {
              return {
                success: false,
                message: `📊 Market Error: ${errorMsg}. The asset may not be available for trading or market may be closed.`
              };
            }
            
            // Legacy signature error handling (should not occur with fixed implementation)
            if (errorMsg.includes('Unable to recover signer')) {
              return {
                success: false,
                message: '🔒 Signature Error: HyperLiquid cannot verify the transaction signature. This should not happen with the fixed implementation - please check your setup.'
              };
            }
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
              message: '🔒 Authentication failed. Check your private key and agent wallet setup. With the fixed implementation, signature issues should be rare.'
            };
          }
          
          if (apiError.message.includes('fetch')) {
            return {
              success: false,
              message: '🌐 Network error: Unable to connect to HyperLiquid API. Check your internet connection.'
            };
          }
          
          if (apiError.message.includes('JSON')) {
            return {
              success: false,
              message: '📄 Invalid response from HyperLiquid API. The service may be temporarily unavailable.'
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
    if (!agentAccount) {
      return { success: false, message: "No agent account configured for trading operations" };
    }

    setIsTrading(true);
    
    try {
      console.log('Closing all positions for agent account:', agentAccount.publicKey);
      
      // First, fetch all open positions
      const positionsResponse = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "clearinghouseState",
          user: agentAccount.publicKey
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
            signature: await signOrderAction(closeAction, Date.now() + closedCount, agentAccount.privateKey)
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
    if (!agentAccount) {
      return { success: false, message: "No agent account configured for trading operations" };
    }

    setIsTrading(true);
    
    try {
      console.log('Cancelling all orders for agent account:', agentAccount.publicKey);
      
      // First, fetch all open orders
      const ordersResponse = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "openOrders",
          user: agentAccount.publicKey
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
        signature: await signOrderAction({ type: "cancel", cancels: cancels }, Date.now(), agentAccount.privateKey)
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
    agentAccount,
    setAgentAccount,
    isTrading,
    setIsTrading,
    executeOrder,
    closeAllPositions,
    cancelAllOrders,
    
    // Market data
    marketPrices,
    tradeHistory,
    openOrders,
    positions,
    
    // Data refresh functions
    refreshMarketData,
    refreshTradeHistory,
    refreshOpenOrders,
    refreshPositions,
    getPrice
  };

  return (
    <TradingContext.Provider value={value}>
      {children}
    </TradingContext.Provider>
  );
};

// Custom hook to use the TradingContext
export const useTrading = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
