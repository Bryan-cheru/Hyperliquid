// Entry Position Manager - Advanced entry position control with Fill or Cancel functionality
import type { EntryPositionParams } from '../components/TradingControls/EntryPosition';
import { marketDataService } from './marketDataService';

export interface EntryPositionOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  params: EntryPositionParams;
  status: 'pending' | 'active' | 'filled' | 'cancelled' | 'expired';
  createdAt: number;
  updatedAt: number;
  activeOrderId?: string;
  chaseCount: number;
  maxChases: number;
  lastPrice?: number;
  executionLog: Array<{
    timestamp: number;
    action: string;
    details: string;
    price?: number;
    orderId?: string;
  }>;
}

export interface OrderPlacementResult {
  success: boolean;
  orderId?: string;
  error?: string;
}

class EntryPositionManagerImpl {
  private entryOrders = new Map<string, EntryPositionOrder>();
  private monitoringIntervals = new Map<string, NodeJS.Timeout>();
  private isMonitoring = false;
  
  // Event callbacks
  private onOrderExecution?: (order: EntryPositionOrder, action: string) => void;
  
  constructor() {
    this.loadOrders();
  }
  
  // Core entry position management
  async createEntryPosition(
    symbol: string, 
    side: 'buy' | 'sell', 
    params: EntryPositionParams
  ): Promise<string> {
    const orderId = `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const entryOrder: EntryPositionOrder = {
      id: orderId,
      symbol,
      side,
      params,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      chaseCount: 0,
      maxChases: 10, // Default max chases
      executionLog: []
    };
    
    this.entryOrders.set(orderId, entryOrder);
    this.saveOrders();
    
    this.log(orderId, 'entry_position_created', `Entry position created for ${symbol}`);
    
    // Start execution based on parameters
    if (params.enabled) {
      await this.executeEntryPosition(orderId);
    }
    
    return orderId;
  }
  
  async executeEntryPosition(orderId: string): Promise<boolean> {
    const order = this.entryOrders.get(orderId);
    if (!order || !order.params.enabled) return false;
    
    try {
      // Calculate position size
      const quantity = this.calculatePositionQuantity(order);
      if (quantity <= 0) {
        this.log(orderId, 'execution_failed', 'Invalid position size calculated');
        return false;
      }
      
      // Get current market price for entry logic
      const currentPrice = await marketDataService.getPrice(order.symbol);
      if (!currentPrice) {
        this.log(orderId, 'execution_failed', 'Unable to get current market price');
        return false;
      }
      
      // Calculate entry price based on distance and limits
      const entryPrice = this.calculateEntryPrice(order, currentPrice);
      
      // Place entry order
      const orderResult = await this.placeEntryOrder(order, entryPrice, quantity);
      
      if (orderResult.success && orderResult.orderId) {
        order.activeOrderId = orderResult.orderId;
        order.status = 'active';
        order.lastPrice = entryPrice;
        order.updatedAt = Date.now();
        
        this.log(orderId, 'entry_order_placed', `Entry order placed at ${entryPrice}`, entryPrice, orderResult.orderId);
        
        // Start price chasing if Fill or Cancel is enabled
        if (order.params.fillOrCancel) {
          this.startPriceChasing(orderId);
        }
        
        this.saveOrders();
        this.emitExecution(order, 'entry_order_placed');
        return true;
      }
      
      this.log(orderId, 'execution_failed', `Failed to place entry order: ${orderResult.error}`);
      return false;
      
    } catch (error) {
      console.error('Error executing entry position:', error);
      this.log(orderId, 'execution_error', `Execution error: ${error}`);
      return false;
    }
  }
  
  private calculatePositionQuantity(order: EntryPositionOrder): number {
    const { params } = order;
    
    if (params.positionType === 'percentage') {
      // Calculate based on percentage of max position size
      return params.maxPositionSize * params.entryPosition;
    } else {
      // Fixed amount
      return params.entryPosition;
    }
  }
  
  private calculateEntryPrice(order: EntryPositionOrder, currentPrice: number): number {
    const { params, side } = order;
    
    // Calculate distance from current price
    const distanceAmount = currentPrice * (params.priceDistance / 100);
    
    let entryPrice: number;
    
    if (side === 'buy') {
      // For long positions, chase below market price for better entry
      entryPrice = currentPrice - distanceAmount;
      
      // Apply long price limit (maximum price we're willing to pay)
      if (params.longPriceLimit > 0 && entryPrice > params.longPriceLimit) {
        entryPrice = params.longPriceLimit;
      }
    } else {
      // For short positions, chase above market price for better entry
      entryPrice = currentPrice + distanceAmount;
      
      // Apply short price limit (minimum price we're willing to sell at)
      if (params.shortPriceLimit > 0 && entryPrice < params.shortPriceLimit) {
        entryPrice = params.shortPriceLimit;
      }
    }
    
    return entryPrice;
  }
  
  private async placeEntryOrder(
    order: EntryPositionOrder, 
    price: number, 
    quantity: number
  ): Promise<OrderPlacementResult> {
    const { symbol, side, params } = order;
    
    try {
      // Determine order type and time in force based on Fill or Cancel setting
      const orderType = 'limit'; // Always use limit orders for entry positions
      const timeInForce = params.fillOrCancel ? 'IOC' : 'GTC';
      
      // Simulate order placement (replace with actual trading API call)
      const orderResult = await this.placeOrder({
        symbol,
        side,
        type: orderType,
        quantity,
        price,
        timeInForce
      });
      
      return orderResult;
      
    } catch (error) {
      console.error('Error placing entry order:', error);
      return {
        success: false,
        error: `Order placement failed: ${error}`
      };
    }
  }
  
  private startPriceChasing(orderId: string): void {
    const order = this.entryOrders.get(orderId);
    if (!order || !order.params.fillOrCancel) return;
    
    // Start monitoring interval (default 5 seconds for aggressive chasing)
    const interval = setInterval(async () => {
      await this.updateChasedPrice(orderId);
    }, 5000);
    
    this.monitoringIntervals.set(orderId, interval);
    this.log(orderId, 'price_chasing_started', 'Fill or Cancel price chasing activated');
  }
  
  private async updateChasedPrice(orderId: string): Promise<void> {
    const order = this.entryOrders.get(orderId);
    if (!order || order.status !== 'active' || !order.params.fillOrCancel) {
      this.stopPriceChasing(orderId);
      return;
    }
    
    // Check if max chases reached
    if (order.chaseCount >= order.maxChases) {
      this.log(orderId, 'max_chases_reached', `Maximum chases (${order.maxChases}) reached`);
      await this.cancelEntryOrder(orderId);
      return;
    }
    
    try {
      // Get current market price
      const currentPrice = await marketDataService.getPrice(order.symbol);
      if (!currentPrice) {
        console.warn(`⚠️ No market price available for ${order.symbol} price chasing`);
        return;
      }
      
      // Calculate new entry price
      const newEntryPrice = this.calculateEntryPrice(order, currentPrice);
      
      // Check if price has changed significantly (avoid unnecessary updates)
      const priceChangeThreshold = 0.001; // 0.1%
      if (order.lastPrice && Math.abs(newEntryPrice - order.lastPrice) / order.lastPrice < priceChangeThreshold) {
        return; // Price hasn't changed enough to warrant an update
      }
      
      // Cancel existing order
      if (order.activeOrderId) {
        await this.cancelOrder(order.activeOrderId);
      }
      
      // Place new order at updated price
      const quantity = this.calculatePositionQuantity(order);
      const orderResult = await this.placeEntryOrder(order, newEntryPrice, quantity);
      
      if (orderResult.success && orderResult.orderId) {
        order.activeOrderId = orderResult.orderId;
        order.lastPrice = newEntryPrice;
        order.chaseCount++;
        order.updatedAt = Date.now();
        
        this.log(orderId, 'price_chased', 
          `Price chased ${order.chaseCount}/${order.maxChases}: ${newEntryPrice}`, 
          newEntryPrice, orderResult.orderId);
        
        this.saveOrders();
        this.emitExecution(order, 'price_chased');
      } else {
        console.error(`❌ Failed to place chased order for ${order.symbol}: ${orderResult.error}`);
        this.log(orderId, 'chase_failed', `Chase order failed: ${orderResult.error}`);
      }
      
    } catch (error) {
      console.error('Error updating chased price:', error);
      this.log(orderId, 'chase_error', `Chase error: ${error}`);
    }
  }
  
  private stopPriceChasing(orderId: string): void {
    const interval = this.monitoringIntervals.get(orderId);
    if (interval) {
      clearInterval(interval);
      this.monitoringIntervals.delete(orderId);
      this.log(orderId, 'price_chasing_stopped', 'Price chasing monitoring stopped');
    }
  }
  
  async cancelEntryOrder(orderId: string): Promise<boolean> {
    const order = this.entryOrders.get(orderId);
    if (!order) return false;
    
    try {
      // Cancel active order if exists
      if (order.activeOrderId) {
        await this.cancelOrder(order.activeOrderId);
      }
      
      // Stop price chasing
      this.stopPriceChasing(orderId);
      
      // Update order status
      order.status = 'cancelled';
      order.updatedAt = Date.now();
      
      this.log(orderId, 'entry_order_cancelled', 'Entry order cancelled');
      this.saveOrders();
      this.emitExecution(order, 'entry_order_cancelled');
      
      return true;
    } catch (error) {
      console.error('Error cancelling entry order:', error);
      return false;
    }
  }
  
  async updateEntryPosition(orderId: string, newParams: Partial<EntryPositionParams>): Promise<boolean> {
    const order = this.entryOrders.get(orderId);
    if (!order) return false;
    
    // Update parameters
    order.params = { ...order.params, ...newParams };
    order.updatedAt = Date.now();
    
    this.log(orderId, 'parameters_updated', 'Entry position parameters updated');
    this.saveOrders();
    
    // If order is active and parameters changed, restart execution
    if (order.status === 'active' && newParams.enabled !== false) {
      await this.cancelEntryOrder(orderId);
      await this.executeEntryPosition(orderId);
    }
    
    return true;
  }
  
  getEntryOrder(orderId: string): EntryPositionOrder | null {
    return this.entryOrders.get(orderId) || null;
  }
  
  getAllEntryOrders(): EntryPositionOrder[] {
    return Array.from(this.entryOrders.values());
  }
  
  // Utility methods
  private async placeOrder(orderParams: {
    symbol: string;
    side: 'buy' | 'sell';
    type: 'market' | 'limit';
    quantity: number;
    price?: number;
    timeInForce?: 'GTC' | 'IOC' | 'FOK';
  }): Promise<OrderPlacementResult> {
    // This is a placeholder - replace with actual Hyperliquid API call
    console.log('📊 Placing order:', orderParams);
    
    // Simulate order placement
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    return {
      success: true,
      orderId
    };
  }
  
  private async cancelOrder(orderId: string): Promise<boolean> {
    // This is a placeholder - replace with actual Hyperliquid API call
    console.log('❌ Cancelling order:', orderId);
    return true;
  }
  
  private log(orderId: string, action: string, details: string, price?: number, orderIdRef?: string): void {
    const order = this.entryOrders.get(orderId);
    if (!order) return;
    
    const logEntry = {
      timestamp: Date.now(),
      action,
      details,
      price,
      orderId: orderIdRef
    };
    
    order.executionLog.push(logEntry);
    console.log(`🔄 [${orderId}] ${action}: ${details}`);
  }
  
  private emitExecution(order: EntryPositionOrder, action: string): void {
    if (this.onOrderExecution) {
      this.onOrderExecution(order, action);
    }
  }
  
  private saveOrders(): void {
    try {
      const ordersData = Array.from(this.entryOrders.entries());
      localStorage.setItem('entryPositionOrders', JSON.stringify(ordersData));
    } catch (error) {
      console.error('Error saving entry orders:', error);
    }
  }
  
  private loadOrders(): void {
    try {
      const savedData = localStorage.getItem('entryPositionOrders');
      if (savedData) {
        const ordersData = JSON.parse(savedData);
        this.entryOrders = new Map(ordersData);
      }
    } catch (error) {
      console.error('Error loading entry orders:', error);
      this.entryOrders = new Map();
    }
  }
  
  // Event handlers
  setOnOrderExecution(callback: (order: EntryPositionOrder, action: string) => void): void {
    this.onOrderExecution = callback;
  }
  
  // Cleanup
  destroy(): void {
    // Clear all monitoring intervals
    for (const interval of this.monitoringIntervals.values()) {
      clearInterval(interval);
    }
    this.monitoringIntervals.clear();
    this.isMonitoring = false;
  }
}

// Export singleton instance
export const entryPositionManager = new EntryPositionManagerImpl();
export default entryPositionManager;
