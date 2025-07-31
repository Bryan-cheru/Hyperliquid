# 🗄️ MongoDB Integration Guide for HyperLiquid Trading Platform

## 📋 Overview

This guide explains how to integrate MongoDB with your HyperLiquid trading application to add data persistence, analytics, and enhanced functionality.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Run the installation script
.\install-mongodb-deps.ps1

# Or install manually:
npm install mongoose @types/mongoose dotenv @types/dotenv bcryptjs @types/bcryptjs jsonwebtoken @types/jsonwebtoken
```

### 2. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your MongoDB connection string
MONGODB_URI=mongodb://localhost:27017/hyperliquid_trading
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

### 3. Initialize Database in Your App

```typescript
// In your main.tsx or App.tsx
import { initializeDatabase } from './utils/databaseInit';

// Initialize database when app starts
initializeDatabase().then(success => {
  if (success) {
    console.log('✅ Database ready for trading!');
  } else {
    console.error('❌ Database initialization failed');
  }
});
```

## 🏗️ Architecture Benefits

### ✅ **Data Persistence**
- **Trading History**: All trades automatically saved to MongoDB
- **Account Data**: Connected accounts and agent wallets stored securely
- **Market Data**: Historical price data for analysis
- **User Preferences**: Trading settings and configurations

### ✅ **Enhanced Analytics**
- **Performance Tracking**: Win rates, profit factors, drawdown analysis
- **Trading Sessions**: Track session performance and statistics
- **Historical Analysis**: Compare current performance with past data
- **Risk Metrics**: Calculate and track risk-adjusted returns

### ✅ **Security Improvements**
- **Encrypted Storage**: Private keys encrypted with AES-256
- **User Management**: Secure user accounts with hashed passwords
- **Audit Trail**: Complete trading history for compliance
- **Access Control**: Role-based permissions for different users

### ✅ **Scalability Features**
- **Multi-User Support**: Multiple traders can use the same platform
- **Data Archiving**: Automatic cleanup of old data
- **Performance Optimization**: Indexed queries for fast data retrieval
- **Backup & Recovery**: Built-in data persistence and recovery

## 📊 Database Schema

### Core Collections

1. **Users** - User accounts and preferences
2. **ConnectedAccounts** - Master accounts (view-only)
3. **AgentAccounts** - Trading accounts (with encrypted private keys)
4. **Positions** - Current and historical positions
5. **TradeHistory** - Complete trading history
6. **OpenOrders** - Active orders
7. **BasketOrders** - Complex basket order configurations
8. **TradingSession** - Trading session analytics
9. **MarketData** - Historical market price data

## 🎯 Key Features

### 📈 **Trading Analytics Dashboard**

```typescript
// Get comprehensive trading statistics
const stats = await tradingDataService.getTradingStatistics(userId, accountId, 30);

console.log(`📊 Trading Performance (Last 30 days):
  Total Trades: ${stats.totalTrades}
  Win Rate: ${stats.winRate.toFixed(2)}%
  Total P&L: $${stats.totalPnl.toFixed(2)}
  Profit Factor: ${stats.profitFactor.toFixed(2)}
  Total Volume: $${stats.totalVolume.toFixed(2)}
`);
```

### 🔒 **Secure Account Management**

```typescript
// Save connected account (master account - view only)
await enhancedMarketDataService.saveConnectedAccount({
  accountId: 1,
  accountName: "Main Trading Account",
  publicKey: "0x...",
  balance: "10000.00",
  pnl: "+1250.75",
  pair: "BTC/USDT",
  openOrdersCount: 3,
  connectionStatus: "connected"
});

// Save agent account (trading account - encrypted private key)
await tradingDataService.saveAgentAccount({
  accountId: 1,
  accountName: "Trading Bot",
  publicKey: "0x...",
  privateKey: "0x...", // Automatically encrypted
  isActive: true,
  connectionStatus: "connected"
});
```

### 📊 **Historical Data Analysis**

```typescript
// Get historical market data
const btcHistory = await enhancedMarketDataService.getHistoricalPrices('BTC', 24);

// Analyze price trends
const priceChanges = btcHistory.map((data, index, array) => {
  if (index === 0) return 0;
  return ((data.price - array[index - 1].price) / array[index - 1].price) * 100;
});

console.log('📈 BTC Price Volatility Analysis:', {
  averageChange: priceChanges.reduce((a, b) => a + b, 0) / priceChanges.length,
  maxIncrease: Math.max(...priceChanges),
  maxDecrease: Math.min(...priceChanges)
});
```

### 🎯 **Basket Order Persistence**

```typescript
// Save complex basket order configuration
const basketOrder = await tradingDataService.saveBasketOrder({
  id: 'basket_' + Date.now(),
  name: 'BTC Scalping Strategy',
  symbol: 'BTC',
  side: 'buy',
  entryOrder: {
    type: 'limit',
    quantity: 0.1,
    price: 95000,
    executed: false
  },
  stopLoss: {
    enabled: true,
    price: 93000,
    executed: false
  },
  takeProfit: {
    enabled: true,
    targets: [
      { price: 97000, quantity: 0.05, executed: false },
      { price: 99000, quantity: 0.05, executed: false }
    ]
  },
  limitChaser: {
    enabled: true,
    config: {
      priceOffset: 10,
      updateInterval: 5000,
      maxUpdates: 100
    }
  },
  status: 'active'
});
```

## 🔧 Implementation Steps

### Step 1: Update Your Trading Context

Add MongoDB integration to your existing TradingContext:

```typescript
// In TradingContext.tsx
import { enhancedMarketDataService } from '../services/enhancedMarketDataService';

// Initialize with user ID when user connects
useEffect(() => {
  if (connectedAccount) {
    enhancedMarketDataService.setUserId(getCurrentUserId());
    // Start storing data automatically
    enhancedMarketDataService.saveConnectedAccount(connectedAccount);
  }
}, [connectedAccount]);
```

### Step 2: Enhanced Data Fetching

Replace your existing data fetching with MongoDB-enhanced versions:

```typescript
// Replace this:
const refreshTradeHistory = useCallback(async () => {
  const history = await marketDataService.fetchTradeHistory(publicKey, 200);
  setTradeHistory(history);
}, []);

// With this:
const refreshTradeHistory = useCallback(async () => {
  const history = await enhancedMarketDataService.fetchAndStoreTradeHistory(connectedAccount, 200);
  setTradeHistory(history);
}, []);
```

### Step 3: Add Analytics to Your UI

Create new components to display MongoDB-powered analytics:

```typescript
// TradingStatsWidget.tsx
const TradingStatsWidget = () => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const loadStats = async () => {
      const data = await tradingDataService.getTradingStatistics(userId, accountId, 30);
      setStats(data);
    };
    loadStats();
  }, []);

  return (
    <div className="trading-stats">
      <h3>📊 Trading Performance (30 days)</h3>
      <div className="stats-grid">
        <div>Win Rate: {stats?.winRate?.toFixed(2)}%</div>
        <div>Total P&L: ${stats?.totalPnl?.toFixed(2)}</div>
        <div>Trades: {stats?.totalTrades}</div>
        <div>Volume: ${stats?.totalVolume?.toFixed(2)}</div>
      </div>
    </div>
  );
};
```

## 📱 Usage Examples

### Creating a User Account

```typescript
import { createUserAccount } from './utils/databaseInit';

// Create new user
const success = await createUserAccount({
  userId: 'trader_123',
  email: 'trader@example.com',
  username: 'crypto_trader',
  password: 'secure_password'
});
```

### Tracking Trading Sessions

```typescript
// Start trading session
const sessionId = await enhancedMarketDataService.startTradingSession(accountId);

// Trade for a while...

// End session with final statistics
await enhancedMarketDataService.endTradingSession(sessionId, {
  totalTrades: 15,
  winningTrades: 10,
  losingTrades: 5,
  totalPnl: 1250.75,
  totalVolume: 50000,
  winRate: 66.67
});
```

### Retrieving Historical Data

```typescript
// Get stored account data
const accounts = await enhancedMarketDataService.getStoredConnectedAccounts();

// Get historical trade performance
const tradeStats = await enhancedMarketDataService.getHistoricalTrades(accountId, 7); // Last 7 days

// Get price history for analysis
const priceHistory = await enhancedMarketDataService.getHistoricalPrices('BTC', 24); // Last 24 hours
```

## 🛡️ Security Features

### 🔐 **Encrypted Private Key Storage**
- Private keys are automatically encrypted using AES-256 before storage
- Decryption only happens in memory when needed for trading
- Separate encryption key management

### 👤 **User Authentication**
- Secure user accounts with hashed passwords
- Session management for multi-user environments
- Role-based access control

### 📝 **Audit Trail**
- Complete history of all trading activities
- Immutable trade records for compliance
- Detailed execution logs for basket orders

## 🔧 Maintenance

### Automated Data Cleanup

The system automatically cleans up old data:

```typescript
// Runs daily to clean up data older than configured retention period
setInterval(async () => {
  await tradingDataService.cleanupOldData(90); // Keep 90 days
}, 24 * 60 * 60 * 1000);
```

### Database Health Monitoring

```typescript
// Check database health
const health = await checkDatabaseHealth();
console.log('Database Status:', health.status);
```

## 🚀 Next Steps

1. **Install the dependencies** using the provided script
2. **Set up your MongoDB instance** (local or MongoDB Atlas)
3. **Configure environment variables** in the `.env` file
4. **Initialize the database** in your application startup
5. **Start using enhanced features** in your trading components

## 📞 Support

The MongoDB integration maintains backward compatibility with your existing HyperLiquid trading functionality while adding powerful new features for data persistence, analytics, and multi-user support.

All your existing trading features continue to work exactly as before, but now with the added benefit of comprehensive data storage and analysis capabilities!
