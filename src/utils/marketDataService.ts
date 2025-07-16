// Market data and trading history utilities
import type { ConnectedAccount } from "../contexts/TradingContext";

export interface MarketPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  lastUpdate: number;
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

  // Fetch current market prices for all assets
  async fetchMarketPrices(): Promise<Map<string, MarketPrice>> {
    const now = Date.now();
    
    if (now - this.lastPriceUpdate < this.PRICE_CACHE_MS && this.priceCache.size > 0) {
      return this.priceCache;
    }

    try {
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: "allMids" })
      });

      const prices = await response.json();
      
      // Get asset metadata for symbol names
      const metaResponse = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: "meta" })
      });

      const meta = await metaResponse.json();
      
      // Clear cache and update with fresh data
      this.priceCache.clear();
      
      // Handle different response formats from Hyperliquid API
      if (Array.isArray(prices) && Array.isArray(meta?.universe)) {
        prices.forEach((price: string, index: number) => {
          if (meta.universe[index] && price) {
            const symbol = meta.universe[index].name;
            this.priceCache.set(symbol, {
              symbol,
              price: parseFloat(price),
              change24h: 0, // TODO: Get 24h change data
              volume24h: 0, // TODO: Get volume data
              lastUpdate: now
            });
          }
        });
      } else {
        // Fallback: set some default prices if API format is unexpected
        console.warn('Unexpected API response format for market prices:', prices);
        if (meta?.universe && Array.isArray(meta.universe)) {
          meta.universe.forEach((asset: any, index: number) => {
            this.priceCache.set(asset.name, {
              symbol: asset.name,
              price: asset.name === 'BTC' ? 97000 : 3500, // Default fallback prices
              change24h: 0,
              volume24h: 0,
              lastUpdate: now
            });
          });
        }
      }

      this.lastPriceUpdate = now;
      return this.priceCache;
      
    } catch (error) {
      console.error('Error fetching market prices:', error);
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
        .map((fill: any, index: number) => {
          // Debug log the fill data to understand HyperLiquid's structure
          console.log('🔍 Trade fill data:', fill);
          
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
          
          console.log('🔍 Inferred order type:', orderType, 'for order ID:', fill.oid);
          
          return {
            id: `${fill.oid || fill.tid || index}`,
            timestamp: fill.time || Date.now(),
            symbol: fill.coin || 'Unknown',
            side: fill.side === 'A' ? 'buy' : 'sell',
            quantity: parseFloat(fill.sz || '0'),
            price: parseFloat(fill.px || '0'),
            value: parseFloat(fill.sz || '0') * parseFloat(fill.px || '0'),
            status: 'filled',
            orderId: fill.oid?.toString() || fill.tid?.toString() || `${index}`,
            type: orderType
          };
        })
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, limit); // Limit results to prevent UI issues
      
    } catch (error) {
      console.error('Error fetching trade history:', error);
      return [];
    }
  }

  // Fetch open orders for a wallet
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
      
      return orders.map((order: any) => ({
        id: order.oid?.toString() || Math.random().toString(),
        symbol: order.coin || 'Unknown',
        side: order.side === 'A' ? 'buy' : 'sell',
        type: order.orderType || 'limit',
        quantity: parseFloat(order.sz || '0'),
        price: parseFloat(order.limitPx || '0'),
        filled: parseFloat(order.origSz || '0') - parseFloat(order.sz || '0'),
        remaining: parseFloat(order.sz || '0'),
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
        .filter((pos: any) => parseFloat(pos.position.szi || '0') !== 0)
        .map((pos: any) => {
          const size = parseFloat(pos.position.szi || '0');
          const entryPrice = parseFloat(pos.position.entryPx || '0');
          const unrealizedPnl = parseFloat(pos.position.unrealizedPnl || '0');
          
          return {
            symbol: pos.position.coin || 'Unknown',
            side: size > 0 ? 'long' : 'short',
            size: Math.abs(size),
            entryPrice,
            markPrice: entryPrice, // TODO: Get actual mark price
            pnl: unrealizedPnl,
            pnlPercentage: entryPrice > 0 ? (unrealizedPnl / (entryPrice * Math.abs(size))) * 100 : 0,
            leverage: parseFloat(pos.position.leverage || '1'),
            margin: parseFloat(pos.position.marginUsed || '0'),
            timestamp: Date.now()
          };
        });
      
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  }

  // Cancel an order (placeholder for future implementation)
  async cancelOrder(orderId: string, walletAddress: string, privateKey: string): Promise<boolean> {
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
