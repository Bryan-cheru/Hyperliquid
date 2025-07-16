# 🎯 **LIVE BASKET ORDER TEST SCENARIO**
## Complete Guide: Trigger Stop Loss + Limit Chaser

This is your **LIVE TRADING TEST** guide for the advanced basket order with:
- ✅ **Trigger Stop Loss** (Candle close confirmation)
- ✅ **Limit Chaser** (Fill-or-Cancel with 0.01 distance)
- ✅ **Real Position Management**

---

## 🔥 **EXACT TEST SCENARIO**

### **Trade Configuration**
```
Symbol: BTC-USD
Direction: BUY (Long Position)
Entry: Limit Order at $95,000
Quantity: 0.001 BTC
Leverage: 10x

STOP LOSS TRIGGER:
- Trigger Price: $93,000
- Timeframe: 15m candles
- Condition: When 15m candle CLOSES below $93,000
- Action: Cancel all, place limit chaser

LIMIT CHASER:
- Distance: 0.01 (1%) from current market price
- Type: Fill-or-Cancel (IOC)
- Max Chases: 10
- Update Interval: 30 seconds
- Goal: Close position quickly with slippage protection
```

---

## 🚀 **STEP-BY-STEP TEST EXECUTION**

### **PHASE 1: Pre-Flight Check**

1. **Verify Account Setup**
   ```
   ✅ Agent account connected (red border, "Connected" status)
   ✅ Real balance showing (not "N/A")
   ✅ BTC price updating live
   ✅ Console shows market data refresh logs
   ```

2. **Open Developer Console** (F12)
   - Monitor logs for:
     - `🔄 Refreshing market data...`
     - `📊 Market price for BTC: $X`
     - `🎯 Basket monitoring active`

---

### **PHASE 2: Create the Basket Order**

1. **Open Basket Orders Tab**
   - Go to Trading Controls → Basket Orders
   - Click "Create Basket" tab

2. **Configure Entry Order**
   ```
   Name: "BTC Test Stop Loss + Chaser"
   Symbol: BTC
   Side: BUY
   Order Type: LIMIT
   Quantity: 0.001
   Entry Price: $95,000 (or current price + $500)
   Leverage: 10x
   ```

3. **Configure Stop Loss (CRITICAL)**
   ```
   ✅ Enable Stop Loss: ON
   Trigger Price: $93,000 (or current price - $2,000)
   Order Type: LIMIT
   Timeframe: 15m
   ✅ Candle Close Confirmation: ON
   ```

4. **Configure Limit Chaser (CRITICAL)**
   ```
   ✅ Enable Limit Chaser: ON
   Distance: 0.01 (1%)
   Distance Type: Percentage
   ✅ Fill or Cancel (IOC): ON
   Update Interval: 30 seconds
   Max Chases: 10
   ```

5. **Click "Create Basket"**
   - Watch console for: `🎯 Basket created: BTC Test Stop Loss + Chaser`

---

### **PHASE 3: Monitor the Live Test**

1. **Check Active Baskets**
   - Switch to "Manage Baskets" tab
   - Verify your basket shows status: "pending" or "active"
   - Note the basket ID in console logs

2. **Trigger the Entry** (if using limit order)
   - Wait for BTC price to hit your entry price
   - OR manually adjust entry price to current market price
   - Watch for entry order execution

3. **Monitor Stop Loss Trigger**
   - Watch BTC 15m candles on external chart (TradingView)
   - Look for console logs:
     ```
     🕯️ Checking BTC 15m candle close at $X
     🔥 Stop loss triggered! Candle closed below $93,000
     ⚡ Starting limit chaser execution...
     ```

---

### **PHASE 4: Test the Limit Chaser Action**

1. **When Stop Loss Triggers:**
   ```
   Expected Console Logs:
   ✅ "🔥 Stop loss triggered for basket_XXX"
   ✅ "❌ Cancelling stop loss order: order_XXX"
   ✅ "⚡ Placing limit chaser at $XXX (1% from market)"
   ✅ "🎯 Limit chaser order placed: order_XXX"
   ```

2. **Monitor Limit Chaser Behavior:**
   - Every 30 seconds, it should update price
   - If order doesn't fill (IOC), it places a new one
   - Price adjusts 1% from current market price
   - Max 10 attempts before giving up

3. **Expected Final State:**
   ```
   ✅ Original stop loss order: CANCELLED
   ✅ Position: CLOSED (via limit chaser)
   ✅ Basket status: "completed"
   ✅ Console shows: "🎉 Basket execution completed"
   ```

---

### **PHASE 5: Verify Results**

1. **Check Account Status**
   - Verify balance updated correctly
   - Check PnL reflects the trade
   - Confirm no open positions remain

2. **Review Execution Log**
   - In "Manage Baskets" tab, click your basket
   - Review the execution timeline
   - Verify all steps completed correctly

---

## 🎛️ **TESTING VARIATIONS**

### **Quick Test (Paper Trading)**
```
Entry: Market order (immediate execution)
Stop Loss Trigger: $1 below current price
Watch for immediate trigger and chaser action
```

### **Stress Test**
```
Create multiple baskets simultaneously
Different timeframes (1m, 5m, 15m)
Test max chase limits
```

---

## 🔧 **TROUBLESHOOTING**

### **If Stop Loss Doesn't Trigger:**
1. Check console for candle data: `🕯️ Fetching BTC 15m candles...`
2. Verify timeframe monitoring is active
3. Ensure trigger price is realistic

### **If Limit Chaser Fails:**
1. Check IOC order status in console
2. Verify market liquidity
3. Adjust distance if too aggressive

### **If Orders Don't Execute:**
1. Verify agent account has sufficient balance
2. Check asset index mapping in console
3. Review signature verification logs

---

## 🎯 **SUCCESS CRITERIA**

✅ **Stop loss triggers exactly when 15m candle closes below trigger price**  
✅ **Limit chaser places IOC orders with 1% distance from market**  
✅ **Position closes successfully via limit chaser**  
✅ **All original orders are cancelled**  
✅ **Account balance updates correctly**  
✅ **No errors in console logs**

---

## 🚨 **SAFETY NOTES**

- **Start with small quantities (0.001 BTC)**
- **Use testnet if available**
- **Monitor console logs closely**
- **Have manual stop-loss ready**
- **Test during active market hours**

---

**Ready to run the test? Follow the steps exactly and watch the magic happen! 🚀**
