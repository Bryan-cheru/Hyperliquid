// React Hook for Entry Position Control Integration
import { useState, useEffect, useCallback } from 'react';
import { entryPositionService } from '../utils/entryPositionService';
import type { EntryPositionOrder } from '../utils/entryPositionManager';
import type { EntryPositionParams } from '../components/TradingControls/EntryPosition';
import { useTrading } from '../contexts/TradingContext';

export interface UseEntryPositionReturn {
  // Entry management
  createEntry: (side: 'buy' | 'sell', params: EntryPositionParams) => Promise<string | null>;
  updateEntry: (entryId: string, params: Partial<EntryPositionParams>) => Promise<boolean>;
  cancelEntry: (entryId: string) => Promise<boolean>;
  
  // Status and data
  activeEntries: EntryPositionOrder[];
  entryStats: {
    total: number;
    pending: number;
    active: number;
    filled: number;
    cancelled: number;
  };
  
  // Loading states
  isCreating: boolean;
  isUpdating: boolean;
  isCancelling: boolean;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

export const useEntryPosition = (): UseEntryPositionReturn => {
  const { connectedAccount } = useTrading();
  
  // State management
  const [activeEntries, setActiveEntries] = useState<EntryPositionOrder[]>([]);
  const [entryStats, setEntryStats] = useState({
    total: 0,
    pending: 0,
    active: 0,
    filled: 0,
    cancelled: 0
  });
  
  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  // Refresh entry data
  const refreshEntryData = useCallback(() => {
    try {
      const allEntries = entryPositionService.getAllEntries();
      const stats = entryPositionService.getEntryStats();
      
      setActiveEntries(allEntries);
      setEntryStats(stats);
      
    } catch (err) {
      console.error('❌ Failed to refresh entry data:', err);
      setError('Failed to refresh entry data');
    }
  }, []);

  // Create entry position
  const createEntry = useCallback(async (
    side: 'buy' | 'sell', 
    params: EntryPositionParams
  ): Promise<string | null> => {
    if (!connectedAccount?.pair) {
      setError('No trading pair selected');
      return null;
    }
    
    setIsCreating(true);
    setError(null);
    
    try {
      const symbol = connectedAccount.pair.replace('/USDT', '').replace('/USDC', '');
      const entryId = await entryPositionService.createEntry(symbol, side, params);
      
      console.log('✅ Entry position created successfully:', entryId);
      
      // Refresh data
      refreshEntryData();
      
      return entryId;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create entry position';
      setError(errorMessage);
      console.error('❌ Failed to create entry position:', err);
      return null;
      
    } finally {
      setIsCreating(false);
    }
  }, [connectedAccount?.pair, refreshEntryData]);
  
  // Update entry position
  const updateEntry = useCallback(async (
    entryId: string, 
    params: Partial<EntryPositionParams>
  ): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);
    
    try {
      const success = await entryPositionService.updateEntry(entryId, params);
      
      if (success) {
        console.log('✅ Entry position updated successfully:', entryId);
        refreshEntryData();
      } else {
        setError('Failed to update entry position');
      }
      
      return success;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update entry position';
      setError(errorMessage);
      console.error('❌ Failed to update entry position:', err);
      return false;
      
    } finally {
      setIsUpdating(false);
    }
  }, [refreshEntryData]);
  
  // Cancel entry position
  const cancelEntry = useCallback(async (entryId: string): Promise<boolean> => {
    setIsCancelling(true);
    setError(null);
    
    try {
      const success = await entryPositionService.cancelEntry(entryId);
      
      if (success) {
        console.log('✅ Entry position cancelled successfully:', entryId);
        refreshEntryData();
      } else {
        setError('Failed to cancel entry position');
      }
      
      return success;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel entry position';
      setError(errorMessage);
      console.error('❌ Failed to cancel entry position:', err);
      return false;
      
    } finally {
      setIsCancelling(false);
    }
  }, [refreshEntryData]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Set up event listeners and initial data load
  useEffect(() => {
    // Load initial data
    refreshEntryData();
    
    // Set up execution event listener
    const handleEntryExecution = (order: EntryPositionOrder, action: string) => {
      console.log('📊 Entry execution received in hook:', order.id, action);
      
      // Refresh data when executions occur
      refreshEntryData();
      
      // Show notifications for important events
      if (action === 'entry_order_filled') {
        console.log(`🎉 Entry position filled: ${order.symbol} ${order.side}`);
      } else if (action === 'entry_order_cancelled') {
        console.log(`🛑 Entry position cancelled: ${order.symbol} ${order.side}`);
      } else if (action === 'max_chases_reached') {
        console.log(`⏰ Max chases reached for: ${order.symbol} ${order.side}`);
      }
    };
    
    // Register event listener
    entryPositionService.onEntryExecution(handleEntryExecution);
    
    // Set up periodic refresh for active entries
    const refreshInterval = setInterval(() => {
      refreshEntryData();
    }, 10000); // Refresh every 10 seconds
    
    // Cleanup
    return () => {
      clearInterval(refreshInterval);
    };
  }, [refreshEntryData]);
  
  // Monitor active entries and log status changes
  useEffect(() => {
    const activeCount = activeEntries.filter(entry => entry.status === 'active').length;
    const pendingCount = activeEntries.filter(entry => entry.status === 'pending').length;
    
    if (activeCount > 0 || pendingCount > 0) {
      console.log(`📊 Entry positions status: ${activeCount} active, ${pendingCount} pending`);
    }
  }, [activeEntries]);
  
  return {
    // Entry management
    createEntry,
    updateEntry,
    cancelEntry,
    
    // Status and data
    activeEntries,
    entryStats,
    
    // Loading states
    isCreating,
    isUpdating,
    isCancelling,
    
    // Error handling
    error,
    clearError
  };
};

export default useEntryPosition;
