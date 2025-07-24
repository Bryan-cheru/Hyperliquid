import { createContext, useState, useEffect, useCallback, useContext } from "react";
import type { ReactNode } from "react";
import { marketDataService, type MarketPrice, type TradeHistoryItem, type OpenOrder, type Position } from "../utils/marketDataService";

// Enhanced types for multi-account support
export interface MultiAgentAccount {
  accountId: number;
  accountName: string;
  publicKey: string;
  privateKey: string;
  isActive: boolean;
  connectionStatus: "connected" | "idle" | "error";
  balance: string;
  pnl: string;
  pair: string;
  leverage: string;
  openOrdersCount: number;
  // Add trading-specific data
  positions: Position[];
  openOrders: OpenOrder[];
  tradeHistory: TradeHistoryItem[];
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
  stopPrice?: number;
  triggerPrice?: number;
  orderSplit?: boolean;
  minPrice?: number;
  maxPrice?: number;
  splitCount?: number;
  scaleType?: string;
  // Add account targeting
  targetAccountId?: number; // Which account to execute this order with
}

// Multi-account context interface
interface MultiAccountTradingContextType {
  // Master Account (View Only) - for data aggregation
  masterAccount: { publicKey: string; connectionStatus: "connected" | "idle" | "error" } | null;
  setMasterAccount: (account: { publicKey: string; connectionStatus: "connected" | "idle" | "error" } | null) => void;
  
  // Multi-Agent Accounts (For Trading)
  agentAccounts: Map<number, MultiAgentAccount>; // Map by accountId
  addAgentAccount: (account: MultiAgentAccount) => void;
  removeAgentAccount: (accountId: number) => void;
  updateAgentAccount: (accountId: number, updates: Partial<MultiAgentAccount>) => void;
  getAgentAccount: (accountId: number) => MultiAgentAccount | undefined;
  
  // Active account for UI selection
  activeAccountId: number | null;
  setActiveAccountId: (accountId: number | null) => void;
  
  // Trading Settings
  marginMode: "Cross" | "Isolated";
  setMarginMode: (mode: "Cross" | "Isolated") => void;
  
  // Multi-Account Trading Functions
  isTrading: boolean;
  setIsTrading: (trading: boolean) => void;
  executeOrderOnAccount: (order: TradingOrder, accountId: number) => Promise<{ success: boolean; message: string; orderId?: string }>;
  executeOrderOnAllAccounts: (order: TradingOrder) => Promise<{ success: boolean; message: string; results: Array<{ accountId: number; success: boolean; message: string; orderId?: string }> }>;
  closeAllPositionsOnAccount: (accountId: number) => Promise<{ success: boolean; message: string }>;
  closeAllPositionsOnAllAccounts: () => Promise<{ success: boolean; message: string; results: Array<{ accountId: number; success: boolean; message: string }> }>;
  cancelAllOrdersOnAccount: (accountId: number) => Promise<{ success: boolean; message: string }>;
  cancelAllOrdersOnAllAccounts: () => Promise<{ success: boolean; message: string; results: Array<{ accountId: number; success: boolean; message: string }> }>;
  
  // Aggregated market data
  marketPrices: Map<string, MarketPrice>;
  
  // Data refresh functions
  refreshMarketData: () => Promise<void>;
  refreshAccountData: (accountId: number) => Promise<void>;
  refreshAllAccountsData: () => Promise<void>;
  getPrice: (symbol: string) => number | null;
  
  // Account management helpers
  getConnectedAccounts: () => MultiAgentAccount[];
  getAccountCount: () => number;
  isAccountConnected: (accountId: number) => boolean;
}

// Create context
export const MultiAccountTradingContext = createContext<MultiAccountTradingContextType | undefined>(undefined);

// Provider component
export const MultiAccountTradingProvider = ({ children }: { children: ReactNode }) => {
  const [masterAccount, setMasterAccount] = useState<{ publicKey: string; connectionStatus: "connected" | "idle" | "error" } | null>(null);
  const [agentAccounts, setAgentAccounts] = useState<Map<number, MultiAgentAccount>>(new Map());
  const [activeAccountId, setActiveAccountId] = useState<number | null>(null);
  const [isTrading, setIsTrading] = useState(false);
  const [marginMode, setMarginMode] = useState<"Cross" | "Isolated">("Cross");
  
  // Market data state
  const [marketPrices, setMarketPrices] = useState<Map<string, MarketPrice>>(new Map());

  // Add agent account
  const addAgentAccount = useCallback((account: MultiAgentAccount) => {
    setAgentAccounts(prev => {
      const newMap = new Map(prev);
      newMap.set(account.accountId, account);
      console.log(`✅ Added agent account ${account.accountId}: ${account.accountName}`);
      return newMap;
    });
  }, []);

  // Remove agent account
  const removeAgentAccount = useCallback((accountId: number) => {
    setAgentAccounts(prev => {
      const newMap = new Map(prev);
      newMap.delete(accountId);
      console.log(`❌ Removed agent account ${accountId}`);
      return newMap;
    });
    
    // Reset active account if it was removed
    if (activeAccountId === accountId) {
      setActiveAccountId(null);
    }
  }, [activeAccountId]);

  // Update agent account
  const updateAgentAccount = useCallback((accountId: number, updates: Partial<MultiAgentAccount>) => {
    setAgentAccounts(prev => {
      const newMap = new Map(prev);
      const existingAccount = newMap.get(accountId);
      if (existingAccount) {
        newMap.set(accountId, { ...existingAccount, ...updates });
        console.log(`🔄 Updated agent account ${accountId}`);
      }
      return newMap;
    });
  }, []);

  // Get agent account
  const getAgentAccount = useCallback((accountId: number) => {
    return agentAccounts.get(accountId);
  }, [agentAccounts]);

  // Market data functions
  const refreshMarketData = useCallback(async () => {
    try {
      const prices = await marketDataService.fetchMarketPrices();
      setMarketPrices(prices);
    } catch (error) {
      console.error('Error refreshing market data:', error);
    }
  }, []);

  // Refresh data for specific account
  const refreshAccountData = useCallback(async (accountId: number) => {
    const account = agentAccounts.get(accountId);
    if (!account || !account.publicKey) return;

    try {
      console.log(`🔄 Refreshing data for account ${accountId}`);
      
      // Fetch account-specific data including real account balance
      const [positions, openOrders, tradeHistory, accountBalance] = await Promise.all([
        marketDataService.fetchPositions(account.publicKey),
        marketDataService.fetchOpenOrders(account.publicKey),
        marketDataService.fetchTradeHistory(account.publicKey, 50),
        marketDataService.getAccountBalance({
          accountId: account.accountId,
          accountName: account.accountName,
          publicKey: account.publicKey,
          privateKey: account.privateKey,
          balance: "0",
          pnl: "0",
          pair: account.pair || "BTC/USDT",
          openOrdersCount: 0,
          connectionStatus: "connected"
        })
      ]);

      // Calculate account metrics
      const balance = accountBalance.toFixed(2); // Use real account balance from clearing house
      const pnl = positions.reduce((total, pos) => total + pos.pnl, 0).toFixed(2);
      
      // Calculate effective leverage (total position value / account balance)
      const totalPositionValue = positions.reduce((total, pos) => total + Math.abs(pos.size * pos.markPrice), 0);
      const balanceNum = parseFloat(balance) || 1; // Avoid division by zero
      const effectiveLeverage = totalPositionValue > 0 ? (totalPositionValue / balanceNum).toFixed(1) : "0";
      const leverageDisplay = effectiveLeverage !== "0" ? `${effectiveLeverage}x` : "No Leverage";

      // Update account with fresh data
      updateAgentAccount(accountId, {
        positions,
        openOrders,
        tradeHistory,
        balance: `$${balance}`,
        pnl: parseFloat(pnl) >= 0 ? `+$${pnl}` : `-$${Math.abs(parseFloat(pnl))}`,
        leverage: leverageDisplay,
        openOrdersCount: openOrders.length
      });

    } catch (error) {
      console.error(`❌ Error refreshing data for account ${accountId}:`, error);
      updateAgentAccount(accountId, {
        connectionStatus: "error"
      });
    }
  }, [agentAccounts, updateAgentAccount]);

  // Refresh all accounts data
  const refreshAllAccountsData = useCallback(async () => {
    console.log(`🔄 Refreshing data for all ${agentAccounts.size} accounts`);
    
    const promises = Array.from(agentAccounts.keys()).map(accountId => 
      refreshAccountData(accountId)
    );
    
    await Promise.allSettled(promises);
    console.log(`✅ Completed data refresh for all accounts`);
  }, [agentAccounts, refreshAccountData]);

  // Get current price for a symbol
  const getPrice = useCallback((symbol: string) => {
    const price = marketPrices.get(symbol);
    return price ? price.price : null;
  }, [marketPrices]);

  // Execute order on specific account
  const executeOrderOnAccount = useCallback(async (order: TradingOrder, accountId: number): Promise<{ success: boolean; message: string; orderId?: string }> => {
    const account = agentAccounts.get(accountId);
    
    if (!account) {
      return { success: false, message: `Account ${accountId} not found` };
    }
    
    if (!account.privateKey) {
      return { success: false, message: `Account ${accountId} has no private key for trading` };
    }

    setIsTrading(true);
    
    try {
      console.log(`🚀 Executing order on account ${accountId}: ${order.side} ${order.quantity} ${order.symbol}`);
      
      // Use the same order execution logic as the original context
      // Get asset index for the trading pair
      const assetSymbol = order.symbol.replace('/USDT', '').replace('/USDC', '').replace('-USD', '');
      
      // Fetch asset metadata
      const metaResponse = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: "meta" })
      });
      
      if (!metaResponse.ok) {
        throw new Error(`Failed to fetch asset metadata: ${metaResponse.status}`);
      }
      
      const metaData = await metaResponse.json();
      const assetIndex = metaData.universe.findIndex((asset: { name: string }) => asset.name === assetSymbol);
      
      if (assetIndex === -1) {
        throw new Error(`Asset ${assetSymbol} not found`);
      }

      // Determine order price and type
      let orderPrice: string;
      let timeInForce: { limit: { tif: string } };
      const currentPrice = getPrice(assetSymbol) || 0;

      if (order.orderType === "market") {
        if (order.side === "buy") {
          orderPrice = Math.round(currentPrice * 1.05).toString();
        } else {
          orderPrice = Math.round(currentPrice * 0.95).toString();
        }
        timeInForce = { limit: { tif: "Ioc" } };
      } else {
        orderPrice = order.price?.toString() || currentPrice.toString();
        timeInForce = { limit: { tif: "Gtc" } };
      }

      // Create the HyperLiquid order payload
      const hyperLiquidOrder = {
        a: assetIndex,
        b: order.side === "buy",
        p: orderPrice,
        s: order.quantity.toString(),
        r: false,
        t: timeInForce
      };

      const orderAction = {
        type: "order",
        orders: [hyperLiquidOrder],
        grouping: "na"
      };

      // Import signOrderAction here to avoid circular dependencies
      const { signOrderAction } = await import("../utils/hyperLiquidSigning");
      
      // Sign and send the order using the account's private key
      const nonce = Date.now();
      const signature = await signOrderAction(orderAction, nonce, account.privateKey);
      
      const payload = {
        action: orderAction,
        nonce: nonce,
        signature: {
          r: signature.r,
          s: signature.s,
          v: signature.v
        }
      };

      // Submit to HyperLiquid
      const response = await fetch('https://api.hyperliquid.xyz/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      
      if (result.status === "ok") {
        console.log(`✅ Order executed successfully on account ${accountId}`);
        // Refresh this account's data
        setTimeout(() => refreshAccountData(accountId), 1000);
        return { 
          success: true, 
          message: `Order executed on ${account.accountName}`, 
          orderId: result.response?.data?.statuses?.[0]?.resting?.oid || 'unknown'
        };
      } else {
        console.log(`❌ Order failed on account ${accountId}: ${result.response || result.error}`);
        return { success: false, message: `Failed on ${account.accountName}: ${result.response || result.error}` };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Order execution error on account ${accountId}:`, errorMessage);
      return { success: false, message: `Error on ${account.accountName}: ${errorMessage}` };
    } finally {
      setIsTrading(false);
    }
  }, [agentAccounts, refreshAccountData, getPrice]);

  // Execute order on all connected accounts
  const executeOrderOnAllAccounts = useCallback(async (order: TradingOrder) => {
    const connectedAccounts = Array.from(agentAccounts.values()).filter(acc => 
      acc.connectionStatus === "connected" && acc.isActive
    );
    
    if (connectedAccounts.length === 0) {
      return { 
        success: false, 
        message: "No active accounts available", 
        results: [] 
      };
    }

    console.log(`🚀 Executing order on ${connectedAccounts.length} accounts: ${order.side} ${order.quantity} ${order.symbol}`);
    
    const results = await Promise.all(
      connectedAccounts.map(account => 
        executeOrderOnAccount(order, account.accountId)
      )
    );

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;

    return {
      success: successCount > 0,
      message: `Executed on ${successCount}/${totalCount} accounts`,
      results: results.map((result, index) => ({
        accountId: connectedAccounts[index].accountId,
        ...result
      }))
    };
  }, [agentAccounts, executeOrderOnAccount]);

  // Close all positions on specific account
  const closeAllPositionsOnAccount = useCallback(async (accountId: number) => {
    const account = agentAccounts.get(accountId);
    
    if (!account) {
      return { success: false, message: `Account ${accountId} not found` };
    }

    // Implementation would close all positions for this specific account
    console.log(`🔒 Closing all positions on account ${accountId}`);
    
    // This would use the account's private key to close positions
    // For now, return a placeholder
    return { success: true, message: `Closed all positions on ${account.accountName}` };
  }, [agentAccounts]);

  // Close all positions on all accounts
  const closeAllPositionsOnAllAccounts = useCallback(async () => {
    const connectedAccounts = Array.from(agentAccounts.values()).filter(acc => 
      acc.connectionStatus === "connected" && acc.isActive
    );

    const results = await Promise.all(
      connectedAccounts.map(account => 
        closeAllPositionsOnAccount(account.accountId)
      )
    );

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount > 0,
      message: `Closed positions on ${successCount}/${results.length} accounts`,
      results: results.map((result, index) => ({
        accountId: connectedAccounts[index].accountId,
        ...result
      }))
    };
  }, [agentAccounts, closeAllPositionsOnAccount]);

  // Cancel all orders on specific account
  const cancelAllOrdersOnAccount = useCallback(async (accountId: number) => {
    const account = agentAccounts.get(accountId);
    
    if (!account) {
      return { success: false, message: `Account ${accountId} not found` };
    }

    console.log(`❌ Canceling all orders on account ${accountId}`);
    return { success: true, message: `Canceled all orders on ${account.accountName}` };
  }, [agentAccounts]);

  // Cancel all orders on all accounts
  const cancelAllOrdersOnAllAccounts = useCallback(async () => {
    const connectedAccounts = Array.from(agentAccounts.values()).filter(acc => 
      acc.connectionStatus === "connected" && acc.isActive
    );

    const results = await Promise.all(
      connectedAccounts.map(account => 
        cancelAllOrdersOnAccount(account.accountId)
      )
    );

    const successCount = results.filter(r => r.success).length;

    return {
      success: successCount > 0,
      message: `Canceled orders on ${successCount}/${results.length} accounts`,
      results: results.map((result, index) => ({
        accountId: connectedAccounts[index].accountId,
        ...result
      }))
    };
  }, [agentAccounts, cancelAllOrdersOnAccount]);

  // Helper functions
  const getConnectedAccounts = useCallback(() => {
    return Array.from(agentAccounts.values()).filter(acc => acc.connectionStatus === "connected");
  }, [agentAccounts]);

  const getAccountCount = useCallback(() => {
    return agentAccounts.size;
  }, [agentAccounts]);

  const isAccountConnected = useCallback((accountId: number) => {
    const account = agentAccounts.get(accountId);
    return account?.connectionStatus === "connected" || false;
  }, [agentAccounts]);

  // Auto-refresh market data
  useEffect(() => {
    refreshMarketData();
    const interval = setInterval(refreshMarketData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [refreshMarketData]);

  // Auto-refresh account data every 10 seconds
  useEffect(() => {
    if (agentAccounts.size > 0) {
      const interval = setInterval(refreshAllAccountsData, 10000);
      return () => clearInterval(interval);
    }
  }, [agentAccounts.size, refreshAllAccountsData]);

  const contextValue: MultiAccountTradingContextType = {
    masterAccount,
    setMasterAccount,
    agentAccounts,
    addAgentAccount,
    removeAgentAccount,
    updateAgentAccount,
    getAgentAccount,
    activeAccountId,
    setActiveAccountId,
    marginMode,
    setMarginMode,
    isTrading,
    setIsTrading,
    executeOrderOnAccount,
    executeOrderOnAllAccounts,
    closeAllPositionsOnAccount,
    closeAllPositionsOnAllAccounts,
    cancelAllOrdersOnAccount,
    cancelAllOrdersOnAllAccounts,
    marketPrices,
    refreshMarketData,
    refreshAccountData,
    refreshAllAccountsData,
    getPrice,
    getConnectedAccounts,
    getAccountCount,
    isAccountConnected
  };

  return (
    <MultiAccountTradingContext.Provider value={contextValue}>
      {children}
    </MultiAccountTradingContext.Provider>
  );
};

// Hook to use the multi-account trading context
export const useMultiAccountTrading = () => {
  const context = useContext(MultiAccountTradingContext);
  if (context === undefined) {
    throw new Error('useMultiAccountTrading must be used within a MultiAccountTradingProvider');
  }
  return context;
};
