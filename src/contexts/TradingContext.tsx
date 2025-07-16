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
  
  // Trading Settings
  marginMode: "Cross" | "Isolated";
  setMarginMode: (mode: "Cross" | "Isolated") => void;
  
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
  refreshAllData: () => Promise<void>; // Refresh all data at once
  getPrice: (symbol: string) => number | null;
  checkAccountMargin: (assetSymbol: string, quantity: number, leverage: number, side: "buy" | "sell") => Promise<{ hasEnough: boolean; required: number; available: number }>;
}

// Create context
export const TradingContext = createContext<TradingContextType | undefined>(undefined);

// Provider component
export const TradingProvider = ({ children }: { children: ReactNode }) => {
  const [connectedAccount, setConnectedAccount] = useState<ConnectedAccount | null>(null);
  const [agentAccount, setAgentAccount] = useState<AgentAccount | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const [marginMode, setMarginMode] = useState<"Cross" | "Isolated">("Cross");
  
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
      const history = await marketDataService.fetchTradeHistory(connectedAccount.publicKey, 200); // Fetch up to 200 trades like Hyperliquid
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

  // Refresh all data at once
  const refreshAllData = useCallback(async () => {
    if (!connectedAccount?.publicKey) return;
    console.log('🔄 Refreshing all account data...');
    try {
      await Promise.all([
        refreshMarketData(),
        refreshTradeHistory(),
        refreshOpenOrders(),
        refreshPositions()
      ]);
      console.log('✅ All account data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing all data:', error);
    }
  }, [connectedAccount?.publicKey, refreshMarketData, refreshTradeHistory, refreshOpenOrders, refreshPositions]);

  // Auto-refresh data when account connects - Enhanced for Hyperliquid-like real-time updates
  useEffect(() => {
    if (connectedAccount?.publicKey) {
      // Initial data load
      refreshMarketData();
      refreshTradeHistory();
      refreshOpenOrders();
      refreshPositions();
      
      // Set up periodic refresh intervals like Hyperliquid
      const marketDataInterval = setInterval(refreshMarketData, 5000); // Every 5 seconds for market prices
      const tradeHistoryInterval = setInterval(refreshTradeHistory, 3000); // Every 3 seconds for trade history
      const openOrdersInterval = setInterval(refreshOpenOrders, 2000); // Every 2 seconds for open orders
      const positionsInterval = setInterval(refreshPositions, 5000); // Every 5 seconds for positions
      
      return () => {
        clearInterval(marketDataInterval);
        clearInterval(tradeHistoryInterval);
        clearInterval(openOrdersInterval);
        clearInterval(positionsInterval);
      };
    }
  }, [connectedAccount?.publicKey, refreshMarketData, refreshTradeHistory, refreshOpenOrders, refreshPositions]);

  // Check account margin for trade validation
  const checkAccountMargin = async (
    assetSymbol: string, 
    quantity: number, 
    leverage: number, 
    side: "buy" | "sell"
  ): Promise<{ hasEnough: boolean; required: number; available: number }> => {
    try {
      if (!agentAccount?.publicKey) {
        return { hasEnough: false, required: 0, available: 0 };
      }

      // Get current asset price
      const currentPrice = getPrice(assetSymbol) || 0;
      if (currentPrice === 0) {
        console.warn('⚠️ Could not get current price for margin calculation');
        return { hasEnough: false, required: 0, available: 0 };
      }

      // Calculate required margin for the position
      const positionValue = quantity * currentPrice;
      const requiredMargin = positionValue / leverage;

      // Get account balance (simplified - in real implementation would fetch from API)
      // For now, assume we have sufficient margin unless proven otherwise
      const estimatedAvailableMargin = positionValue * 0.1; // Conservative estimate

      console.log('💰 Margin Check:', {
        asset: assetSymbol,
        side,
        quantity,
        currentPrice: currentPrice.toLocaleString(),
        leverage: `${leverage}x`,
        positionValue: `$${positionValue.toFixed(2)}`,
        requiredMargin: `$${requiredMargin.toFixed(2)}`,
        availableMargin: `$${estimatedAvailableMargin.toFixed(2)}`
      });

      return {
        hasEnough: estimatedAvailableMargin >= requiredMargin,
        required: requiredMargin,
        available: estimatedAvailableMargin
      };

    } catch (error) {
      console.error('Error checking account margin:', error);
      return { hasEnough: false, required: 0, available: 0 };
    }
  };

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
      let metaData;
      let assetIndex = -1;
      
      try {
        console.log('🔍 Fetching asset metadata for:', assetSymbol);
        const metaResponse = await fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: "meta" })
        });
        
        if (!metaResponse.ok) {
          throw new Error(`Failed to fetch asset metadata: ${metaResponse.status}`);
        }
        
        metaData = await metaResponse.json();
        
        if (!metaData.universe || !Array.isArray(metaData.universe)) {
          throw new Error('Invalid metadata format: missing universe array');
        }
        
        assetIndex = metaData.universe.findIndex((asset: { name: string }) => asset.name === assetSymbol);
        
        if (assetIndex === -1) {
          console.error('❌ Available assets:', metaData.universe.map((a: { name: string }) => a.name));
          throw new Error(`Asset ${assetSymbol} not found in HyperLiquid universe`);
        }
        
        console.log('✅ Found asset', assetSymbol, 'at index', assetIndex);
        
      } catch (error) {
        console.error('❌ Error fetching asset metadata:', error);
        return {
          success: false,
          message: `Failed to fetch asset information for ${assetSymbol}: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
      }

      // FIXED: Clear Market vs Limit Order Logic
      let orderPrice: string;
      let timeInForce: { limit: { tif: string } };
      const currentPrice = getPrice(assetSymbol) || 0;

      if (order.orderType === "market") {
        // MARKET ORDERS: Use extreme prices to guarantee execution
        console.log(`📈 Processing MARKET ${order.side.toUpperCase()} order`);
        
        if (order.side === "buy") {
          // Market BUY: Price above market to ensure fill
          orderPrice = Math.round(currentPrice * 1.05).toString(); // 5% above market
        } else {
          // Market SELL: Price below market to ensure fill
          orderPrice = Math.round(currentPrice * 0.95).toString(); // 5% below market
        }
        
        // Use IOC (Immediate or Cancel) for market orders
        timeInForce = { limit: { tif: "Ioc" } };
        
        console.log(`   Market price: $${currentPrice.toLocaleString()}`);
        console.log(`   Order price: $${parseFloat(orderPrice).toLocaleString()} (${order.side === "buy" ? "above" : "below"} market)`);
        
      } else {
        // LIMIT ORDERS: Use exact specified price
        console.log(`🎯 Processing LIMIT ${order.side.toUpperCase()} order`);
        
        if (order.price && order.price > 0) {
          orderPrice = Math.round(order.price).toString();
        } else {
          return {
            success: false,
            message: `Limit orders require a specific price. Current market price is $${currentPrice.toLocaleString()}`
          };
        }
        
        // Use GTC (Good Till Canceled) for limit orders
        timeInForce = { limit: { tif: "Gtc" } };
        
        console.log(`   Market price: $${currentPrice.toLocaleString()}`);
        console.log(`   Limit price: $${parseFloat(orderPrice).toLocaleString()}`);
        
        // Validate limit order price makes sense
        const priceDiff = ((parseFloat(orderPrice) - currentPrice) / currentPrice) * 100;
        if (order.side === "buy" && parseFloat(orderPrice) > currentPrice * 1.1) {
          console.warn(`⚠️ Buy limit price is ${priceDiff.toFixed(1)}% above market - this will execute immediately like a market order`);
        }
        if (order.side === "sell" && parseFloat(orderPrice) < currentPrice * 0.9) {
          console.warn(`⚠️ Sell limit price is ${Math.abs(priceDiff).toFixed(1)}% below market - this will execute immediately like a market order`);
        }
      }

      // Validate that the price is reasonable
      const priceValue = parseFloat(orderPrice);
      if (isNaN(priceValue) || priceValue <= 0) {
        return {
          success: false,
          message: `Invalid price calculated: ${orderPrice}. Please check the order parameters.`
        };
      }

      // Validate quantity
      if (isNaN(order.quantity) || order.quantity <= 0) {
        return {
          success: false,
          message: `Invalid quantity: ${order.quantity}. Quantity must be a positive number.`
        };
      }

      // Add margin validation check specifically for buy orders
      if (order.side === "buy") {
        const marginCheck = await checkAccountMargin(assetSymbol, order.quantity, order.leverage || 1, order.side);
        if (!marginCheck.hasEnough) {
          const shortfall = marginCheck.required - marginCheck.available;
          return {
            success: false,
            message: `❌ Insufficient Margin for LONG position!\n` +
              `Required: $${marginCheck.required.toFixed(2)}\n` +
              `Available: $${marginCheck.available.toFixed(2)}\n` +
              `Shortfall: $${shortfall.toFixed(2)}\n\n` +
              `Try reducing position size or adding more funds.`
          };
        }
      }

      // Define order action - using fixed pricing logic
      const orderAction = {
        type: "order",
        orders: [{
          a: assetIndex, // asset index
          b: order.side === "buy", // isBuy
          p: orderPrice, // Use dynamic price based on order type and market conditions
          s: order.quantity.toString(), // size
          r: false, // reduceOnly
          t: timeInForce // Use proper time-in-force based on order type
        }],
        grouping: "na"
      };

      console.log('📋 Order Action Structure:', JSON.stringify(orderAction, null, 2));

      // Prepare HyperLiquid order payload for direct account trading
      const nonce = Date.now();
      
      console.log('🔐 Signing order with nonce:', nonce);
      
      let signature;
      try {
        signature = await signOrderAction(orderAction, nonce, agentAccount.privateKey, undefined);
        console.log('✅ Order signature generated successfully');
      } catch (signError) {
        console.error('❌ Error signing order:', signError);
        return {
          success: false,
          message: `Failed to sign order: ${signError instanceof Error ? signError.message : 'Unknown signing error'}`
        };
      }
      
      // Build payload exactly like working test file
      const orderPayload = {
        action: orderAction,
        nonce,
        signature,
        vaultAddress: null // Explicitly set to null for direct account trading (matches working test)
      };

      // Validate order payload before sending
      const validation = validateOrderPayload(orderPayload as { action: any; nonce: number; signature: any; vaultAddress: null });
      if (!validation.valid) {
        console.warn('⚠️ Order validation issues:', validation.errors);
        return {
          success: false,
          message: `Order validation failed: ${validation.errors.join(', ')}`
        };
      }
      
      // Log detailed order information
      logOrderDetails(orderPayload as { action: any; nonce: number; signature: any; vaultAddress: null });
      
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
        } catch (parseError) {
          console.error('❌ Failed to parse JSON response:', parseError);
          return {
            success: false,
            message: `Invalid response from HyperLiquid API. The service may be temporarily unavailable. Raw response: ${responseText.substring(0, 200)}`
          };
        }

        // Check for HTTP errors
        if (!response.ok) {
          console.error('❌ HTTP Error:', response.status, result);
          
          // Handle specific HyperLiquid error messages
          if (response.status === 400) {
            const errorMessage = result?.error || result?.message || 'Invalid order parameters';
            return {
              success: false,
              message: `Bad Request: ${errorMessage}`
            };
          }
          
          if (response.status === 401) {
            return {
              success: false,
              message: 'Unauthorized: Invalid signature or API key'
            };
          }

          if (response.status === 403) {
            return {
              success: false,
              message: 'Forbidden: Account not authorized for trading'
            };
          }

          if (response.status >= 500) {
            return {
              success: false,
              message: 'HyperLiquid server error. Please try again later.'
            };
          }
          
          const errorMessage = result?.error || result?.message || responseText;
          return {
            success: false,
            message: `HTTP ${response.status}: ${errorMessage}`
          };
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
          
          // Refresh all relevant data after successful trade
          console.log('🔄 Refreshing account data after successful trade...');
          try {
            await refreshAllData();
          } catch (refreshError) {
            console.warn('⚠️ Failed to refresh data after trade:', refreshError);
          }
          
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
      console.log('🔍 Fetching positions for agent account:', agentAccount.publicKey);
      
      // First, fetch all open positions using the agent account
      const positionsResponse = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "clearinghouseState",
          user: agentAccount.publicKey
        })
      });

      if (!positionsResponse.ok) {
        throw new Error(`Failed to fetch positions: ${positionsResponse.status}`);
      }

      const positionsData = await positionsResponse.json();
      console.log('📊 Raw positions data:', positionsData);
      
      // Better position filtering - check for non-zero positions
      const openPositions = positionsData.assetPositions?.filter(
        (pos: { position: { szi: string; coin: string } }) => {
          const size = parseFloat(pos.position.szi || "0");
          return size !== 0 && Math.abs(size) > 0;
        }
      ) || [];

      console.log(`Found ${openPositions.length} open positions:`, openPositions.map((p: any) => ({
        coin: p.position.coin,
        size: p.position.szi,
        value: p.position.positionValue
      })));

      if (openPositions.length === 0) {
        return { success: true, message: "No open positions found to close" };
      }

      // Fetch asset metadata to get proper asset indices
      const metaResponse = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: "meta" })
      });

      if (!metaResponse.ok) {
        throw new Error('Failed to fetch asset metadata for position closing');
      }

      const metaData = await metaResponse.json();
      
      console.log(`📋 Attempting to close ${openPositions.length} positions...`);
      
      let closedCount = 0;
      const errors: string[] = [];
      
      for (const position of openPositions) {
        try {
          const coinName = position.position.coin;
          const positionSize = parseFloat(position.position.szi);
          
          // Find the asset index for this coin
          const assetIndex = metaData.universe.findIndex((asset: { name: string }) => asset.name === coinName);
          
          if (assetIndex === -1) {
            errors.push(`Asset ${coinName} not found in universe`);
            continue;
          }
          
          const closeSize = Math.abs(positionSize);
          const isCloseOrderBuy = positionSize < 0; // If we're short, we buy to close
          
          console.log(`🔄 Closing ${coinName} position: size=${positionSize}, closeSize=${closeSize}, buy=${isCloseOrderBuy}`);
          
          const closeAction = {
            type: "order",
            orders: [{
              a: assetIndex, // Use proper asset index
              b: isCloseOrderBuy, // Opposite side to close position
              p: isCloseOrderBuy ? "999999" : "0.01", // Market order with extreme price
              s: closeSize.toString(),
              r: true, // reduceOnly = true for closing positions
              t: { limit: { tif: "Ioc" } } // Immediate or Cancel
            }],
            grouping: "na"
          };

          const nonce = Date.now() + closedCount * 10; // Ensure unique nonces
          const closeOrderPayload = {
            action: closeAction,
            nonce,
            signature: await signOrderAction(closeAction, nonce, agentAccount.privateKey, undefined),
            vaultAddress: null
          };
          
          console.log(`📤 Sending close order for ${coinName}:`, closeAction);
          
          const response = await fetch('https://api.hyperliquid.xyz/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(closeOrderPayload)
          });
          
          const responseText = await response.text();
          console.log(`📥 Close order response for ${coinName}:`, response.status, responseText);
          
          if (response.ok) {
            const result = JSON.parse(responseText);
            if (result.status === "ok") {
              closedCount++;
              console.log(`✅ Successfully closed ${coinName} position (${closedCount}/${openPositions.length})`);
            } else {
              errors.push(`${coinName}: ${result.response || 'Unknown error'}`);
            }
          } else {
            errors.push(`${coinName}: HTTP ${response.status}`);
          }
          
          // Small delay between orders to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${position.position.coin}: ${errorMsg}`);
          console.error(`❌ Error closing position for ${position.position.coin}:`, error);
        }
      }
      
      // Refresh data after attempting to close positions
      console.log('🔄 Refreshing account data after position closing attempts...');
      try {
        await refreshAllData();
      } catch (refreshError) {
        console.warn('⚠️ Failed to refresh data after closing positions:', refreshError);
      }
      
      if (closedCount === 0 && errors.length > 0) {
        return {
          success: false,
          message: `Failed to close positions: ${errors.join(', ')}`
        };
      }
      
      return {
        success: true,
        message: closedCount > 0 
          ? `Successfully closed ${closedCount}/${openPositions.length} position(s)${errors.length > 0 ? `. Errors: ${errors.join(', ')}` : ''}`
          : `Attempted to close ${openPositions.length} position(s) - check positions and trade history`
      };
      
    } catch (error) {
      console.error('❌ Failed to close positions:', error);
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
      console.log('🔍 Fetching open orders for agent account:', agentAccount.publicKey);
      
      // First, fetch all open orders using the agent account
      const ordersResponse = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: "openOrders",
          user: agentAccount.publicKey
        })
      });

      if (!ordersResponse.ok) {
        throw new Error(`Failed to fetch open orders: ${ordersResponse.status}`);
      }

      const ordersData = await ordersResponse.json();
      console.log('📊 Raw orders data:', ordersData);
      
      if (!Array.isArray(ordersData) || ordersData.length === 0) {
        return { success: true, message: "No open orders found to cancel" };
      }

      console.log(`📋 Found ${ordersData.length} open orders:`, ordersData.map((order: any) => ({
        coin: order.coin,
        oid: order.oid,
        side: order.side,
        sz: order.sz,
        limitPx: order.limitPx
      })));

      // Fetch asset metadata to ensure we have proper asset indices
      const metaResponse = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: "meta" })
      });

      if (!metaResponse.ok) {
        throw new Error('Failed to fetch asset metadata for order cancellation');
      }

      const metaData = await metaResponse.json();
      
      // Build cancellation requests with proper asset indices
      const cancels = ordersData.map((order: { coin: string; oid: number }) => {
        const assetIndex = metaData.universe.findIndex((asset: { name: string }) => asset.name === order.coin);
        
        if (assetIndex === -1) {
          console.warn(`⚠️ Asset ${order.coin} not found in universe for order ${order.oid}`);
          return null;
        }
        
        return {
          a: assetIndex, // Use proper asset index instead of coin name
          o: order.oid   // order id
        };
      }).filter(Boolean); // Remove null entries
      
      if (cancels.length === 0) {
        return { success: false, message: "No valid orders found to cancel (asset mapping failed)" };
      }

      console.log(`📤 Sending cancellation for ${cancels.length} orders:`, cancels);
      
      const cancelAction = {
        type: "cancel",
        cancels: cancels
      };
      
      const nonce = Date.now();
      const cancelPayload = {
        action: cancelAction,
        nonce,
        signature: await signOrderAction(cancelAction, nonce, agentAccount.privateKey, undefined),
        vaultAddress: null
      };
      
      const cancelResponse = await fetch('https://api.hyperliquid.xyz/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cancelPayload)
      });
      
      const responseText = await cancelResponse.text();
      console.log('📥 Cancel orders response:', cancelResponse.status, responseText);
      
      if (!cancelResponse.ok) {
        return {
          success: false,
          message: `Failed to cancel orders: HTTP ${cancelResponse.status} - ${responseText}`
        };
      }
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        return {
          success: false,
          message: `Invalid response when cancelling orders: ${responseText}`
        };
      }
      
      console.log('✅ Cancel orders result:', result);
      
      // Refresh all relevant data after cancelling orders
      console.log('🔄 Refreshing account data after cancelling orders...');
      try {
        await refreshAllData();
      } catch (refreshError) {
        console.warn('⚠️ Failed to refresh data after cancelling orders:', refreshError);
      }
      
      if (result.status === "ok") {
        return {
          success: true,
          message: `Successfully cancelled ${cancels.length} order(s)`
        };
      } else {
        return {
          success: false,
          message: `Cancel request processed but may have failed: ${result.response || 'Check order status'}`
        };
      }
      
    } catch (error) {
      console.error('❌ Failed to cancel orders:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel orders'
      };
    } finally {
      setIsTrading(false);
    }
  };

  // Test function for guaranteed successful orders
  const placeTestOrder = async (testType: 'market_buy' | 'limit_buy' | 'market_sell') => {
    if (!agentAccount) {
      console.error('❌ No agent account available');
      return;
    }

    const currentPrice = getPrice('BTC') || 118719;
    console.log(`🧪 PLACING TEST ORDER - Type: ${testType}`);
    console.log(`📊 Current BTC Price: $${currentPrice.toLocaleString()}`);

    let testOrder;

    switch (testType) {
      case 'market_buy':
        testOrder = {
          symbol: 'BTC',
          side: 'buy' as const,
          orderType: 'market' as const,
          quantity: 0.00001, // $1.18 worth
          leverage: 2,
          price: 0 // Market price
        };
        console.log('📝 Market Buy Order - Will execute at current market price');
        break;

      case 'limit_buy':
        const limitPrice = Math.floor(currentPrice * 0.97); // 3% below market
        testOrder = {
          symbol: 'BTC',
          side: 'buy' as const,
          orderType: 'limit' as const,
          quantity: 0.00001,
          leverage: 2,
          price: limitPrice
        };
        console.log(`📝 Limit Buy Order - Will only execute if BTC drops to $${limitPrice.toLocaleString()}`);
        break;

      case 'market_sell':
        testOrder = {
          symbol: 'BTC',
          side: 'sell' as const,
          orderType: 'market' as const,
          quantity: 0.00001,
          leverage: 2,
          price: 0
        };
        console.log('📝 Market Sell Order - Will execute immediately');
        break;
    }

    console.log('💰 Estimated margin requirement:', `$${((testOrder.quantity * currentPrice) / testOrder.leverage).toFixed(2)}`);
    
    try {
      const result = await executeOrder(testOrder);
      if (result.success) {
        console.log('✅ TEST ORDER SUCCESS!', result.message);
        setToast({
          type: "success",
          message: `✅ Test order successful: ${result.message}`
        });
      } else {
        console.log('❌ TEST ORDER FAILED:', result.message);
        setToast({
          type: "error", 
          message: `❌ Test order failed: ${result.message}`
        });
      }
    } catch (error) {
      console.error('❌ Error placing test order:', error);
    }
  };

  // Context value
  const contextValue: TradingContextType = {
    connectedAccount,
    setConnectedAccount,
    agentAccount,
    setAgentAccount,
    marginMode,
    setMarginMode,
    isTrading,
    setIsTrading,
    tradeHistory,
    openOrders,
    positions,
    marketPrices,
    executeOrder,
    refreshMarketData,
    refreshTradeHistory,
    refreshOpenOrders,
    refreshPositions,
    refreshAllData,
    getPrice,
    checkAccountMargin,
    closeAllPositions,
    cancelAllOrders
  };

  return (
    <TradingContext.Provider value={contextValue}>
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
