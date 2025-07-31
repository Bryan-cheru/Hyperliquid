# SHORT BUTTON TROUBLESHOOTING GUIDE

## 🚨 Issue: Error when clicking SHORT button

### 📋 Step-by-Step Diagnosis

#### **Step 1: Check Account Setup**
1. **Open your app** at http://localhost:5175
2. **Look at the account status** in the ButtonWrapper area
3. **You should see two things:**
   - 🔵 **Master**: [Account Name] (Data Source) 
   - 🟢 **Agent**: [Account Name] (Trading Ready)

**❌ If you see "No Agent Account (Trading Disabled)":**
- You need to add an agent account first
- Go to account management and connect an agent account with private key

#### **Step 2: Open Browser Console**
1. **Press F12** (or right-click → Inspect)
2. **Click on "Console" tab**
3. **Clear the console** (click the clear button)
4. **Click the SHORT button**
5. **Look for error messages**

#### **Step 3: Check Debug Information**
After clicking SHORT, you should see debug info like:
```
🚨 SHORT BUTTON CLICKED - DEBUGGING:
=================================
1️⃣ Agent Account: ✓ Present
   - Account Name: Account 1
   - Private Key: ✓ Present
   - Connection Status: connected
2️⃣ Connected Account: ✓ Present
   - Trading Pair: BTC/USDT
3️⃣ Trading Parameters: ✓ Present
   - Order Type: Market
   - Leverage: 10
   - Position Size: 10
```

### 🔍 Common Issues & Solutions

#### **Issue 1: "Please add an agent account first"**
**Solution:** 
1. Click "Manage Accounts" or account settings
2. Add an agent account with both public and private key
3. Make sure it shows "Trading Ready"

#### **Issue 2: "Please connect a master account first"**
**Solution:**
1. Connect a master account (can be view-only, just public key)
2. This provides market data for trading

#### **Issue 3: Console shows network errors**
**Symptoms:** Errors like "fetch failed" or "400/500 status codes"
**Solutions:**
- Check internet connection
- Verify HyperLiquid API is accessible
- Check if your private key is correct
- Make sure you have trading permissions

#### **Issue 4: "Insufficient funds" or margin errors**
**Solutions:**
- Check your account balance
- Reduce position size
- Make sure you have enough margin for the trade

#### **Issue 5: Private key or signature errors**
**Symptoms:** "Signature verification failed" or "Invalid private key"
**Solutions:**
- Double-check your private key is correct
- Make sure it matches your public address
- Try disconnecting and reconnecting the agent account

### 📞 What to Report

**If the issue persists, please share:**

1. **Console output** - Copy the debug information that appears when you click SHORT
2. **Error messages** - Any red error messages in the console
3. **Account status** - What you see for Master/Agent account status
4. **Steps taken** - What you were doing when the error occurred

### 🔧 Quick Fixes to Try

1. **Refresh the browser** (Ctrl+F5)
2. **Disconnect and reconnect accounts**
3. **Try a smaller position size** (1-5% instead of higher values)
4. **Check if LONG button works** (to isolate if it's SHORT-specific)
5. **Clear browser cache and reload**

### 🎯 Expected Behavior

**When SHORT works correctly:**
1. Click SHORT button
2. See debug info in console
3. See "Executing SELL order..." in console
4. Get success/failure message
5. If successful, order appears in your HyperLiquid account

---

**Note:** The debug logging has been added temporarily to help diagnose the issue. Once we fix it, we can remove the extra console output.
