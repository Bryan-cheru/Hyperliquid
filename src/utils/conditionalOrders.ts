// HyperLiquid Conditional Orders Implementation
// Based on official Python SDK: https://github.com/hyperliquid-dex/hyperliquid-python-sdk

export interface ConditionalOrderConfig {
  // Basic order details
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  leverage: number;
  
  // Conditional order specific
  triggerPrice: number;
  orderType: 'stop_loss' | 'take_profit' | 'trigger_limit';
  isMarket: boolean; // true for market execution when triggered, false for limit
  limitPrice?: number; // only used if isMarket is false
  reduceOnly: boolean; // typically true for stop loss/take profit
}

export interface HyperLiquidTriggerOrder {
  a: number; // asset index
  b: boolean; // isBuy
  p: string; // limit price (for the execution, not trigger)
  s: string; // size
  r: boolean; // reduceOnly
  t: {
    trigger: {
      triggerPx: string; // trigger price
      isMarket: boolean; // market or limit execution
      tpsl: 'sl' | 'tp'; // stop loss or take profit
    }
  };
}

/**
 * Creates a HyperLiquid conditional order payload
 */
export function createConditionalOrder(
  config: ConditionalOrderConfig,
  assetIndex: number
): HyperLiquidTriggerOrder {
  console.log('🎯 Creating conditional order:', config);
  
  // Determine execution price
  let executionPrice: string;
  if (config.isMarket) {
    // For market orders, use an extreme price to ensure execution
    if (config.orderType === 'stop_loss') {
      // Stop loss: sell at very low price or buy at very high price
      executionPrice = config.side === 'buy' ? '999999' : '1';
    } else {
      // Take profit: sell at very high price or buy at very low price  
      executionPrice = config.side === 'sell' ? '999999' : '1';
    }
  } else {
    // Use specified limit price for limit execution
    executionPrice = (config.limitPrice || config.triggerPrice).toString();
  }
  
  // Determine TPSL type
  let tpslType: 'sl' | 'tp';
  if (config.orderType === 'stop_loss') {
    tpslType = 'sl';
  } else if (config.orderType === 'take_profit') {
    tpslType = 'tp';
  } else {
    // For generic trigger orders, determine based on price direction
    tpslType = 'sl'; // Default to stop loss
  }
  
  const order: HyperLiquidTriggerOrder = {
    a: assetIndex,
    b: config.side === 'buy',
    p: executionPrice,
    s: config.quantity.toString(),
    r: config.reduceOnly,
    t: {
      trigger: {
        triggerPx: config.triggerPrice.toString(),
        isMarket: config.isMarket,
        tpsl: tpslType
      }
    }
  };
  
  console.log('✅ Conditional order created:', JSON.stringify(order, null, 2));
  return order;
}

/**
 * Creates stop loss order configuration
 */
export function createStopLossOrder(
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  triggerPrice: number,
  isMarket: boolean = true,
  limitPrice?: number
): ConditionalOrderConfig {
  return {
    symbol,
    side: side === 'buy' ? 'sell' : 'buy', // Opposite side for stop loss
    quantity,
    leverage: 1, // Not relevant for conditional orders
    triggerPrice,
    orderType: 'stop_loss',
    isMarket,
    limitPrice,
    reduceOnly: true // Stop loss should always reduce position
  };
}

/**
 * Creates take profit order configuration  
 */
export function createTakeProfitOrder(
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  triggerPrice: number,
  isMarket: boolean = true,
  limitPrice?: number
): ConditionalOrderConfig {
  return {
    symbol,
    side: side === 'buy' ? 'sell' : 'buy', // Opposite side for take profit
    quantity,
    leverage: 1, // Not relevant for conditional orders
    triggerPrice,
    orderType: 'take_profit',
    isMarket,
    limitPrice,
    reduceOnly: true // Take profit should always reduce position
  };
}

/**
 * Creates bracket order with both stop loss and take profit
 */
export function createBracketOrder(
  symbol: string,
  side: 'buy' | 'sell',
  quantity: number,
  stopLossPrice: number,
  takeProfitPrice: number,
  isMarketExecution: boolean = true
): {
  stopLoss: ConditionalOrderConfig;
  takeProfit: ConditionalOrderConfig;
} {
  console.log('🎯 Creating bracket order:', {
    symbol,
    side,
    quantity,
    stopLossPrice,
    takeProfitPrice,
    isMarketExecution
  });

  return {
    stopLoss: createStopLossOrder(symbol, side, quantity, stopLossPrice, isMarketExecution),
    takeProfit: createTakeProfitOrder(symbol, side, quantity, takeProfitPrice, isMarketExecution)
  };
}

/**
 * Validates conditional order configuration
 */
export function validateConditionalOrder(
  config: ConditionalOrderConfig,
  currentPrice: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Basic validation
  if (config.quantity <= 0) {
    errors.push('Quantity must be positive');
  }
  
  if (config.triggerPrice <= 0) {
    errors.push('Trigger price must be positive');
  }
  
  // Price logic validation
  if (config.orderType === 'stop_loss') {
    if (config.side === 'buy') {
      // Buy stop loss: trigger when price goes up (triggerPx > currentPrice)
      if (config.triggerPrice <= currentPrice) {
        errors.push(`Buy stop loss trigger price (${config.triggerPrice}) should be above current price (${currentPrice})`);
      }
    } else {
      // Sell stop loss: trigger when price goes down (triggerPx < currentPrice)
      if (config.triggerPrice >= currentPrice) {
        errors.push(`Sell stop loss trigger price (${config.triggerPrice}) should be below current price (${currentPrice})`);
      }
    }
  } else if (config.orderType === 'take_profit') {
    if (config.side === 'buy') {
      // Buy take profit: trigger when price goes down (triggerPx < currentPrice)
      if (config.triggerPrice >= currentPrice) {
        errors.push(`Buy take profit trigger price (${config.triggerPrice}) should be below current price (${currentPrice})`);
      }
    } else {
      // Sell take profit: trigger when price goes up (triggerPx > currentPrice)
      if (config.triggerPrice <= currentPrice) {
        errors.push(`Sell take profit trigger price (${config.triggerPrice}) should be above current price (${currentPrice})`);
      }
    }
  }
  
  // Limit price validation
  if (!config.isMarket && !config.limitPrice) {
    errors.push('Limit price required when isMarket is false');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Converts percentage-based stop loss to absolute price
 */
export function calculateStopLossPrice(
  currentPrice: number,
  stopLossPercentage: number,
  side: 'buy' | 'sell'
): number {
  if (side === 'buy') {
    // For long positions, stop loss is below entry price
    return currentPrice * (1 - stopLossPercentage / 100);
  } else {
    // For short positions, stop loss is above entry price
    return currentPrice * (1 + stopLossPercentage / 100);
  }
}

/**
 * Converts percentage-based take profit to absolute price
 */
export function calculateTakeProfitPrice(
  currentPrice: number,
  takeProfitPercentage: number,
  side: 'buy' | 'sell'
): number {
  if (side === 'buy') {
    // For long positions, take profit is above entry price
    return currentPrice * (1 + takeProfitPercentage / 100);
  } else {
    // For short positions, take profit is below entry price
    return currentPrice * (1 - takeProfitPercentage / 100);
  }
}
