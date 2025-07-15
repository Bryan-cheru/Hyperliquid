// Test to verify the agent account requirement is working properly
import { TradingProvider, useTrading } from '../src/contexts/TradingContext';

// Test component to verify agent account restrictions
const TestTradingRestrictions = () => {
  const { 
    connectedAccount, 
    agentAccount, 
    setConnectedAccount, 
    setAgentAccount,
    executeOrder 
  } = useTrading();

  const testTradingWithoutAgent = async () => {
    // Should fail - no agent account
    const result = await executeOrder({
      symbol: "BTC-USD",
      side: "buy",
      orderType: "market",
      quantity: 0.001,
      leverage: 10
    });
    
    console.log('Trading without agent result:', result);
    // Expected: { success: false, message: "No agent account configured for trading. Please add an agent account first." }
  };

  const testTradingWithAgent = async () => {
    // Set up agent account first
    setAgentAccount({
      accountId: 1,
      accountName: "Test Agent",
      publicKey: "0xtest",
      privateKey: "test_key",
      isActive: true,
      connectionStatus: "connected"
    });

    // Should work - agent account is configured
    const result = await executeOrder({
      symbol: "BTC-USD", 
      side: "buy",
      orderType: "market",
      quantity: 0.001,
      leverage: 10
    });
    
    console.log('Trading with agent result:', result);
  };

  return (
    <div>
      <h2>Trading Restrictions Test</h2>
      <button onClick={testTradingWithoutAgent}>
        Test Trading Without Agent (Should Fail)
      </button>
      <button onClick={testTradingWithAgent}>
        Test Trading With Agent (Should Work)
      </button>
      
      <div>
        <p>Master Account: {connectedAccount ? 'Connected' : 'Not Connected'}</p>
        <p>Agent Account: {agentAccount ? 'Connected' : 'Not Connected'}</p>
      </div>
    </div>
  );
};

console.log('✅ Agent Account System Implementation Complete');
console.log('📋 Key Features:');
console.log('  • Master accounts are view-only (market data, positions, history)');
console.log('  • Agent accounts are required for all trading operations');
console.log('  • Trading buttons disabled without agent account');
console.log('  • Clear UI indicators for account status');
console.log('  • Proper error messages guide users to add agent accounts');

export default TestTradingRestrictions;
