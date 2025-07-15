// Basket order types and interfaces for advanced trading strategies

export interface BasketOrderConfig {
  id: string;
  name: string;
  symbol: string;
  side: 'buy' | 'sell';
  
  // Main order details
  entryOrder: {
    type: 'market' | 'limit';
    quantity: number;
    price?: number;
    leverage: number;
  };
  
  // Stop loss configuration
  stopLoss: {
    enabled: boolean;
    triggerPrice: number;
    orderType: 'market' | 'limit';
    limitPrice?: number; // For limit stop loss orders
    timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d'; // Candlestick timeframe for trigger
    candleCloseConfirmation: boolean; // Wait for candle close to trigger
  };
  
  // Limit chaser configuration
  limitChaser: {
    enabled: boolean;
    distance: number; // Distance from current price (in percentage or absolute)
    distanceType: 'percentage' | 'absolute';
    fillOrCancel: boolean; // IOC order behavior
    updateInterval: number; // How often to update the order (in seconds)
    maxChases: number; // Maximum number of times to chase the price
    chaseCount: number; // Current chase count
  };
  
  // Take profit levels (multiple levels supported)
  takeProfits: Array<{
    id: string;
    targetPrice: number;
    quantity: number; // Percentage of position to close
    orderType: 'market' | 'limit';
    enabled: boolean;
  }>;
  
  // Status and tracking
  status: 'pending' | 'active' | 'completed' | 'cancelled' | 'error';
  createdAt: number;
  updatedAt: number;
  
  // Active order IDs for tracking
  activeOrders: {
    entryOrderId?: string;
    stopLossOrderId?: string;
    limitChaserOrderId?: string;
    takeProfitOrderIds: string[];
  };
  
  // Execution logs
  executionLog: Array<{
    timestamp: number;
    action: string;
    details: string;
    orderId?: string;
  }>;
}

export interface MarketDataCandle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  symbol: string;
  timeframe: string;
}

export interface BasketOrderExecution {
  basketId: string;
  action: 'entry_filled' | 'stop_loss_triggered' | 'take_profit_hit' | 'limit_chaser_updated' | 'cancelled';
  timestamp: number;
  details: Record<string, unknown>;
}

export interface BasketOrderManager {
  // Core basket management
  createBasket: (config: Omit<BasketOrderConfig, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'activeOrders' | 'executionLog'>) => Promise<string>;
  updateBasket: (basketId: string, updates: Partial<BasketOrderConfig>) => Promise<boolean>;
  cancelBasket: (basketId: string) => Promise<boolean>;
  getBasket: (basketId: string) => BasketOrderConfig | null;
  getAllBaskets: () => BasketOrderConfig[];
  
  // Market monitoring
  startMarketMonitoring: () => void;
  stopMarketMonitoring: () => void;
  monitorTimeframe: (symbol: string, timeframe: string) => void;
  
  // Order execution
  executeBasketEntry: (basketId: string) => Promise<boolean>;
  updateLimitChaser: (basketId: string, newPrice: number) => Promise<boolean>;
  triggerStopLoss: (basketId: string, marketPrice: number) => Promise<boolean>;
  executeTakeProfit: (basketId: string, takeProfitId: string) => Promise<boolean>;
}
