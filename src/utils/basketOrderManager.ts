// Basket Order Manager - Advanced trading strategy execution
import type { BasketOrderConfig, BasketOrderManager, MarketDataCandle, BasketOrderExecution } from './basketOrderTypes';
import { marketDataService } from './marketDataService';

class BasketOrderManagerImpl implements BasketOrderManager {
  private baskets = new Map<string, BasketOrderConfig>();
  private marketMonitoringActive = false;
  private monitoringIntervals = new Map<string, NodeJS.Timeout>();
  private candleCache = new Map<string, MarketDataCandle[]>();
  
  // Event callbacks
  private onBasketExecution?: (execution: BasketOrderExecution) => void;
  
  constructor() {
    this.loadBaskets();
  }
  
  // Core basket management
  async createBasket(config: Omit<BasketOrderConfig, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'activeOrders' | 'executionLog'>): Promise<string> {
    const basketId = `basket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const basket: BasketOrderConfig = {
      ...config,
      id: basketId,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeOrders: {
        takeProfitOrderIds: []
      },
      executionLog: []
    };
    
    this.baskets.set(basketId, basket);
    this.saveBaskets();
    
    // Start monitoring if enabled
    if (basket.stopLoss.enabled && basket.stopLoss.candleCloseConfirmation) {
      this.monitorTimeframe(basket.symbol, basket.stopLoss.timeframe);
    }
    
    this.log(basketId, 'basket_created', `Basket order created for ${basket.symbol}`);
    return basketId;
  }
  
  async updateBasket(basketId: string, updates: Partial<BasketOrderConfig>): Promise<boolean> {
    const basket = this.baskets.get(basketId);
    if (!basket) return false;
    
    const updatedBasket = { ...basket, ...updates, updatedAt: Date.now() };
    this.baskets.set(basketId, updatedBasket);
    this.saveBaskets();
    
    this.log(basketId, 'basket_updated', 'Basket configuration updated');
    return true;
  }
  
  async cancelBasket(basketId: string): Promise<boolean> {
    const basket = this.baskets.get(basketId);
    if (!basket) return false;
    
    try {
      // Cancel all active orders
      if (basket.activeOrders.entryOrderId) {
        await this.cancelOrder(basket.activeOrders.entryOrderId);
      }
      if (basket.activeOrders.stopLossOrderId) {
        await this.cancelOrder(basket.activeOrders.stopLossOrderId);
      }
      if (basket.activeOrders.limitChaserOrderId) {
        await this.cancelOrder(basket.activeOrders.limitChaserOrderId);
      }
      for (const tpOrderId of basket.activeOrders.takeProfitOrderIds) {
        await this.cancelOrder(tpOrderId);
      }
      
      basket.status = 'cancelled';
      basket.updatedAt = Date.now();
      this.baskets.set(basketId, basket);
      this.saveBaskets();
      
      this.log(basketId, 'basket_cancelled', 'All orders cancelled, basket closed');
      return true;
    } catch (error) {
      console.error('Error cancelling basket:', error);
      return false;
    }
  }
  
  getBasket(basketId: string): BasketOrderConfig | null {
    return this.baskets.get(basketId) || null;
  }
  
  getAllBaskets(): BasketOrderConfig[] {
    return Array.from(this.baskets.values());
  }
  
  // Market monitoring
  startMarketMonitoring(): void {
    if (this.marketMonitoringActive) return;
    
    this.marketMonitoringActive = true;
        
    // Start monitoring active baskets
    for (const basket of this.baskets.values()) {
      if (basket.status === 'active' && basket.stopLoss.enabled) {
        this.monitorTimeframe(basket.symbol, basket.stopLoss.timeframe);
      }
    }
  }
  
  stopMarketMonitoring(): void {
    this.marketMonitoringActive = false;
    
    // Clear all monitoring intervals
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval);
    }
    this.monitoringIntervals.clear();
    
      }
  
  monitorTimeframe(symbol: string, timeframe: string): void {
    const key = `${symbol}_${timeframe}`;
    
    if (this.monitoringIntervals.has(key)) {
      return; // Already monitoring this symbol/timeframe
    }
    
    const interval = setInterval(async () => {
      await this.checkCandleClose(symbol, timeframe);
    }, this.getTimeframeMs(timeframe));
    
    this.monitoringIntervals.set(key, interval);
      }
  
  // Order execution
  async executeBasketEntry(basketId: string): Promise<boolean> {
    const basket = this.baskets.get(basketId);
    if (!basket || basket.status !== 'pending') return false;
    
    try {
      const entryOrder = basket.entryOrder;
      
      // Execute the entry order using the existing trading system
      const orderResult = await this.placeOrder({
        symbol: basket.symbol,
        side: basket.side,
        type: entryOrder.type,
        quantity: entryOrder.quantity,
        price: entryOrder.price,
        leverage: entryOrder.leverage
      });
      
      if (orderResult.success) {
        basket.activeOrders.entryOrderId = orderResult.orderId;
        basket.status = 'active';
        basket.updatedAt = Date.now();
        
        this.log(basketId, 'entry_executed', `Entry order placed: ${orderResult.orderId}`);
        
        // Setup stop loss if enabled
        if (basket.stopLoss.enabled) {
          await this.setupStopLoss(basketId);
        }
        
        // Setup limit chaser if enabled
        if (basket.limitChaser.enabled) {
          await this.setupLimitChaser(basketId);
        }
        
        this.saveBaskets();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error executing basket entry:', error);
      this.log(basketId, 'entry_failed', `Entry execution failed: ${error}`);
      return false;
    }
  }
  
  async updateLimitChaser(basketId: string, newPrice: number): Promise<boolean> {
    const basket = this.baskets.get(basketId);
    if (!basket || !basket.limitChaser.enabled) return false;
    
    try {
      // Cancel existing limit chaser order
      if (basket.activeOrders.limitChaserOrderId) {
        await this.cancelOrder(basket.activeOrders.limitChaserOrderId);
      }
      
      // Place new limit chaser order
      const orderResult = await this.placeOrder({
        symbol: basket.symbol,
        side: (basket.side === 'buy' ? 'sell' : 'buy') as 'buy' | 'sell', // Opposite side for closing
        type: 'limit',
        quantity: basket.entryOrder.quantity,
        price: newPrice,
        timeInForce: basket.limitChaser.fillOrCancel ? 'IOC' : 'GTC'
      });
      
      if (orderResult.success) {
        basket.activeOrders.limitChaserOrderId = orderResult.orderId;
        basket.limitChaser.chaseCount++;
        basket.updatedAt = Date.now();
        
        this.log(basketId, 'limit_chaser_updated', `Limit chaser updated to ${newPrice}`);
        this.saveBaskets();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error updating limit chaser:', error);
      return false;
    }
  }
  
  async triggerStopLoss(basketId: string, marketPrice: number): Promise<boolean> {
    const basket = this.baskets.get(basketId);
    if (!basket || !basket.stopLoss.enabled) return false;
    
    try {
      // Cancel limit chaser if active
      if (basket.activeOrders.limitChaserOrderId) {
        await this.cancelOrder(basket.activeOrders.limitChaserOrderId);
        basket.activeOrders.limitChaserOrderId = undefined;
      }
      
      // Execute stop loss order
      const stopLossOrder = {
        symbol: basket.symbol,
        side: (basket.side === 'buy' ? 'sell' : 'buy') as 'buy' | 'sell', // Opposite side
        type: basket.stopLoss.orderType,
        quantity: basket.entryOrder.quantity,
        price: basket.stopLoss.limitPrice || marketPrice
      };
      
      const orderResult = await this.placeOrder(stopLossOrder);
      
      if (orderResult.success) {
        basket.activeOrders.stopLossOrderId = orderResult.orderId;
        basket.status = 'completed';
        basket.updatedAt = Date.now();
        
        this.log(basketId, 'stop_loss_triggered', `Stop loss executed at ${marketPrice}`);
        
        // Emit execution event
        this.emitExecution({
          basketId,
          action: 'stop_loss_triggered',
          timestamp: Date.now(),
          details: { marketPrice, orderId: orderResult.orderId }
        });
        
        this.saveBaskets();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error triggering stop loss:', error);
      return false;
    }
  }
  
  async executeTakeProfit(basketId: string, takeProfitId: string): Promise<boolean> {
    const basket = this.baskets.get(basketId);
    if (!basket) return false;
    
    const takeProfit = basket.takeProfits.find(tp => tp.id === takeProfitId);
    if (!takeProfit || !takeProfit.enabled) return false;
    
    try {
      const orderResult = await this.placeOrder({
        symbol: basket.symbol,
        side: (basket.side === 'buy' ? 'sell' : 'buy') as 'buy' | 'sell',
        type: takeProfit.orderType,
        quantity: basket.entryOrder.quantity * (takeProfit.quantity / 100),
        price: takeProfit.targetPrice
      });
      
      if (orderResult.success && orderResult.orderId) {
        basket.activeOrders.takeProfitOrderIds.push(orderResult.orderId);
        takeProfit.enabled = false; // Mark as executed
        basket.updatedAt = Date.now();
        
        this.log(basketId, 'take_profit_executed', `Take profit executed at ${takeProfit.targetPrice}`);
        this.saveBaskets();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error executing take profit:', error);
      return false;
    }
  }
  
  // Private helper methods
  private async checkCandleClose(symbol: string, timeframe: string): Promise<void> {
    try {
      // Fetch latest candle data
      const candles = await this.fetchCandles(symbol, timeframe, 2);
      if (candles.length < 2) return;
      
      const latestCandle = candles[0];
      const previousCandle = candles[1];
      
      // Check if we have a new completed candle
      const key = `${symbol}_${timeframe}`;
      const cachedCandles = this.candleCache.get(key) || [];
      
      if (cachedCandles.length === 0 || latestCandle.timestamp > cachedCandles[0].timestamp) {
        // New candle detected, update cache
        this.candleCache.set(key, [latestCandle, ...cachedCandles.slice(0, 99)]); // Keep last 100 candles
        
        // Check all baskets for stop loss triggers
        for (const basket of this.baskets.values()) {
          if (basket.status === 'active' && 
              basket.stopLoss.enabled && 
              basket.stopLoss.candleCloseConfirmation &&
              basket.symbol === symbol &&
              basket.stopLoss.timeframe === timeframe) {
            
            await this.checkStopLossTrigger(basket.id, previousCandle);
          }
        }
      }
    } catch (error) {
      console.error('Error checking candle close:', error);
    }
  }
  
  private async checkStopLossTrigger(basketId: string, candle: MarketDataCandle): Promise<void> {
    const basket = this.baskets.get(basketId);
    if (!basket) return;
    
    const triggerPrice = basket.stopLoss.triggerPrice;
    
    // Check if stop loss should trigger based on candle close
    const shouldTrigger = basket.side === 'buy' 
      ? candle.close <= triggerPrice  // Long position: trigger if close is below stop loss
      : candle.close >= triggerPrice; // Short position: trigger if close is above stop loss
    
    if (shouldTrigger) {
            await this.triggerStopLoss(basketId, candle.close);
    }
  }
  
  private async setupStopLoss(basketId: string): Promise<void> {
    // Stop loss setup is handled by the checkCandleClose monitoring
    // This could be extended to place immediate stop loss orders if not using candle confirmation
    const basket = this.baskets.get(basketId);
    if (!basket) return;
    
    this.log(basketId, 'stop_loss_setup', `Stop loss monitoring started at ${basket.stopLoss.triggerPrice}`);
  }
  
  private async setupLimitChaser(basketId: string): Promise<void> {
    const basket = this.baskets.get(basketId);
    if (!basket || !basket.limitChaser.enabled) return;
    
    // Start limit chaser monitoring
    const interval = setInterval(async () => {
      await this.updateLimitChaserPrice(basketId);
    }, basket.limitChaser.updateInterval * 1000);
    
    // Store interval for cleanup
    this.monitoringIntervals.set(`chaser_${basketId}`, interval);
    
    this.log(basketId, 'limit_chaser_setup', 'Limit chaser monitoring started');
  }
  
  private async updateLimitChaserPrice(basketId: string): Promise<void> {
    const basket = this.baskets.get(basketId);
    if (!basket || !basket.limitChaser.enabled || basket.limitChaser.chaseCount >= basket.limitChaser.maxChases) {
      return;
    }
    
    try {
      // Get current market price
      const currentPrice = await marketDataService.getPrice(basket.symbol);
      if (!currentPrice) {
        console.warn(`⚠️ No market price available for ${basket.symbol} limit chaser`);
        return;
      }
      
      // Calculate new chase price
      const distance = basket.limitChaser.distanceType === 'percentage' 
        ? currentPrice * (basket.limitChaser.distance / 100)
        : basket.limitChaser.distance;
      
      const newPrice = basket.side === 'buy'
        ? currentPrice - distance  // Buy below market
        : currentPrice + distance; // Sell above market
      
            
      // Cancel existing limit chaser order if any
      if (basket.activeOrders.limitChaserOrderId) {
                await this.cancelOrder(basket.activeOrders.limitChaserOrderId);
      }
      
      // Place new limit chaser order with IOC if Fill-or-Cancel is enabled
      const orderResult = await this.placeOrder({
        symbol: basket.symbol,
        side: basket.side,
        type: 'limit',
        quantity: basket.entryOrder.quantity,
        price: newPrice,
        timeInForce: basket.limitChaser.fillOrCancel ? 'IOC' : 'GTC', // Immediate or Cancel vs Good Till Cancelled
        leverage: basket.entryOrder.leverage
      });
      
      if (orderResult.success) {
        basket.activeOrders.limitChaserOrderId = orderResult.orderId;
        basket.limitChaser.chaseCount++;
        basket.updatedAt = Date.now();
        
        this.log(basketId, 'limit_chaser_updated', 
          `Limit chaser order ${basket.limitChaser.chaseCount}/${basket.limitChaser.maxChases}: ${newPrice} (${basket.limitChaser.fillOrCancel ? 'IOC' : 'GTC'})`);
        
                
        // Check if this was an IOC order and if it was cancelled
        if (basket.limitChaser.fillOrCancel) {
          setTimeout(async () => {
            await this.checkIOCOrderStatus(basketId, orderResult.orderId!);
          }, 1000); // Check after 1 second
        }
        
        this.saveBaskets();
      } else {
        console.error(`❌ Failed to place limit chaser order for ${basket.symbol}`);
        this.log(basketId, 'limit_chaser_failed', 'Failed to place limit chaser order');
      }
      
    } catch (error) {
      console.error(`❌ Error updating limit chaser for ${basketId}:`, error);
      this.log(basketId, 'limit_chaser_error', `Limit chaser error: ${error}`);
    }
  }

  // Check if IOC order was filled or cancelled
  private async checkIOCOrderStatus(basketId: string, orderId: string): Promise<void> {
    const basket = this.baskets.get(basketId);
    if (!basket) return;
    
    try {
      // Check order status (this would need to be implemented based on your trading API)
      const orderStatus = await this.getOrderStatus(orderId);
      
      if (orderStatus === 'cancelled') {
                basket.activeOrders.limitChaserOrderId = undefined;
        this.log(basketId, 'ioc_cancelled', `IOC order ${orderId} cancelled - continuing to chase`);
      } else if (orderStatus === 'filled') {
                basket.status = 'active'; // Position opened via limit chaser
        this.log(basketId, 'ioc_filled', `IOC order ${orderId} filled - position opened`);
        
        // Setup stop loss and take profits now that position is open
        if (basket.stopLoss.enabled) {
          await this.setupStopLoss(basketId);
        }
      }
      
      this.saveBaskets();
    } catch (error) {
      console.error(`❌ Error checking IOC order status for ${orderId}:`, error);
    }
  }
  
  private async fetchCandles(symbol: string, timeframe: string, limit: number): Promise<MarketDataCandle[]> {
    // This would integrate with your market data source
        
    try {
      // In a real implementation, this would call HyperLiquid's candle API
      // For testing, we'll create mock candles based on current price
      const currentPrice = await marketDataService.getPrice(symbol);
      if (!currentPrice) return [];
      
      const now = Date.now();
      const timeframeMs = this.getTimeframeMs(timeframe);
      
      const candles: MarketDataCandle[] = [];
      for (let i = limit - 1; i >= 0; i--) {
        const timestamp = now - (i * timeframeMs);
        const open = currentPrice + (Math.random() - 0.5) * currentPrice * 0.01; // +/- 1%
        const close = open + (Math.random() - 0.5) * open * 0.005; // +/- 0.5%
        const high = Math.max(open, close) + Math.random() * Math.abs(open - close);
        const low = Math.min(open, close) - Math.random() * Math.abs(open - close);
        
        candles.push({
          timestamp,
          open,
          high,
          low,
          close,
          volume: Math.random() * 1000000,
          symbol,
          timeframe
        });
      }
      
      return candles;
    } catch (error) {
      console.error(`❌ Error fetching candles for ${symbol}:`, error);
      return [];
    }
  }
  
  private async placeOrder(order: {
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    quantity: number;
    price?: number;
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
    leverage?: number;
    reduceOnly?: boolean;
  }): Promise<{ success: boolean; orderId?: string; fillPrice?: number; message: string }> {
    // This would integrate with your existing order placement system
        
    // Mock order placement for testing
    return { 
      success: true, 
      orderId: `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`, 
      fillPrice: order.price || await marketDataService.getPrice(order.symbol) || 0,
      message: 'Order placed successfully' 
    };
  }

  private async cancelOrder(orderId: string): Promise<boolean> {
    // This would integrate with your existing order cancellation system
        return true;
  }

  private async getOrderStatus(orderId: string): Promise<'pending' | 'filled' | 'cancelled' | 'rejected'> {
        // This would check actual order status
    // For testing IOC behavior, randomly return filled or cancelled
    return Math.random() > 0.5 ? 'filled' : 'cancelled';
  }
  
  private getTimeframeMs(timeframe: string): number {
    const timeframes: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return timeframes[timeframe] || 60 * 1000;
  }
  
  private log(basketId: string, action: string, details: string, orderId?: string): void {
    const basket = this.baskets.get(basketId);
    if (!basket) return;
    
    basket.executionLog.push({
      timestamp: Date.now(),
      action,
      details,
      orderId
    });
    
      }
  
  private emitExecution(execution: BasketOrderExecution): void {
    if (this.onBasketExecution) {
      this.onBasketExecution(execution);
    }
  }
  
  private saveBaskets(): void {
    try {
      const data = JSON.stringify(Array.from(this.baskets.entries()));
      localStorage.setItem('hyperliquid_baskets', data);
    } catch (error) {
      console.error('Error saving baskets:', error);
    }
  }
  
  private loadBaskets(): void {
    try {
      const data = localStorage.getItem('hyperliquid_baskets');
      if (data) {
        const entries = JSON.parse(data);
        this.baskets = new Map(entries);
      }
    } catch (error) {
      console.error('Error loading baskets:', error);
    }
  }
  
  // Public method to set execution callback
  setExecutionCallback(callback: (execution: BasketOrderExecution) => void): void {
    this.onBasketExecution = callback;
  }
}

// Export singleton instance
export const basketOrderManager = new BasketOrderManagerImpl();
