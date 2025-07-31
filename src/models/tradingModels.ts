// MongoDB Database Models for HyperLiquid Trading Platform
import mongoose, { Schema, Document } from 'mongoose';

// ========================================
// USER & ACCOUNT MODELS
// ========================================

export interface IUser extends Document {
  userId: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin: Date;
  isActive: boolean;
  preferences: {
    defaultLeverage: number;
    riskLevel: 'low' | 'medium' | 'high';
    autoSave: boolean;
    notifications: boolean;
  };
}

const UserSchema = new Schema<IUser>({
  userId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  preferences: {
    defaultLeverage: { type: Number, default: 10 },
    riskLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    autoSave: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true }
  }
});

// Connected Account Model (Master Account - View Only)
export interface IConnectedAccount extends Document {
  userId: string;
  accountId: number;
  accountName: string;
  publicKey: string;
  balance: string;
  pnl: string;
  pair: string;
  openOrdersCount: number;
  connectionStatus: 'connected' | 'idle' | 'error';
  createdAt: Date;
  lastUpdated: Date;
}

const ConnectedAccountSchema = new Schema<IConnectedAccount>({
  userId: { type: String, required: true },
  accountId: { type: Number, required: true },
  accountName: { type: String, required: true },
  publicKey: { type: String, required: true },
  balance: { type: String, required: true },
  pnl: { type: String, required: true },
  pair: { type: String, required: true },
  openOrdersCount: { type: Number, default: 0 },
  connectionStatus: { type: String, enum: ['connected', 'idle', 'error'], default: 'idle' },
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
});

// Agent Account Model (Trading Account - with encrypted private key)
export interface IAgentAccount extends Document {
  userId: string;
  accountId: number;
  accountName: string;
  publicKey: string;
  encryptedPrivateKey: string; // Encrypted for security
  isActive: boolean;
  connectionStatus: 'connected' | 'idle' | 'error';
  balance: string;
  pnl: string;
  pair: string;
  leverage: string;
  openOrdersCount: number;
  createdAt: Date;
  lastUpdated: Date;
}

const AgentAccountSchema = new Schema<IAgentAccount>({
  userId: { type: String, required: true },
  accountId: { type: Number, required: true },
  accountName: { type: String, required: true },
  publicKey: { type: String, required: true },
  encryptedPrivateKey: { type: String, required: true }, // Encrypted storage
  isActive: { type: Boolean, default: true },
  connectionStatus: { type: String, enum: ['connected', 'idle', 'error'], default: 'idle' },
  balance: { type: String, default: '0' },
  pnl: { type: String, default: '0' },
  pair: { type: String, default: 'BTC/USDT' },
  leverage: { type: String, default: '10' },
  openOrdersCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now }
});

// ========================================
// TRADING DATA MODELS
// ========================================

export interface IPosition extends Document {
  userId: string;
  accountId: number;
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercentage: number;
  leverage: number;
  margin: number;
  timestamp: Date;
  isActive: boolean;
}

const PositionSchema = new Schema<IPosition>({
  userId: { type: String, required: true },
  accountId: { type: Number, required: true },
  symbol: { type: String, required: true },
  side: { type: String, enum: ['long', 'short'], required: true },
  size: { type: Number, required: true },
  entryPrice: { type: Number, required: true },
  markPrice: { type: Number, required: true },
  pnl: { type: Number, required: true },
  pnlPercentage: { type: Number, required: true },
  leverage: { type: Number, required: true },
  margin: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

export interface ITradeHistory extends Document {
  userId: string;
  accountId: number;
  id: string;
  timestamp: number;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  value: number;
  status: 'filled' | 'partial' | 'cancelled';
  orderId: string;
  type: 'market' | 'limit' | 'conditional';
  fee: number;
  pnl?: number;
}

const TradeHistorySchema = new Schema<ITradeHistory>({
  userId: { type: String, required: true },
  accountId: { type: Number, required: true },
  id: { type: String, required: true, unique: true },
  timestamp: { type: Number, required: true },
  symbol: { type: String, required: true },
  side: { type: String, enum: ['buy', 'sell'], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  value: { type: Number, required: true },
  status: { type: String, enum: ['filled', 'partial', 'cancelled'], required: true },
  orderId: { type: String, required: true },
  type: { type: String, enum: ['market', 'limit', 'conditional'], required: true },
  fee: { type: Number, default: 0 },
  pnl: { type: Number, optional: true }
});

export interface IOpenOrder extends Document {
  userId: string;
  accountId: number;
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
  filled: number;
  remaining: number;
  status: 'open' | 'partial';
  timestamp: Date;
  hyperLiquidOrderId?: string; // Reference to HyperLiquid order ID
}

const OpenOrderSchema = new Schema<IOpenOrder>({
  userId: { type: String, required: true },
  accountId: { type: Number, required: true },
  id: { type: String, required: true, unique: true },
  symbol: { type: String, required: true },
  side: { type: String, enum: ['buy', 'sell'], required: true },
  type: { type: String, enum: ['market', 'limit'], required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, optional: true },
  filled: { type: Number, default: 0 },
  remaining: { type: Number, required: true },
  status: { type: String, enum: ['open', 'partial'], required: true },
  timestamp: { type: Date, default: Date.now },
  hyperLiquidOrderId: { type: String, optional: true }
});

// ========================================
// BASKET ORDER MODELS
// ========================================

export interface IBasketOrder extends Document {
  userId: string;
  accountId: number;
  id: string;
  name: string;
  symbol: string;
  side: 'buy' | 'sell';
  entryOrder: {
    type: 'market' | 'limit';
    quantity: number;
    price?: number;
    executed: boolean;
    orderId?: string;
  };
  stopLoss: {
    enabled: boolean;
    price: number;
    executed: boolean;
    orderId?: string;
  };
  takeProfit: {
    enabled: boolean;
    targets: Array<{
      price: number;
      quantity: number;
      executed: boolean;
      orderId?: string;
    }>;
  };
  limitChaser: {
    enabled: boolean;
    config: {
      priceOffset: number;
      updateInterval: number;
      maxUpdates: number;
    };
  };
  status: 'active' | 'completed' | 'cancelled' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  executionLog: Array<{
    timestamp: Date;
    action: string;
    details: string;
    success: boolean;
  }>;
}

const BasketOrderSchema = new Schema<IBasketOrder>({
  userId: { type: String, required: true },
  accountId: { type: Number, required: true },
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  symbol: { type: String, required: true },
  side: { type: String, enum: ['buy', 'sell'], required: true },
  entryOrder: {
    type: { type: String, enum: ['market', 'limit'], required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, optional: true },
    executed: { type: Boolean, default: false },
    orderId: { type: String, optional: true }
  },
  stopLoss: {
    enabled: { type: Boolean, default: false },
    price: { type: Number, optional: true },
    executed: { type: Boolean, default: false },
    orderId: { type: String, optional: true }
  },
  takeProfit: {
    enabled: { type: Boolean, default: false },
    targets: [{
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      executed: { type: Boolean, default: false },
      orderId: { type: String, optional: true }
    }]
  },
  limitChaser: {
    enabled: { type: Boolean, default: false },
    config: {
      priceOffset: { type: Number, default: 0.1 },
      updateInterval: { type: Number, default: 5000 },
      maxUpdates: { type: Number, default: 100 }
    }
  },
  status: { type: String, enum: ['active', 'completed', 'cancelled', 'failed'], default: 'active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  executionLog: [{
    timestamp: { type: Date, default: Date.now },
    action: { type: String, required: true },
    details: { type: String, required: true },
    success: { type: Boolean, required: true }
  }]
});

// ========================================
// ANALYTICS & PERFORMANCE MODELS
// ========================================

export interface ITradingSession extends Document {
  userId: string;
  accountId: number;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalPnl: number;
  totalVolume: number;
  totalFees: number;
  maxDrawdown: number;
  winRate: number;
  profitFactor: number;
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  isActive: boolean;
}

const TradingSessionSchema = new Schema<ITradingSession>({
  userId: { type: String, required: true },
  accountId: { type: Number, required: true },
  sessionId: { type: String, required: true, unique: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date, optional: true },
  totalTrades: { type: Number, default: 0 },
  winningTrades: { type: Number, default: 0 },
  losingTrades: { type: Number, default: 0 },
  totalPnl: { type: Number, default: 0 },
  totalVolume: { type: Number, default: 0 },
  totalFees: { type: Number, default: 0 },
  maxDrawdown: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 },
  profitFactor: { type: Number, default: 0 },
  averageWin: { type: Number, default: 0 },
  averageLoss: { type: Number, default: 0 },
  largestWin: { type: Number, default: 0 },
  largestLoss: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

// ========================================
// MARKET DATA MODELS
// ========================================

export interface IMarketData extends Document {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  timestamp: Date;
}

const MarketDataSchema = new Schema<IMarketData>({
  symbol: { type: String, required: true },
  price: { type: Number, required: true },
  change24h: { type: Number, required: true },
  volume24h: { type: Number, required: true },
  high24h: { type: Number, required: true },
  low24h: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
});

// Create indexes for better performance
UserSchema.index({ userId: 1 });
UserSchema.index({ email: 1 });
ConnectedAccountSchema.index({ userId: 1, accountId: 1 });
AgentAccountSchema.index({ userId: 1, accountId: 1 });
PositionSchema.index({ userId: 1, accountId: 1, symbol: 1 });
TradeHistorySchema.index({ userId: 1, accountId: 1, timestamp: -1 });
OpenOrderSchema.index({ userId: 1, accountId: 1, status: 1 });
BasketOrderSchema.index({ userId: 1, accountId: 1, status: 1 });
TradingSessionSchema.index({ userId: 1, accountId: 1, startTime: -1 });
MarketDataSchema.index({ symbol: 1, timestamp: -1 });

// Export models
export const User = mongoose.model<IUser>('User', UserSchema);
export const ConnectedAccount = mongoose.model<IConnectedAccount>('ConnectedAccount', ConnectedAccountSchema);
export const AgentAccount = mongoose.model<IAgentAccount>('AgentAccount', AgentAccountSchema);
export const Position = mongoose.model<IPosition>('Position', PositionSchema);
export const TradeHistory = mongoose.model<ITradeHistory>('TradeHistory', TradeHistorySchema);
export const OpenOrder = mongoose.model<IOpenOrder>('OpenOrder', OpenOrderSchema);
export const BasketOrder = mongoose.model<IBasketOrder>('BasketOrder', BasketOrderSchema);
export const TradingSession = mongoose.model<ITradingSession>('TradingSession', TradingSessionSchema);
export const MarketData = mongoose.model<IMarketData>('MarketData', MarketDataSchema);
