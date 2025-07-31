// Entry Position Integration Service - Connects UI components with backend logic
import { entryPositionManager, type EntryPositionOrder } from './entryPositionManager';
import type { EntryPositionParams } from '../components/TradingControls/EntryPosition';

export interface EntryPositionService {
  // Core operations
  createEntry: (symbol: string, side: 'buy' | 'sell', params: EntryPositionParams) => Promise<string>;
  updateEntry: (entryId: string, params: Partial<EntryPositionParams>) => Promise<boolean>;
  cancelEntry: (entryId: string) => Promise<boolean>;
  
  // Status monitoring
  getEntryStatus: (entryId: string) => EntryPositionOrder | null;
  getAllEntries: () => EntryPositionOrder[];
  
  // Event callbacks
  onEntryExecution: (callback: (order: EntryPositionOrder, action: string) => void) => void;
}

class EntryPositionServiceImpl implements EntryPositionService {
  private activeEntries = new Set<string>();
  private statusCallbacks = new Map<string, (status: string) => void>();
  
  constructor() {
    // Set up event handling from backend manager
    entryPositionManager.setOnOrderExecution((order, action) => {
      this.handleOrderExecution(order, action);
    });
  }
  
  async createEntry(symbol: string, side: 'buy' | 'sell', params: EntryPositionParams): Promise<string> {
    try {
      console.log('🚀 Creating entry position:', { symbol, side, params });
      
      // Validate parameters
      if (!this.validateEntryParams(params)) {
        throw new Error('Invalid entry position parameters');
      }
      
      // Create entry order through backend manager
      const entryId = await entryPositionManager.createEntryPosition(symbol, side, params);
      
      // Track active entry
      this.activeEntries.add(entryId);
      
      console.log('✅ Entry position created:', entryId);
      return entryId;
      
    } catch (error) {
      console.error('❌ Failed to create entry position:', error);
      throw error;
    }
  }
  
  async updateEntry(entryId: string, params: Partial<EntryPositionParams>): Promise<boolean> {
    try {
      console.log('🔄 Updating entry position:', entryId, params);
      
      const success = await entryPositionManager.updateEntryPosition(entryId, params);
      
      if (success) {
        console.log('✅ Entry position updated:', entryId);
      } else {
        console.warn('⚠️ Failed to update entry position:', entryId);
      }
      
      return success;
      
    } catch (error) {
      console.error('❌ Error updating entry position:', error);
      return false;
    }
  }
  
  async cancelEntry(entryId: string): Promise<boolean> {
    try {
      console.log('🛑 Cancelling entry position:', entryId);
      
      const success = await entryPositionManager.cancelEntryOrder(entryId);
      
      if (success) {
        this.activeEntries.delete(entryId);
        console.log('✅ Entry position cancelled:', entryId);
      } else {
        console.warn('⚠️ Failed to cancel entry position:', entryId);
      }
      
      return success;
      
    } catch (error) {
      console.error('❌ Error cancelling entry position:', error);
      return false;
    }
  }
  
  getEntryStatus(entryId: string): EntryPositionOrder | null {
    return entryPositionManager.getEntryOrder(entryId);
  }
  
  getAllEntries(): EntryPositionOrder[] {
    return entryPositionManager.getAllEntryOrders();
  }
  
  onEntryExecution(callback: (order: EntryPositionOrder, action: string) => void): void {
    entryPositionManager.setOnOrderExecution(callback);
  }
  
  // Register status callback for specific entry
  registerStatusCallback(entryId: string, callback: (status: string) => void): void {
    this.statusCallbacks.set(entryId, callback);
  }
  
  // Unregister status callback
  unregisterStatusCallback(entryId: string): void {
    this.statusCallbacks.delete(entryId);
  }
  
  // Get active entries count
  getActiveEntriesCount(): number {
    return this.activeEntries.size;
  }
  
  // Get entry statistics
  getEntryStats(): {
    total: number;
    pending: number;
    active: number;
    filled: number;
    cancelled: number;
  } {
    const allEntries = this.getAllEntries();
    
    return {
      total: allEntries.length,
      pending: allEntries.filter(e => e.status === 'pending').length,
      active: allEntries.filter(e => e.status === 'active').length,
      filled: allEntries.filter(e => e.status === 'filled').length,
      cancelled: allEntries.filter(e => e.status === 'cancelled').length
    };
  }
  
  private validateEntryParams(params: EntryPositionParams): boolean {
    // Validate basic parameters
    if (!params.enabled) {
      return true; // If disabled, no need to validate further
    }
    
    // Validate position size
    if (params.positionType === 'percentage') {
      if (params.entryPosition <= 0 || params.entryPosition > 1) {
        console.error('❌ Invalid position percentage:', params.entryPosition);
        return false;
      }
      if (params.maxPositionSize <= 0) {
        console.error('❌ Invalid max position size:', params.maxPositionSize);
        return false;
      }
    } else if (params.positionType === 'fixed') {
      if (params.entryPosition <= 0) {
        console.error('❌ Invalid fixed position size:', params.entryPosition);
        return false;
      }
    }
    
    // Validate price distance
    if (params.priceDistance < 0.1 || params.priceDistance > 5) {
      console.error('❌ Invalid price distance:', params.priceDistance);
      return false;
    }
    
    // Validate price limits (if specified)
    if (params.longPriceLimit > 0 && params.shortPriceLimit > 0) {
      if (params.longPriceLimit >= params.shortPriceLimit) {
        console.error('❌ Invalid price limits - long limit must be less than short limit');
        return false;
      }
    }
    
    return true;
  }
  
  private handleOrderExecution(order: EntryPositionOrder, action: string): void {
    console.log(`📊 Entry execution event: ${order.id} - ${action}`);
    
    // Update active entries tracking
    if (action === 'entry_order_filled' || action === 'entry_order_cancelled') {
      this.activeEntries.delete(order.id);
    }
    
    // Notify registered callback for this specific entry
    const callback = this.statusCallbacks.get(order.id);
    if (callback) {
      callback(order.status);
    }
    
    // Log execution details
    this.logExecutionDetails(order, action);
  }
  
  private logExecutionDetails(order: EntryPositionOrder, action: string): void {
    const details = {
      entryId: order.id,
      symbol: order.symbol,
      side: order.side,
      status: order.status,
      action,
      fillOrCancel: order.params.fillOrCancel,
      chaseCount: order.chaseCount,
      lastPrice: order.lastPrice
    };
    
    console.log('📋 Entry execution details:', details);
    
    // Could also emit to analytics service or notification system
    this.emitExecutionEvent(details);
  }
  
  private emitExecutionEvent(details: Record<string, unknown>): void {
    // Emit to global event bus if available
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const event = new CustomEvent('entryPositionExecution', { detail: details });
      window.dispatchEvent(event);
    }
  }
  
  // Cleanup method
  destroy(): void {
    this.activeEntries.clear();
    this.statusCallbacks.clear();
    entryPositionManager.destroy();
  }
}

// Export singleton instance
export const entryPositionService = new EntryPositionServiceImpl();

// Export convenience functions for direct use
export const createEntryPosition = (symbol: string, side: 'buy' | 'sell', params: EntryPositionParams) => 
  entryPositionService.createEntry(symbol, side, params);

export const updateEntryPosition = (entryId: string, params: Partial<EntryPositionParams>) => 
  entryPositionService.updateEntry(entryId, params);

export const cancelEntryPosition = (entryId: string) => 
  entryPositionService.cancelEntry(entryId);

export const getEntryPositionStatus = (entryId: string) => 
  entryPositionService.getEntryStatus(entryId);

export const getAllEntryPositions = () => 
  entryPositionService.getAllEntries();

export default entryPositionService;
