// Enhanced Market Data Service with MongoDB Integration
import { marketDataService as originalService } from '../utils/marketDataService';
import { tradingDataService } from './tradingDataService';
import type { MarketPrice, TradeHistoryItem, OpenOrder, Position } from '../utils/marketDataService';
import type { ConnectedAccount } from '../contexts/TradingContext';

export class EnhancedMarketDataService {
  private userId: string = '';

  setUserId(userId: string) {
    this.userId = userId;
  }

  // ========================================
  // ENHANCED DATA FETCHING WITH PERSISTENCE
  // ========================================

  async fetchAndStoreMarketPrices(): Promise<Map<string, MarketPrice>> {
    try {
      // Fetch from HyperLiquid API
      const prices = await originalService.fetchMarketPrices();
      
      // Store in MongoDB for historical analysis
      if (prices.size > 0) {
        const marketDataArray = Array.from(prices.values()).map(price => ({
          symbol: price.symbol,
          price: price.price,
          change24h: price.change24h,
          volume24h: price.volume24h,
          high24h: price.price * 1.05, // Estimate high
          low24h: price.price * 0.95,  // Estimate low
          timestamp: new Date()
        }));

        await tradingDataService.saveMarketData(marketDataArray);
      }

      return prices;
    } catch (error) {
      console.error('Error fetching and storing market prices:', error);
      throw error;
    }
  }

  async fetchAndStoreTradeHistory(account: ConnectedAccount, limit: number = 200): Promise<TradeHistoryItem[]> {
    try {
      // Fetch from HyperLiquid API
      const trades = await originalService.fetchTradeHistory(account.publicKey, limit);
      
      // Store each trade in MongoDB
      for (const trade of trades) {
        await tradingDataService.saveTradeHistory({
          userId: this.userId,
          accountId: account.accountId,
          id: trade.id,
          timestamp: trade.timestamp,
          symbol: trade.symbol,
          side: trade.side,
          quantity: trade.quantity,
          price: trade.price,
          value: trade.value,
          status: trade.status,
          orderId: trade.orderId,
          type: trade.type,
          fee: 0, // Calculate or fetch actual fee
          pnl: trade.value * (trade.side === 'buy' ? -1 : 1) // Simplified PnL calculation
        });
      }

      return trades;
    } catch (error) {
      console.error('Error fetching and storing trade history:', error);
      throw error;
    }
  }

  async fetchAndStoreOpenOrders(account: ConnectedAccount): Promise<OpenOrder[]> {
    try {
      // Fetch from HyperLiquid API
      const orders = await originalService.fetchOpenOrders(account.publicKey);
      
      // Store each order in MongoDB
      for (const order of orders) {
        await tradingDataService.saveOpenOrder({
          userId: this.userId,
          accountId: account.accountId,
          id: order.id,
          symbol: order.symbol,
          side: order.side,
          type: order.type,
          quantity: order.quantity,
          price: order.price,
          filled: order.filled,
          remaining: order.remaining,
          status: order.status,
          timestamp: new Date(order.timestamp),
          hyperLiquidOrderId: order.id
        });
      }

      return orders;
    } catch (error) {
      console.error('Error fetching and storing open orders:', error);
      throw error;
    }
  }

  async fetchAndStorePositions(account: ConnectedAccount): Promise<Position[]> {
    try {
      // Fetch from HyperLiquid API
      const positions = await originalService.fetchPositions(account.publicKey);
      
      // Store each position in MongoDB
      for (const position of positions) {
        await tradingDataService.savePosition({
          userId: this.userId,
          accountId: account.accountId,
          symbol: position.symbol,
          side: position.side,
          size: position.size,
          entryPrice: position.entryPrice,
          markPrice: position.markPrice,
          pnl: position.pnl,
          pnlPercentage: position.pnlPercentage,
          leverage: position.leverage,
          margin: position.margin,
          timestamp: new Date(position.timestamp),
          isActive: position.size > 0
        });
      }

      return positions;
    } catch (error) {
      console.error('Error fetching and storing positions:', error);
      throw error;
    }
  }

  // ========================================
  // HISTORICAL DATA RETRIEVAL
  // ========================================

  async getHistoricalTrades(accountId: number, days: number = 30): Promise<any[]> {
    try {
      if (!this.userId) {
        throw new Error('User ID not set');
      }

      const statistics = await tradingDataService.getTradingStatistics(this.userId, accountId, days);
      return statistics;
    } catch (error) {
      console.error('Error fetching historical trades:', error);
      throw error;
    }
  }

  async getHistoricalPrices(symbol: string, hours: number = 24): Promise<any[]> {
    try {
      const historicalData = await tradingDataService.getHistoricalMarketData(symbol, hours);
      return historicalData;
    } catch (error) {
      console.error('Error fetching historical prices:', error);
      throw error;
    }
  }

  // ========================================
  // ACCOUNT MANAGEMENT
  // ========================================

  async saveConnectedAccount(account: ConnectedAccount): Promise<void> {
    try {
      if (!this.userId) {
        throw new Error('User ID not set');
      }

      await tradingDataService.saveConnectedAccount({
        userId: this.userId,
        accountId: account.accountId,
        accountName: account.accountName,
        publicKey: account.publicKey,
        balance: account.balance,
        pnl: account.pnl,
        pair: account.pair,
        openOrdersCount: account.openOrdersCount,
        connectionStatus: account.connectionStatus
      });
    } catch (error) {
      console.error('Error saving connected account:', error);
      throw error;
    }
  }

  async getStoredConnectedAccounts(): Promise<any[]> {
    try {
      if (!this.userId) {
        throw new Error('User ID not set');
      }

      return await tradingDataService.getConnectedAccounts(this.userId);
    } catch (error) {
      console.error('Error fetching stored connected accounts:', error);
      throw error;
    }
  }

  // ========================================
  // TRADING SESSION MANAGEMENT
  // ========================================

  async startTradingSession(accountId: number): Promise<string> {
    try {
      if (!this.userId) {
        throw new Error('User ID not set');
      }

      const session = await tradingDataService.startTradingSession(this.userId, accountId);
      return session.sessionId;
    } catch (error) {
      console.error('Error starting trading session:', error);
      throw error;
    }
  }

  async endTradingSession(sessionId: string, finalStats: any): Promise<void> {
    try {
      await tradingDataService.updateTradingSession(sessionId, {
        ...finalStats,
        endTime: new Date(),
        isActive: false
      });
    } catch (error) {
      console.error('Error ending trading session:', error);
      throw error;
    }
  }

  // ========================================
  // FALLBACK TO ORIGINAL SERVICE
  // ========================================

  // For methods that don't need MongoDB integration, delegate to original service
  async getAccountBalance(account: ConnectedAccount): Promise<number> {
    return await originalService.getAccountBalance(account);
  }

  async fetchFundingRates(): Promise<Map<string, number>> {
    return await originalService.fetchFundingRates();
  }

  async fetchOrderbook(symbol: string): Promise<any> {
    return await originalService.fetchOrderbook(symbol);
  }
}

// Export singleton instance
export const enhancedMarketDataService = new EnhancedMarketDataService();
