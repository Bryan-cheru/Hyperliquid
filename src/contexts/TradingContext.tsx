import { createContext, useState } from "react";
import type { ReactNode } from "react";

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
      // For HYPE/USDT, we need to map this to the correct asset index
      const assetSymbol = order.symbol.replace('/USDT', '').replace('/USDC', '');
      
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

      // Prepare HyperLiquid order payload according to their API specification
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
        signature: {
          // Note: In a real implementation, you would need to properly sign this
          // using the HyperLiquid signature format with the private key
          // This requires crypto libraries and proper EIP-712 signing
          r: "0x0000000000000000000000000000000000000000000000000000000000000000",
          s: "0x0000000000000000000000000000000000000000000000000000000000000000",
          v: 28
        }
      };

      console.log('Sending order to HyperLiquid:', orderPayload);
      
      // NOTE: This is a demonstration of the API structure.
      // In production, you MUST implement proper signature generation using:
      // 1. The user's private key
      // 2. EIP-712 structured data signing
      // 3. HyperLiquid's specific signature format
      
      // For now, simulate the API call without sending to avoid errors
      console.warn('⚠️  DEMO MODE: Order structure prepared but not sent to HyperLiquid');
      console.log('To enable real trading:');
      console.log('1. Implement proper EIP-712 signature generation');
      console.log('2. Use the private key to sign the order payload');
      console.log('3. Uncomment the actual API call below');
      
      /*
      // Uncomment this section once proper signature implementation is added:
      
      const response = await fetch('https://api.hyperliquid.xyz/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`HyperLiquid API error: ${errorData.message || response.statusText}`);
      }

      const result = await response.json();
      
      if (result.status !== "ok") {
        throw new Error(`Order failed: ${result.message || 'Unknown error'}`);
      }

      const orderId = result.response?.data?.statuses?.[0]?.resting?.oid?.toString();
      */

      // Simulate successful order execution for demo
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockOrderId = `HL_${assetIndex}_${nonce}`;
      
      return {
        success: true,
        message: `${order.side.toUpperCase()} order for ${order.quantity} ${assetSymbol} prepared (Demo Mode)`,
        orderId: mockOrderId
      };
      
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
      
      // For demo purposes, we simulate closing positions
      // Real implementation would create market orders to close each position
      /*
      // Real implementation would be:
      for (const position of openPositions) {
        const assetIndex = position.position.coin;
        const size = Math.abs(parseFloat(position.position.szi));
        const isBuy = parseFloat(position.position.szi) < 0; // Opposite side to close
        
        const closeOrderPayload = {
          action: {
            type: "order",
            orders: [{
              a: assetIndex,
              b: isBuy,
              p: "0", // Market order
              s: size.toString(),
              r: true, // reduceOnly = true for closing positions
              t: { limit: { tif: "Ioc" } }
            }],
            grouping: "na"
          },
          nonce: Date.now(),
          signature: generateSignature(closeOrderPayload, connectedAccount.privateKey)
        };
        
        await fetch('https://api.hyperliquid.xyz/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(closeOrderPayload)
        });
      }
      */
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        success: true,
        message: `Ready to close ${openPositions.length} position(s) (Demo Mode)`
      };
      
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
      
      // For demo purposes, we simulate canceling orders
      // Real implementation would use HyperLiquid's cancel API
      /*
      // Real implementation would be:
      const cancels = ordersData.map(order => ({
        a: order.coin, // asset
        o: order.oid   // order id
      }));
      
      const cancelPayload = {
        action: {
          type: "cancel",
          cancels: cancels
        },
        nonce: Date.now(),
        signature: generateSignature(cancelPayload, connectedAccount.privateKey)
      };
      
      const cancelResponse = await fetch('https://api.hyperliquid.xyz/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cancelPayload)
      });
      
      if (!cancelResponse.ok) {
        throw new Error('Failed to cancel orders');
      }
      */
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: `Ready to cancel ${ordersData.length} order(s) (Demo Mode)`
      };
      
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
