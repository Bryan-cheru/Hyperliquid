// Data Access Layer for Trading Operations
import { 
  User, ConnectedAccount, AgentAccount, Position, TradeHistory, 
  OpenOrder, BasketOrder, TradingSession, MarketData,
  IUser, IConnectedAccount, IAgentAccount, IPosition, 
  ITradeHistory, IOpenOrder, IBasketOrder, ITradingSession, IMarketData
} from '../models/tradingModels';
import * as crypto from 'crypto';

// Encryption utilities for sensitive data
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-key-for-development';

function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class TradingDataService {
  
  // ========================================
  // USER MANAGEMENT
  // ========================================
  
  async createUser(userData: Partial<IUser>): Promise<IUser> {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<IUser | null> {
    try {
      return await User.findOne({ userId });
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<IUser['preferences']>): Promise<IUser | null> {
    try {
      return await User.findOneAndUpdate(
        { userId },
        { $set: { preferences, lastLogin: new Date() } },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw error;
    }
  }

  // ========================================
  // ACCOUNT MANAGEMENT
  // ========================================

  async saveConnectedAccount(accountData: Partial<IConnectedAccount>): Promise<IConnectedAccount> {
    try {
      const existingAccount = await ConnectedAccount.findOne({ 
        userId: accountData.userId, 
        accountId: accountData.accountId 
      });

      if (existingAccount) {
        // Update existing account
        Object.assign(existingAccount, accountData, { lastUpdated: new Date() });
        return await existingAccount.save();
      } else {
        // Create new account
        const account = new ConnectedAccount(accountData);
        return await account.save();
      }
    } catch (error) {
      console.error('Error saving connected account:', error);
      throw error;
    }
  }

  async saveAgentAccount(accountData: Partial<IAgentAccount>): Promise<IAgentAccount> {
    try {
      // Encrypt private key before saving
      const encryptedData = {
        ...accountData,
        encryptedPrivateKey: accountData.encryptedPrivateKey || 
          (accountData as any).privateKey ? encrypt((accountData as any).privateKey) : ''
      };

      const existingAccount = await AgentAccount.findOne({ 
        userId: accountData.userId, 
        accountId: accountData.accountId 
      });

      if (existingAccount) {
        Object.assign(existingAccount, encryptedData, { lastUpdated: new Date() });
        return await existingAccount.save();
      } else {
        const account = new AgentAccount(encryptedData);
        return await account.save();
      }
    } catch (error) {
      console.error('Error saving agent account:', error);
      throw error;
    }
  }

  async getConnectedAccounts(userId: string): Promise<IConnectedAccount[]> {
    try {
      return await ConnectedAccount.find({ userId }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      throw error;
    }
  }

  async getAgentAccounts(userId: string): Promise<IAgentAccount[]> {
    try {
      const accounts = await AgentAccount.find({ userId }).sort({ createdAt: -1 });
      // Decrypt private keys when retrieving
      return accounts.map(account => ({
        ...account.toObject(),
        privateKey: account.encryptedPrivateKey ? decrypt(account.encryptedPrivateKey) : ''
      })) as IAgentAccount[];
    } catch (error) {
      console.error('Error fetching agent accounts:', error);
      throw error;
    }
  }

  // ========================================
  // TRADING DATA PERSISTENCE
  // ========================================

  async savePosition(positionData: Partial<IPosition>): Promise<IPosition> {
    try {
      const existingPosition = await Position.findOne({
        userId: positionData.userId,
        accountId: positionData.accountId,
        symbol: positionData.symbol,
        isActive: true
      });

      if (existingPosition) {
        Object.assign(existingPosition, positionData, { timestamp: new Date() });
        return await existingPosition.save();
      } else {
        const position = new Position(positionData);
        return await position.save();
      }
    } catch (error) {
      console.error('Error saving position:', error);
      throw error;
    }
  }

  async saveTradeHistory(tradeData: Partial<ITradeHistory>): Promise<ITradeHistory> {
    try {
      const existingTrade = await TradeHistory.findOne({ id: tradeData.id });
      
      if (existingTrade) {
        Object.assign(existingTrade, tradeData);
        return await existingTrade.save();
      } else {
        const trade = new TradeHistory(tradeData);
        return await trade.save();
      }
    } catch (error) {
      console.error('Error saving trade history:', error);
      throw error;
    }
  }

  async saveOpenOrder(orderData: Partial<IOpenOrder>): Promise<IOpenOrder> {
    try {
      const existingOrder = await OpenOrder.findOne({ id: orderData.id });
      
      if (existingOrder) {
        Object.assign(existingOrder, orderData);
        return await existingOrder.save();
      } else {
        const order = new OpenOrder(orderData);
        return await order.save();
      }
    } catch (error) {
      console.error('Error saving open order:', error);
      throw error;
    }
  }

  // ========================================
  // BASKET ORDER MANAGEMENT
  // ========================================

  async saveBasketOrder(basketData: Partial<IBasketOrder>): Promise<IBasketOrder> {
    try {
      const existingBasket = await BasketOrder.findOne({ id: basketData.id });
      
      if (existingBasket) {
        Object.assign(existingBasket, basketData, { updatedAt: new Date() });
        return await existingBasket.save();
      } else {
        const basket = new BasketOrder(basketData);
        return await basket.save();
      }
    } catch (error) {
      console.error('Error saving basket order:', error);
      throw error;
    }
  }

  async getActiveBasketOrders(userId: string, accountId: number): Promise<IBasketOrder[]> {
    try {
      return await BasketOrder.find({ 
        userId, 
        accountId, 
        status: 'active' 
      }).sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error fetching active basket orders:', error);
      throw error;
    }
  }

  async updateBasketOrderStatus(basketId: string, status: string, logEntry?: any): Promise<IBasketOrder | null> {
    try {
      const updateData: any = { status, updatedAt: new Date() };
      
      if (logEntry) {
        updateData.$push = { executionLog: logEntry };
      }

      return await BasketOrder.findOneAndUpdate(
        { id: basketId },
        updateData,
        { new: true }
      );
    } catch (error) {
      console.error('Error updating basket order status:', error);
      throw error;
    }
  }

  // ========================================
  // ANALYTICS & REPORTING
  // ========================================

  async startTradingSession(userId: string, accountId: number): Promise<ITradingSession> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session = new TradingSession({
        userId,
        accountId,
        sessionId,
        startTime: new Date(),
        isActive: true
      });
      return await session.save();
    } catch (error) {
      console.error('Error starting trading session:', error);
      throw error;
    }
  }

  async updateTradingSession(sessionId: string, updates: Partial<ITradingSession>): Promise<ITradingSession | null> {
    try {
      return await TradingSession.findOneAndUpdate(
        { sessionId },
        { $set: updates },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating trading session:', error);
      throw error;
    }
  }

  async getTradingStatistics(userId: string, accountId: number, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const trades = await TradeHistory.find({
        userId,
        accountId,
        timestamp: { $gte: startDate.getTime() }
      });

      const positions = await Position.find({
        userId,
        accountId,
        timestamp: { $gte: startDate }
      });

      // Calculate statistics
      const totalTrades = trades.length;
      const winningTrades = trades.filter(t => (t.pnl || 0) > 0).length;
      const losingTrades = trades.filter(t => (t.pnl || 0) < 0).length;
      const totalPnl = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);
      const totalVolume = trades.reduce((sum, t) => sum + t.value, 0);
      const totalFees = trades.reduce((sum, t) => sum + t.fee, 0);

      return {
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
        totalPnl,
        totalVolume,
        totalFees,
        profitFactor: losingTrades > 0 ? 
          (trades.filter(t => (t.pnl || 0) > 0).reduce((sum, t) => sum + (t.pnl || 0), 0)) /
          Math.abs(trades.filter(t => (t.pnl || 0) < 0).reduce((sum, t) => sum + (t.pnl || 0), 0)) : 0,
        activePositions: positions.filter(p => p.isActive).length,
        dateRange: { startDate, endDate: new Date() }
      };
    } catch (error) {
      console.error('Error calculating trading statistics:', error);
      throw error;
    }
  }

  // ========================================
  // MARKET DATA PERSISTENCE
  // ========================================

  async saveMarketData(marketData: Partial<IMarketData>[]): Promise<void> {
    try {
      const operations = marketData.map(data => ({
        updateOne: {
          filter: { symbol: data.symbol },
          update: { $set: { ...data, timestamp: new Date() } },
          upsert: true
        }
      }));

      await MarketData.bulkWrite(operations);
    } catch (error) {
      console.error('Error saving market data:', error);
      throw error;
    }
  }

  async getHistoricalMarketData(symbol: string, hours: number = 24): Promise<IMarketData[]> {
    try {
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - hours);

      return await MarketData.find({
        symbol,
        timestamp: { $gte: startTime }
      }).sort({ timestamp: -1 });
    } catch (error) {
      console.error('Error fetching historical market data:', error);
      throw error;
    }
  }

  // ========================================
  // DATA CLEANUP & MAINTENANCE
  // ========================================

  async cleanupOldData(days: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Clean up old market data
      await MarketData.deleteMany({ timestamp: { $lt: cutoffDate } });
      
      // Clean up old completed trading sessions
      await TradingSession.deleteMany({ 
        endTime: { $lt: cutoffDate },
        isActive: false 
      });

      console.log(`✅ Cleaned up data older than ${days} days`);
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const tradingDataService = new TradingDataService();
