// Market data and trading history utilities
import type { ConnectedAccount } from "../contexts/TradingContext";

export interface MarketPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  lastUpdate: number;
}

// API Response interfaces
interface HyperLiquidFill {
  tif?: string;
  dir?: string;
  liquidation?: boolean;
  startPosition?: number;
  sz?: number | string;
  px?: number | string;
  side?: string;
  coin?: string;
  time?: number;
  oid?: number;
  tid?: number;
  closed?: boolean;
  hash?: string;
  crossed?: boolean;
  fee?: string;
}

interface HyperLiquidOrder {
  coin?: string;
  side?: string;
  sz?: number | string;
  limitPx?: number | string;
  oid?: number;
  timestamp?: number;
  origSz?: number | string;
  triggerCondition?: string;
  triggerPx?: number;
  tif?: string; // Time in force
  dir?: string; // Direction
  children?: Array<{
    coin?: string;
    side?: string;
    sz?: number | string;
    limitPx?: number | string;
  }>;
}

interface HyperLiquidPosition {
  position?: {
    coin?: string;
    szi?: string;
    entryPx?: string;
    positionValue?: string;
    unrealizedPnl?: string;
    marginUsed?: string;
    returnOnEquity?: string;
  };
  type?: 'oneWay';
}

export interface TradeHistoryItem {
  id: string;
  timestamp: number;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  value: number;
  status: 'filled' | 'partial' | 'cancelled';
  orderId: string;
  type: 'market' | 'limit'; // Add order type tracking
}

export interface OpenOrder {
  id: string;
  symbol: string;
  side: 'buy' | 'sell';
  type: 'market' | 'limit';
  quantity: number;
  price?: number;
  filled: number;
  remaining: number;
  status: 'open' | 'partial';
  timestamp: number;
}

export interface Position {
  symbol: string;
  side: 'long' | 'short';
  size: number;
  entryPrice: number;
  markPrice: number;
  pnl: number;
  pnlPercentage: number;
  leverage: number;
  margin: number;
  timestamp: number;
}

class MarketDataService {
  private priceCache: Map<string, MarketPrice> = new Map();
  private lastPriceUpdate: number = 0;
  private readonly PRICE_CACHE_MS = 5000; // 5 seconds cache

  // Fetch current market prices for all assets - SIMPLE VERSION
  async fetchMarketPrices(): Promise<Map<string, MarketPrice>> {
    const now = Date.now();
    
    // Use cache if fresh
    if (now - this.lastPriceUpdate < this.PRICE_CACHE_MS && this.priceCache.size > 0) {
      return this.priceCache;
    }

    try {
      // Get prices and metadata in parallel
      const [pricesResponse, metaResponse] = await Promise.all([
        fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: "allMids" })
        }),
        fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: "meta" })
        })
      ]);

      const [prices, meta] = await Promise.all([
        pricesResponse.json(),
        metaResponse.json()
      ]);

      this.priceCache.clear();

      // Simple validation and mapping
      if (Array.isArray(prices) && meta?.universe) {
        console.log('📊 Available symbols:', meta.universe.slice(0, 10).map((asset: { name?: string }) => asset?.name || 'unknown'));
        prices.forEach((priceStr, index) => {
          const asset = meta.universe[index];
          if (asset?.name && priceStr) {
            const price = parseFloat(priceStr);
            if (price > 0) {
              // Log BTC-related symbols for debugging
              if (asset.name.toLowerCase().includes('btc')) {
                console.log(`🔍 Found BTC-related symbol: ${asset.name} = $${price}`);
              }
              this.priceCache.set(asset.name, {
                symbol: asset.name,
                price,
                change24h: 0,
                volume24h: 0,
                lastUpdate: now
              });
            }
          }
        });
      }

      // Log BTC price for debugging and show first few symbols
      console.log('🔍 First 5 cached symbols:', Array.from(this.priceCache.keys()).slice(0, 5));
      const btcPrice = this.priceCache.get('BTC');
      if (btcPrice) {
        console.log(`🔥 BTC Price: $${btcPrice.price.toLocaleString()}`);
      } else {
        console.log('❌ No BTC price found in cache');
        // Try to find any BTC-related symbols
        const btcSymbols = Array.from(this.priceCache.keys()).filter(key => 
          key.toLowerCase().includes('btc')
        );
        console.log('🔍 BTC-related symbols found:', btcSymbols);
      }

      this.lastPriceUpdate = now;
      return this.priceCache;
      
    } catch (error) {
      console.error('❌ Price fetch failed:', error);
      // Return existing cache or empty map
      return this.priceCache;
    }
  }

  // Get price for a specific symbol
  async getPrice(symbol: string): Promise<number | null> {
    const prices = await this.fetchMarketPrices();
    const marketData = prices.get(symbol);
    return marketData ? marketData.price : null;
  }

  // Fetch trade history for a wallet with pagination support like Hyperliquid
  async fetchTradeHistory(walletAddress: string, limit: number = 100): Promise<TradeHistoryItem[]> {
    try {
      // First, get recent fills
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: "userFills",
          user: walletAddress
        })
      });

      const fills = await response.json();
      
      // If we have fewer fills than requested, try to get more historical data
      let allFills = fills || [];
      
      // For more comprehensive history, we can also fetch with aggregateByTime
      if (allFills.length < limit) {
        try {
          const historicalResponse = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              type: "userFills",
              user: walletAddress,
              aggregateByTime: false // Get individual fills, not aggregated
            })
          });

          const historicalFills = await historicalResponse.json();
          if (historicalFills && historicalFills.length > allFills.length) {
            allFills = historicalFills;
          }
        } catch (error) {
          console.warn('Could not fetch additional historical data:', error);
        }
      }
      
      return allFills
        .map((fill: HyperLiquidFill, index: number) => {
          // Improved order type inference
          let orderType: 'market' | 'limit' = 'limit'; // Default to limit
          
          // Market orders in HyperLiquid typically have IoC timing
          if (fill.tif === 'Ioc' || fill.tif === 'IOC') {
            orderType = 'market';
          }
          // Additional checks for market orders
          else if (fill.dir === 'Close' || fill.liquidation) {
            orderType = 'market';
          }
          // Check if order was immediately filled (characteristic of market orders)
          else if (fill.startPosition === fill.sz) {
            orderType = 'market';
          }
          
          return {
            id: `${fill.oid || fill.tid || index}`,
            timestamp: fill.time || Date.now(),
            symbol: fill.coin || 'Unknown',
            side: fill.side === 'A' ? 'buy' : 'sell',
            quantity: parseFloat(String(fill.sz || '0')),
            price: parseFloat(String(fill.px || '0')),
            value: parseFloat(String(fill.sz || '0')) * parseFloat(String(fill.px || '0')),
            status: 'filled',
            orderId: fill.oid?.toString() || fill.tid?.toString() || `${index}`,
            type: orderType
          };
        })
        .sort((a: TradeHistoryItem, b: TradeHistoryItem) => b.timestamp - a.timestamp)
        .slice(0, limit); // Limit results to prevent UI issues
      
    } catch (error) {
      console.error('Error fetching trade history:', error);
      return [];
    }
  }

  // Fetch open orders for a wallet - SIMPLE VERSION
  async fetchOpenOrders(walletAddress: string): Promise<OpenOrder[]> {
    try {
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: "openOrders",
          user: walletAddress
        })
      });

      const orders = await response.json();
      
      return orders.map((order: HyperLiquidOrder) => ({
        id: order.oid?.toString() || Math.random().toString(),
        symbol: order.coin || 'Unknown',
        side: order.side === 'A' ? 'buy' : 'sell',
        type: 'limit', // Simple: assume all are limit orders
        quantity: Number(order.sz || 0),
        price: Number(order.limitPx || 0),
        filled: Number(order.origSz || 0) - Number(order.sz || 0),
        remaining: Number(order.sz || 0),
        status: 'open',
        timestamp: order.timestamp || Date.now()
      }));
      
    } catch (error) {
      console.error('Error fetching open orders:', error);
      return [];
    }
  }

  // Fetch positions for a wallet
  async fetchPositions(walletAddress: string): Promise<Position[]> {
    try {
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: "clearinghouseState",
          user: walletAddress
        })
      });

      const data = await response.json();
      const positions = data.assetPositions || [];
      
      return positions
        .filter((pos: HyperLiquidPosition) => parseFloat(pos.position?.szi || '0') !== 0)
        .map((pos: HyperLiquidPosition) => {
          const size = parseFloat(pos.position?.szi || '0');
          const entryPrice = parseFloat(pos.position?.entryPx || '0');
          const unrealizedPnl = parseFloat(pos.position?.unrealizedPnl || '0');
          
          return {
            symbol: pos.position?.coin || 'Unknown',
            side: size > 0 ? 'long' : 'short',
            size: Math.abs(size),
            entryPrice,
            markPrice: entryPrice, // TODO: Get actual mark price
            pnl: unrealizedPnl,
            pnlPercentage: entryPrice > 0 ? (unrealizedPnl / (entryPrice * Math.abs(size))) * 100 : 0,
            leverage: 1, // Simple fallback
            margin: parseFloat(pos.position?.marginUsed || '0'),
            timestamp: Date.now()
          };
        });
      
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  }

  // Cancel an order (placeholder for future implementation)
  async cancelOrder(orderId: string, walletAddress: string): Promise<boolean> {
    try {
      // TODO: Implement order cancellation
      console.log('Cancel order not yet implemented:', { orderId, walletAddress });
      return false;
    } catch (error) {
      console.error('Error cancelling order:', error);
      return false;
    }
  }

  // Get account balance
  async getAccountBalance(account: ConnectedAccount): Promise<number> {
    try {
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: "clearinghouseState",
          user: account.publicKey
        })
      });

      const data = await response.json();
      return parseFloat(data.marginSummary?.accountValue || '0');
      
    } catch (error) {
      console.error('Error fetching account balance:', error);
      return 0;
    }
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();
