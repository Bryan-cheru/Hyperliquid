# 🔥 Advanced Basket Order Test Guide
## Complete Setup for Trigger Stop Loss + Limit Chaser

This guide will walk you through creating and testing a sophisticated basket order that combines:
- **Entry Order** (Limit or Market)
- **Trigger Stop Loss** (Based on candle close at specific timeframe)
- **Limit Chaser** (Fill-or-Cancel with distance tracking)
- **Automatic Position Management**

---

## 📋 **Test Scenario Overview**

### **Example Trade Setup: BTC Long Position**
```
Symbol: BTC-USD
Side: BUY (Long)
Entry: Limit Order at $95,000
Quantity: 0.01 BTC
Leverage: 10x

Stop Loss Trigger: $93,000 (when 15m candle closes below)
Limit Chaser: 0.01% distance, Fill-or-Cancel, max 10 chases
Take Profit: $98,000 (partial close 50%)
```

---

## 🚀 **Step-by-Step Test Instructions**

### **Phase 1: Setup & Account Connection**

1. **Connect Agent Account**
   - Open Account Management
   - Add agent wallet address and private key
   - Verify "Connected" status with red border
   - Ensure account shows real balance and PnL

2. **Verify Market Data**
   - Check that BTC price is loading correctly
   - Confirm trading pairs are populated dynamically
   - Monitor console for market data refresh logs

### **Phase 2: Create Advanced Basket Order**

1. **Open Basket Orders Tab**
   - Go to Trading Controls → Basket Orders
   - Click "Create Basket" tab
   - Enable the basket order checkbox

2. **Configure Entry Order**
   ```
   Name: "BTC Long Test"
   Symbol: BTC-USD
   Side: BUY
   Order Type: LIMIT
   Quantity: 0.01
   Entry Price: $95,000 (or current market - 1%)
   Leverage: 10x
   ```

3. **Configure Stop Loss with Trigger**
   ```
   ✅ Enable Stop Loss
   Trigger Price: $93,000
   Order Type: LIMIT
   Timeframe: 15m
   ✅ Candle Close Confirmation
   ```

4. **Configure Limit Chaser**
   ```
   ✅ Enable Limit Chaser
   Distance: 0.01
   Distance Type: PERCENTAGE
   ✅ Fill or Cancel (IOC)
   Update Interval: 30 seconds
   Max Chases: 10
   ```

5. **Configure Take Profit**
   ```
   Take Profit Price: $98,000
   Quantity: 50% (partial close)
   ```

### **Phase 3: Execute and Monitor**

1. **Create the Basket**
   - Click "Create Basket Order"
   - Verify basket appears in "Manage Baskets" tab
   - Check console logs for creation confirmation

2. **Monitor Entry Execution**
   - Watch for entry order to fill
   - Check account balance/PnL updates
   - Verify position appears in account data

3. **Test Stop Loss Trigger Logic**
   - Monitor 15-minute candles for BTC
   - If price drops toward $93,000, watch for:
     - Candle close detection
     - Stop loss trigger activation
     - Position closure execution
     - Stop loss order cancellation

4. **Test Limit Chaser Behavior**
   - If using limit entry, watch chaser updates
   - Monitor chase count incrementing
   - Check for Fill-or-Cancel behavior
   - Verify maximum chase limit

---

## 🔍 **Console Monitoring Commands**

### **Key Logs to Watch For:**

```javascript
// Basket Creation
"✅ Basket created: basket_123456789"
"🔍 Starting market monitoring for BTC-USD on 15m timeframe"

// Entry Order
"🚀 Executing entry order for BTC-USD"
"✅ Entry order filled: 0.01 BTC at $95,000"

// Limit Chaser
"🏃‍♂️ Limit chaser updating order: distance 0.01%, current price $95,050"
"📊 Chase count: 3/10"
"⏰ Limit chaser IOC order placed"

// Stop Loss Trigger
"📈 Monitoring 15m candle for BTC-USD: close $92,950 vs trigger $93,000"
"🚨 Stop loss triggered! Candle closed below $93,000"
"🔄 Closing position and cancelling stop loss order"
"✅ Position closed via stop loss trigger"

// Take Profit
"🎯 Take profit triggered at $98,000"
"📊 Closing 50% of position"
```

---

## ⚙️ **Advanced Configuration Options**

### **Timeframe-Based Triggers**
- `1m` - Ultra-fast scalping
- `5m` - Short-term moves
- `15m` - **Recommended for testing**
- `1h` - Swing trading
- `4h` - Position trading
- `1d` - Long-term holds

### **Distance Types for Limit Chaser**
- **Percentage**: `0.01%` = 1 basis point
- **Absolute**: `$10` = Fixed dollar amount

### **Fill-or-Cancel Behavior**
- **Enabled**: Orders cancel if not immediately filled
- **Disabled**: Orders remain as resting limit orders

---

## 🧪 **Test Scenarios to Try**

### **Scenario A: Quick Scalp (1m timeframe)**
```
Entry: Market order
Stop: 0.5% below entry
Timeframe: 1m
Chaser: 0.005% distance, 5 max chases
Take Profit: 1% above entry
```

### **Scenario B: Swing Trade (1h timeframe)**
```
Entry: Limit order 0.1% below market
Stop: 2% below entry
Timeframe: 1h
Chaser: 0.02% distance, 20 max chases
Take Profit: 5% above entry
```

### **Scenario C: Break-even Trail**
```
Entry: Market order
Stop: At entry price (break-even)
Timeframe: 15m
Chaser: Disabled
Take Profit: 3% above entry
```

---

## 📊 **Success Metrics**

### **Entry Execution**
- ✅ Order placed successfully
- ✅ Fill confirmation received
- ✅ Position shows in account
- ✅ Balance/PnL updates correctly

### **Stop Loss Functionality**
- ✅ Candle monitoring active
- ✅ Trigger price detection works
- ✅ Position closes when triggered
- ✅ Orders cancelled properly

### **Limit Chaser Performance**
- ✅ Order updates at intervals
- ✅ Distance maintained correctly
- ✅ Chase count tracked accurately
- ✅ Max chases respected

### **Overall Basket Management**
- ✅ Status updates reflect reality
- ✅ Execution logs are detailed
- ✅ Error handling works properly
- ✅ Clean cancellation possible

---

## 🚨 **Troubleshooting Common Issues**

### **"No positions found" Error**
- Check agent account is properly connected
- Verify you're checking the correct wallet address
- Ensure positions exist on HyperLiquid interface

### **Stop Loss Not Triggering**
- Verify candle data is being fetched
- Check timeframe matches your selection
- Ensure trigger price is realistic

### **Limit Chaser Not Updating**
- Check market volatility (price needs to move)
- Verify update interval settings
- Monitor chase count vs max chases

### **Order Signature Errors**
- Confirm private key is correct
- Check wallet has sufficient balance
- Verify network connectivity

---

## 🎯 **Next Steps After Testing**

1. **Fine-tune Parameters**
   - Adjust distances based on market volatility
   - Optimize timeframes for your strategy
   - Calibrate chase limits

2. **Add Advanced Features**
   - Multiple take profit levels
   - Trailing stop loss
   - Dynamic distance adjustment
   - Risk management rules

3. **Production Deployment**
   - Test with small positions first
   - Monitor performance metrics
   - Implement position sizing rules
   - Add comprehensive logging

---

**🔥 Ready to test? Follow this guide step-by-step and monitor the console logs for detailed execution information!**
