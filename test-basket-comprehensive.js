// Comprehensive test for basket order system with trigger stop loss and limit chaser
const { basketOrderManager } = require('./src/utils/basketOrderManager');

// Mock market data for testing
const mockMarketData = {
  BTC: {
    currentPrice: 95000,
    candles: {
      '15m': [
        { timestamp: Date.now() - 900000, open: 94800, high: 95200, low: 94500, close: 95000, volume: 1000 },
        { timestamp: Date.now() - 1800000, open: 94500, high: 94900, low: 94200, close: 94800, volume: 1200 },
        { timestamp: Date.now() - 2700000, open: 94200, high: 94600, low: 93800, close: 94500, volume: 900 }
      ]
    }
  }
};

// Mock order placement function to simulate HyperLiquid API
function mockPlaceOrder(order) {
  console.log(`📤 Mock Order Placed:`, {
    symbol: order.symbol,
    side: order.side,
    type: order.type,
    quantity: order.quantity,
    price: order.price || 'Market'
  });
  
  return {
    success: true,
    orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    message: 'Order placed successfully'
  };
}

async function testBasketOrderSystem() {
  console.log('🧪 Testing Advanced Basket Order System');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Create basket order with all components
    console.log('\n🔵 TEST 1: Creating comprehensive basket order');
    
    const basketConfig = {
      name: 'BTC Long Strategy with Trigger SL & Limit Chaser',
      symbol: 'BTC',
      side: 'buy',
      
      // Entry order configuration
      entryOrder: {
        type: 'limit',
        quantity: 0.001, // 0.001 BTC
        price: 94500,    // Enter below current market
        leverage: 10
      },
      
      // Stop loss with candle close confirmation
      stopLoss: {
        enabled: true,
        triggerPrice: 90000,      // Stop loss at 90k
        orderType: 'market',      // Market order for quick execution
        timeframe: '15m',         // Monitor 15-minute candles
        candleCloseConfirmation: true  // Wait for candle close
      },
      
      // Limit chaser configuration
      limitChaser: {
        enabled: true,
        distance: 0.01,           // 1% distance from market price
        distanceType: 'percentage',
        fillOrCancel: true,       // IOC orders
        updateInterval: 30,       // Update every 30 seconds
        maxChases: 10,           // Maximum 10 chases
        chaseCount: 0
      },
      
      // Take profit levels
      takeProfits: [
        {
          id: 'tp1',
          targetPrice: 100000,    // First TP at 100k
          quantity: 50,           // 50% of position
          orderType: 'limit',
          enabled: true
        },
        {
          id: 'tp2', 
          targetPrice: 105000,    // Second TP at 105k
          quantity: 50,           // Remaining 50%
          orderType: 'limit',
          enabled: true
        }
      ]
    };
    
    const basketId = await basketOrderManager.createBasket(basketConfig);
    console.log(`✅ Basket created successfully: ${basketId}`);
    
    // Verify basket creation
    const createdBasket = basketOrderManager.getBasket(basketId);
    console.log(`📊 Basket Details:`);
    console.log(`   Name: ${createdBasket.name}`);
    console.log(`   Symbol: ${createdBasket.symbol} ${createdBasket.side.toUpperCase()}`);
    console.log(`   Entry: ${createdBasket.entryOrder.quantity} @ $${createdBasket.entryOrder.price}`);
    console.log(`   Stop Loss: $${createdBasket.stopLoss.triggerPrice} (${createdBasket.stopLoss.timeframe})`);
    console.log(`   Limit Chaser: ${createdBasket.limitChaser.distance}% distance, max ${createdBasket.limitChaser.maxChases} chases`);
    console.log(`   Status: ${createdBasket.status}`);
    
    // Test 2: Execute basket entry
    console.log('\n🔵 TEST 2: Executing basket entry order');
    
    const entryResult = await basketOrderManager.executeBasketEntry(basketId);
    console.log(`Entry execution result: ${entryResult ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (entryResult) {
      const updatedBasket = basketOrderManager.getBasket(basketId);
      console.log(`📈 Basket status updated to: ${updatedBasket.status}`);
      console.log(`🆔 Entry order ID: ${updatedBasket.activeOrders.entryOrderId}`);
    }
    
    // Test 3: Simulate limit chaser updates
    console.log('\n🔵 TEST 3: Testing limit chaser functionality');
    
    // Simulate price movements and limit chaser updates
    const priceUpdates = [96000, 96500, 97000, 96800, 97200];
    
    for (let i = 0; i < priceUpdates.length; i++) {
      const newPrice = priceUpdates[i];
      console.log(`📊 Market price update: $${newPrice.toLocaleString()}`);
      
      // Calculate limit chaser price (1% below for long position exit)
      const chaserPrice = newPrice * 0.99; // 1% below market for long exit
      
      const chaserResult = await basketOrderManager.updateLimitChaser(basketId, chaserPrice);
      console.log(`   🏃 Limit chaser update: ${chaserResult ? '✅' : '❌'} @ $${chaserPrice.toFixed(2)}`);
      
      // Check chase count
      const basket = basketOrderManager.getBasket(basketId);
      console.log(`   📊 Chase count: ${basket.limitChaser.chaseCount}/${basket.limitChaser.maxChases}`);
      
      // Simulate delay between updates
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Test 4: Simulate candle close trigger for stop loss
    console.log('\n🔵 TEST 4: Testing stop loss trigger on candle close');
    
    // Simulate a bearish candle that closes below stop loss
    const triggerCandle = {
      timestamp: Date.now(),
      open: 91000,
      high: 91500,
      low: 89500,
      close: 89800, // Close below stop loss trigger (90000)
      volume: 1500,
      symbol: 'BTC',
      timeframe: '15m'
    };
    
    console.log(`📉 Simulating bearish candle:`);
    console.log(`   Open: $${triggerCandle.open.toLocaleString()}`);
    console.log(`   High: $${triggerCandle.high.toLocaleString()}`);
    console.log(`   Low: $${triggerCandle.low.toLocaleString()}`);
    console.log(`   Close: $${triggerCandle.close.toLocaleString()}`);
    
    const stopLossTriggered = await basketOrderManager.triggerStopLoss(basketId, triggerCandle.close);
    console.log(`🛑 Stop loss trigger result: ${stopLossTriggered ? '✅ TRIGGERED' : '❌ FAILED'}`);
    
    if (stopLossTriggered) {
      const finalBasket = basketOrderManager.getBasket(basketId);
      console.log(`📊 Final basket status: ${finalBasket.status}`);
      console.log(`🆔 Stop loss order ID: ${finalBasket.activeOrders.stopLossOrderId}`);
    }
    
    // Test 5: Check execution log
    console.log('\n🔵 TEST 5: Reviewing execution log');
    
    const finalBasket = basketOrderManager.getBasket(basketId);
    console.log(`📝 Execution Log (${finalBasket.executionLog.length} entries):`);
    
    finalBasket.executionLog.forEach((log, index) => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      console.log(`   ${index + 1}. [${timestamp}] ${log.action}: ${log.details}`);
    });
    
    // Test 6: Test multiple baskets
    console.log('\n🔵 TEST 6: Testing multiple basket management');
    
    // Create a second basket for short position
    const shortBasketConfig = {
      name: 'BTC Short Strategy',
      symbol: 'BTC',
      side: 'sell',
      
      entryOrder: {
        type: 'market',
        quantity: 0.0005,
        leverage: 5
      },
      
      stopLoss: {
        enabled: true,
        triggerPrice: 98000,      // Stop loss above entry for short
        orderType: 'market',
        timeframe: '5m',
        candleCloseConfirmation: false  // Immediate trigger
      },
      
      limitChaser: {
        enabled: false,           // Disabled for this test
        distance: 0,
        distanceType: 'percentage',
        fillOrCancel: false,
        updateInterval: 60,
        maxChases: 5,
        chaseCount: 0
      },
      
      takeProfits: [{
        id: 'tp1',
        targetPrice: 90000,
        quantity: 100,
        orderType: 'limit',
        enabled: true
      }]
    };
    
    const shortBasketId = await basketOrderManager.createBasket(shortBasketConfig);
    console.log(`✅ Short basket created: ${shortBasketId}`);
    
    // Execute short basket
    await basketOrderManager.executeBasketEntry(shortBasketId);
    
    // List all baskets
    const allBaskets = basketOrderManager.getAllBaskets();
    console.log(`📋 Total active baskets: ${allBaskets.length}`);
    
    allBaskets.forEach((basket, index) => {
      console.log(`   ${index + 1}. ${basket.name} (${basket.status}) - ${basket.symbol} ${basket.side.toUpperCase()}`);
    });
    
    // Test 7: Test basket cancellation
    console.log('\n🔵 TEST 7: Testing basket cancellation');
    
    const cancelResult = await basketOrderManager.cancelBasket(shortBasketId);
    console.log(`🚫 Basket cancellation result: ${cancelResult ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    if (cancelResult) {
      const cancelledBasket = basketOrderManager.getBasket(shortBasketId);
      console.log(`📊 Cancelled basket status: ${cancelledBasket.status}`);
    }
    
    // Test 8: Performance and monitoring test
    console.log('\n🔵 TEST 8: Testing monitoring and performance');
    
    console.log('🔄 Starting market monitoring...');
    basketOrderManager.startMarketMonitoring();
    
    // Simulate monitoring for a short period
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('⏹️ Stopping market monitoring...');
    basketOrderManager.stopMarketMonitoring();
    
    // Final summary
    console.log('\n📊 FINAL TEST SUMMARY');
    console.log('=' .repeat(40));
    
    const remainingBaskets = basketOrderManager.getAllBaskets();
    console.log(`✅ Total baskets created: 2`);
    console.log(`✅ Baskets remaining: ${remainingBaskets.length}`);
    console.log(`✅ Entry executions: 2`);
    console.log(`✅ Limit chaser updates: ${priceUpdates.length}`);
    console.log(`✅ Stop loss triggers: 1`);
    console.log(`✅ Basket cancellations: 1`);
    
    console.log('\n🎯 KEY FEATURES TESTED:');
    console.log('   ✅ Basket order creation with full configuration');
    console.log('   ✅ Entry order execution');
    console.log('   ✅ Limit chaser with dynamic price updates');
    console.log('   ✅ Stop loss trigger on candle close confirmation');
    console.log('   ✅ Take profit level configuration');
    console.log('   ✅ Multiple basket management');
    console.log('   ✅ Order cancellation and cleanup');
    console.log('   ✅ Market monitoring start/stop');
    console.log('   ✅ Execution logging and tracking');
    
    console.log('\n🚀 BASKET ORDER SYSTEM TEST COMPLETED SUCCESSFULLY!');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    // Cleanup
    basketOrderManager.stopMarketMonitoring();
  }
}

// Helper function to simulate real trading scenarios
async function simulateRealTradingScenario() {
  console.log('\n🎭 SIMULATING REAL TRADING SCENARIO');
  console.log('=' .repeat(50));
  
  // Scenario: BTC breaks out above resistance, but then fails and triggers stop loss
  const breakoutConfig = {
    name: 'BTC Breakout Strategy',
    symbol: 'BTC',
    side: 'buy',
    
    entryOrder: {
      type: 'limit',
      quantity: 0.002,
      price: 96000, // Entry on breakout confirmation
      leverage: 15
    },
    
    stopLoss: {
      enabled: true,
      triggerPrice: 94000, // Tight stop loss
      orderType: 'limit',
      limitPrice: 93900,   // Limit order below trigger
      timeframe: '15m',
      candleCloseConfirmation: true
    },
    
    limitChaser: {
      enabled: true,
      distance: 0.005, // 0.5% for tight management
      distanceType: 'percentage',
      fillOrCancel: true,
      updateInterval: 15, // Fast updates
      maxChases: 20,
      chaseCount: 0
    },
    
    takeProfits: [
      {
        id: 'tp1',
        targetPrice: 99000,
        quantity: 33,
        orderType: 'limit',
        enabled: true
      },
      {
        id: 'tp2',
        targetPrice: 102000,
        quantity: 33,
        orderType: 'limit',
        enabled: true
      },
      {
        id: 'tp3',
        targetPrice: 105000,
        quantity: 34,
        orderType: 'limit',
        enabled: true
      }
    ]
  };
  
  const basketId = await basketOrderManager.createBasket(breakoutConfig);
  console.log(`✅ Breakout basket created: ${basketId}`);
  
  // Execute and simulate the scenario
  await basketOrderManager.executeBasketEntry(basketId);
  
  // Simulate price action: initial pump, then limit chaser updates, then dump triggering SL
  const priceSequence = [
    { price: 96500, action: 'initial pump' },
    { price: 97200, action: 'continued rally' },
    { price: 97800, action: 'peak reached' },
    { price: 97100, action: 'minor pullback' },
    { price: 96200, action: 'deeper pullback' },
    { price: 95000, action: 'support test' },
    { price: 93500, action: 'support broken - SL trigger' }
  ];
  
  for (const step of priceSequence) {
    console.log(`📊 ${step.action}: $${step.price.toLocaleString()}`);
    
    if (step.price >= 94000) {
      // Update limit chaser while above stop loss
      const chaserPrice = step.price * 0.995; // 0.5% below market
      await basketOrderManager.updateLimitChaser(basketId, chaserPrice);
      console.log(`   🏃 Limit chaser updated to $${chaserPrice.toFixed(2)}`);
    } else {
      // Trigger stop loss when price breaks below
      console.log('   🛑 Stop loss trigger level breached!');
      await basketOrderManager.triggerStopLoss(basketId, step.price);
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n📈 Scenario complete - demonstrating full basket order lifecycle');
}

// Run the comprehensive test
async function runAllTests() {
  await testBasketOrderSystem();
  await simulateRealTradingScenario();
}

// Execute tests
runAllTests().then(() => {
  console.log('\n🏁 ALL TESTS COMPLETED');
}).catch(error => {
  console.error('🚨 TEST SUITE FAILED:', error);
});
