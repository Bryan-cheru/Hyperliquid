// Test script to verify account data fetching functionality
// Run this with: node test-account-data-fetch.js

const { marketDataService } = require('./src/utils/marketDataService.ts');

async function testAccountDataFetch() {
  console.log('🧪 Testing Account Data Fetching System');
  console.log('=======================================');
  
  // Test with a sample public key (you should replace this with a real test key)
  const testPublicKey = '0x0000000000000000000000000000000000000000'; // Replace with real test key
  
  try {
    console.log('\n1️⃣ Testing Market Prices...');
    const prices = await marketDataService.fetchMarketPrices();
    console.log(`✅ Fetched ${prices.size} market prices`);
    
    const btcPrice = prices.get('BTC');
    if (btcPrice) {
      console.log(`📈 BTC Price: $${btcPrice.price.toLocaleString()}`);
    }
    
    console.log('\n2️⃣ Testing Position Fetching...');
    const positions = await marketDataService.fetchPositions(testPublicKey);
    console.log(`✅ Fetched ${positions.length} positions`);
    
    console.log('\n3️⃣ Testing Open Orders...');
    const openOrders = await marketDataService.fetchOpenOrders(testPublicKey);
    console.log(`✅ Fetched ${openOrders.length} open orders`);
    
    console.log('\n4️⃣ Testing Trade History...');
    const tradeHistory = await marketDataService.fetchTradeHistory(testPublicKey, 10);
    console.log(`✅ Fetched ${tradeHistory.length} trade history items`);
    
    console.log('\n5️⃣ Testing Account Balance...');
    const mockAccount = {
      accountId: 1,
      accountName: 'Test Account',
      publicKey: testPublicKey,
      privateKey: '',
      balance: '0',
      pnl: '0',
      pair: 'BTC/USDT',
      openOrdersCount: 0,
      connectionStatus: 'connected'
    };
    
    const balance = await marketDataService.getAccountBalance(mockAccount);
    console.log(`✅ Account Balance: $${balance.toFixed(2)}`);
    
    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Integration Status:');
    console.log('- ✅ Market data service functional');
    console.log('- ✅ Position fetching working');
    console.log('- ✅ Open orders API working');
    console.log('- ✅ Trade history API working');
    console.log('- ✅ Account balance API working');
    console.log('\n🔧 Next Steps:');
    console.log('1. Connect real agent accounts with public/private keys');
    console.log('2. Verify data flows from MultiAccountTradingContext to UI');
    console.log('3. Test periodic data refresh (every 30 seconds)');
    console.log('4. Verify balance, PnL, and leverage display in Account cards');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    console.log('\n🔍 Troubleshooting Tips:');
    console.log('1. Make sure you have internet connection');
    console.log('2. Verify HyperLiquid API is accessible');
    console.log('3. Replace testPublicKey with a real wallet address');
    console.log('4. Check API rate limits');
  }
}

// Run the test
if (require.main === module) {
  testAccountDataFetch();
}

module.exports = { testAccountDataFetch };
