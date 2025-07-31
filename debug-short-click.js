// Debug script to troubleshoot SHORT button issues
// Add this to ButtonWrapper.tsx temporarily to help diagnose the problem

console.log('🔍 SHORT BUTTON DEBUG INFORMATION');
console.log('=================================');

// Debug function to add to the handleTrade function
export const debugShortClick = (agentAccount: any, connectedAccount: any, tradingParams: any) => {
  console.log('\n🚨 SHORT BUTTON CLICKED - DEBUGGING:');
  
  // Check 1: Agent Account
  console.log('\n1️⃣ AGENT ACCOUNT CHECK:');
  console.log('   Agent Account Exists:', !!agentAccount);
  if (agentAccount) {
    console.log('   Account ID:', agentAccount.accountId);
    console.log('   Account Name:', agentAccount.accountName);
    console.log('   Public Key:', agentAccount.publicKey ? '✓ Present' : '❌ Missing');
    console.log('   Private Key:', agentAccount.privateKey ? '✓ Present' : '❌ Missing');
    console.log('   Connection Status:', agentAccount.connectionStatus);
    console.log('   Is Active:', agentAccount.isActive);
  } else {
    console.log('   ❌ NO AGENT ACCOUNT - This will prevent trading!');
  }
  
  // Check 2: Connected Account (Master)
  console.log('\n2️⃣ CONNECTED ACCOUNT CHECK:');
  console.log('   Connected Account Exists:', !!connectedAccount);
  if (connectedAccount) {
    console.log('   Account Name:', connectedAccount.accountName);
    console.log('   Trading Pair:', connectedAccount.pair);
    console.log('   Public Key:', connectedAccount.publicKey ? '✓ Present' : '❌ Missing');
    console.log('   Connection Status:', connectedAccount.connectionStatus);
  } else {
    console.log('   ❌ NO CONNECTED ACCOUNT - This will limit market data!');
  }
  
  // Check 3: Trading Parameters
  console.log('\n3️⃣ TRADING PARAMETERS CHECK:');
  console.log('   Trading Params Exist:', !!tradingParams);
  if (tradingParams) {
    console.log('   Order Type:', tradingParams.orderType);
    console.log('   Leverage:', tradingParams.leverage);
    console.log('   Position Size:', tradingParams.positionSize);
    console.log('   Stop Loss:', tradingParams.stopLoss);
    console.log('   Order Split:', tradingParams.orderSplit);
    console.log('   Split Count:', tradingParams.splitCount);
  } else {
    console.log('   ⚠️ NO TRADING PARAMETERS - Using defaults');
  }
  
  // Check 4: Expected Order Details
  console.log('\n4️⃣ EXPECTED ORDER DETAILS:');
  if (connectedAccount) {
    let symbol = connectedAccount.pair;
    if (symbol.includes('/')) {
      symbol = symbol.replace('/USDT', '-USD').replace('/USDC', '-USD');
    }
    console.log('   Symbol for trading:', symbol);
    console.log('   Side: sell (SHORT)');
    console.log('   Order Type:', tradingParams?.orderType || 'Market');
    
    const baseOrderSize = 0.001;
    const sizeMultiplier = tradingParams ? Math.max(tradingParams.positionSize / 100, 0.1) : 1;
    const finalSize = baseOrderSize * sizeMultiplier;
    
    console.log('   Base Order Size:', baseOrderSize, 'BTC');
    console.log('   Size Multiplier:', sizeMultiplier);
    console.log('   Final Order Size:', finalSize, 'BTC');
    console.log('   Estimated USD Value: ~$', (finalSize * 100000).toFixed(2));
  }
  
  // Check 5: Potential Issues
  console.log('\n5️⃣ POTENTIAL ISSUES:');
  const issues = [];
  
  if (!agentAccount) {
    issues.push('❌ No agent account - Cannot execute trades');
  } else {
    if (!agentAccount.privateKey) {
      issues.push('❌ Agent account missing private key - Cannot sign transactions');
    }
    if (agentAccount.connectionStatus !== 'connected') {
      issues.push('⚠️ Agent account not properly connected');
    }
  }
  
  if (!connectedAccount) {
    issues.push('⚠️ No connected account - Limited market data access');
  }
  
  if (!tradingParams) {
    issues.push('⚠️ No trading parameters - Using defaults');
  }
  
  if (issues.length === 0) {
    console.log('   ✅ No obvious issues detected');
  } else {
    issues.forEach(issue => console.log('   ' + issue));
  }
  
  console.log('\n🔍 Next steps:');
  console.log('1. Check the network tab for API errors');
  console.log('2. Look for any error messages in the console after clicking SHORT');
  console.log('3. Verify your HyperLiquid credentials are correct');
  console.log('4. Make sure you have sufficient balance for the trade');
  
  return {
    canTrade: !!agentAccount && !!agentAccount.privateKey && agentAccount.connectionStatus === 'connected',
    issues: issues
  };
};

// Instructions for using this debug function:
// 1. Add this import to ButtonWrapper.tsx: import { debugShortClick } from './debug-short-click.js';
// 2. Add this line at the start of handleTrade function when side === "sell":
//    if (side === "sell") debugShortClick(agentAccount, connectedAccount, tradingParams);
// 3. Click the SHORT button and check the console output
// 4. Share the console output to help diagnose the issue
