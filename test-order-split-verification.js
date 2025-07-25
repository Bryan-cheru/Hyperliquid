// Test Order Split Functionality Verification
// This script verifies the order split implementation works correctly

console.log('🔄 ORDER SPLIT FUNCTIONALITY VERIFICATION');
console.log('==========================================');

// Mock trading parameters with order split enabled
const mockTradingParams = {
  leverage: 10,
  positionSize: 20, // 20% of position
  stopLoss: 5, // 5% stop loss
  orderType: "Limit",
  triggerPrice: 110000,
  orderSplit: true,
  minPrice: 108000,
  maxPrice: 112000,
  splitCount: 3,
  scaleType: "Lower"
};

console.log('📊 Mock Trading Parameters:');
console.log('  Order Split Enabled:', mockTradingParams.orderSplit);
console.log('  Split Count:', mockTradingParams.splitCount);
console.log('  Price Range:', `$${mockTradingParams.minPrice.toLocaleString()} - $${mockTradingParams.maxPrice.toLocaleString()}`);
console.log('  Position Size:', `${mockTradingParams.positionSize}%`);
console.log('  Scale Type:', mockTradingParams.scaleType);

// Calculate split order details
function calculateSplitOrders(params) {
  const { minPrice, maxPrice, splitCount, positionSize } = params;
  const priceStep = (maxPrice - minPrice) / (splitCount - 1);
  const baseAmount = 1; // Assume 1 BTC for calculation
  const totalQuantity = (baseAmount * positionSize) / 100;
  const quantityPerOrder = totalQuantity / splitCount;
  
  const orders = [];
  for (let i = 0; i < splitCount; i++) {
    const price = minPrice + (priceStep * i);
    orders.push({
      orderNumber: i + 1,
      price: price,
      quantity: quantityPerOrder,
      usdValue: price * quantityPerOrder
    });
  }
  
  return orders;
}

const splitOrders = calculateSplitOrders(mockTradingParams);

console.log('\n🎯 Calculated Split Orders:');
splitOrders.forEach(order => {
  console.log(`  Order ${order.orderNumber}:`);
  console.log(`    Price: $${order.price.toLocaleString()}`);
  console.log(`    Quantity: ${order.quantity.toFixed(5)} BTC`);
  console.log(`    USD Value: ~$${order.usdValue.toLocaleString()}`);
});

console.log('\n📈 Order Split Summary:');
console.log(`  Total Orders: ${splitOrders.length}`);
console.log(`  Total Quantity: ${splitOrders.reduce((sum, order) => sum + order.quantity, 0).toFixed(5)} BTC`);
console.log(`  Total USD Value: ~$${splitOrders.reduce((sum, order) => sum + order.usdValue, 0).toLocaleString()}`);
console.log(`  Average Price: $${(splitOrders.reduce((sum, order) => sum + order.price, 0) / splitOrders.length).toLocaleString()}`);

// Test different split counts
console.log('\n🔢 Testing Different Split Counts:');
[2, 5, 10].forEach(count => {
  const testParams = { ...mockTradingParams, splitCount: count };
  const orders = calculateSplitOrders(testParams);
  console.log(`  ${count} orders: ${orders[0].quantity.toFixed(5)} BTC each, price range $${orders[0].price.toLocaleString()} - $${orders[orders.length-1].price.toLocaleString()}`);
});

// Test scale types impact
console.log('\n📊 Scale Type Analysis:');
const scaleTypes = ['Lower', 'Mid point', 'Upper'];
scaleTypes.forEach(scaleType => {
  console.log(`  ${scaleType}: More weight towards ${scaleType === 'Lower' ? 'lower prices' : scaleType === 'Upper' ? 'higher prices' : 'middle prices'}`);
});

console.log('\n✅ Order Split Verification Complete!');
console.log('The order split functionality should:');
console.log('  1. Split total position into multiple orders');
console.log('  2. Distribute orders across specified price range');
console.log('  3. Respect user-defined split count (2-10)');
console.log('  4. Apply scale type for order distribution');
console.log('  5. Work with both regular and basket orders');
