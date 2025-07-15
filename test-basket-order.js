// Test script for basket order functionality
const { basketOrderManager } = require('./src/utils/basketOrderManager');

async function testBasketOrder() {
  console.log('🧪 Testing Basket Order System');
  
  try {
    // Start monitoring
    basketOrderManager.startMarketMonitoring();
    
    // Create a test basket order
    const basketConfig = {
      name: 'Test BTC Long Strategy',
      symbol: 'BTC',
      side: 'buy',
      
      entryOrder: {
        type: 'limit',
        quantity: 0.001,
        price: 95000,
        leverage: 10
      },
      
      stopLoss: {
        enabled: true,
        triggerPrice: 90000,
        orderType: 'market',
        timeframe: '15m',
        candleCloseConfirmation: true
      },
      
      limitChaser: {
        enabled: true,
        distance: 0.01, // 1%
        distanceType: 'percentage',
        fillOrCancel: true,
        updateInterval: 30,
        maxChases: 10,
        chaseCount: 0
      },
      
      takeProfits: [{
        id: 'tp1',
        targetPrice: 105000,
        quantity: 50, // 50% of position
        orderType: 'limit',
        enabled: true
      }]
    };
    
    // Create basket
    const basketId = await basketOrderManager.createBasket(basketConfig);
    console.log(`✅ Created basket: ${basketId}`);
    
    // Get basket details
    const basket = basketOrderManager.getBasket(basketId);
    console.log('📊 Basket details:', {
      name: basket.name,
      symbol: basket.symbol,
      status: basket.status,
      stopLoss: basket.stopLoss.enabled ? `${basket.stopLoss.triggerPrice} (${basket.stopLoss.timeframe})` : 'Disabled',
      limitChaser: basket.limitChaser.enabled ? `${basket.limitChaser.distance}% distance` : 'Disabled'
    });
    
    // Execute entry
    console.log('🚀 Executing basket entry...');
    const executed = await basketOrderManager.executeBasketEntry(basketId);
    console.log(`Entry execution result: ${executed ? 'Success' : 'Failed'}`);
    
    // List all baskets
    const allBaskets = basketOrderManager.getAllBaskets();
    console.log(`📋 Total baskets: ${allBaskets.length}`);
    
    // Test limit chaser update
    console.log('🏃 Testing limit chaser update...');
    const chaserUpdated = await basketOrderManager.updateLimitChaser(basketId, 96000);
    console.log(`Limit chaser update result: ${chaserUpdated ? 'Success' : 'Failed'}`);
    
    // Test stop loss trigger (simulate)
    console.log('🛑 Testing stop loss trigger...');
    const stopLossTriggered = await basketOrderManager.triggerStopLoss(basketId, 89000);
    console.log(`Stop loss trigger result: ${stopLossTriggered ? 'Success' : 'Failed'}`);
    
    // Final basket status
    const finalBasket = basketOrderManager.getBasket(basketId);
    console.log('📈 Final basket status:', finalBasket.status);
    console.log('📝 Execution log:', finalBasket.executionLog.map(log => `${new Date(log.timestamp).toLocaleTimeString()}: ${log.details}`));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    basketOrderManager.stopMarketMonitoring();
  }
}

// Run test
testBasketOrder();
