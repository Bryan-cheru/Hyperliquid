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
  type: 'market' | 'limit' | 'conditional'; // Add conditional order type tracking
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

  // Fetch current market prices for all assets - IMPROVED VERSION
  async fetchMarketPrices(): Promise<Map<string, MarketPrice>> {
    const now = Date.now();
    
    // Use cache if fresh (increase cache time to 10 seconds to reduce API calls)
    if (now - this.lastPriceUpdate < 10000 && this.priceCache.size > 0) {
            return this.priceCache;
    }

    try {
            
      // Add small delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // EXPERIMENTAL: Try different API endpoints to get correct market prices
            
      // Test 1: Current allMids approach
      const [pricesResponse1, metaResponse] = await Promise.all([
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

      // Test 2: Try individual coin candle data for major assets
      const majorCoins = ['BTC', 'ETH', 'SOL'];
      const candlePromises = majorCoins.map(coin => 
        fetch('https://api.hyperliquid.xyz/info', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: "candleSnapshot",
            req: {
              coin: coin,
              interval: "1m",
              startTime: Date.now() - 60000,
              endTime: Date.now()
            }
          })
        }).then(res => res.json()).catch(() => null)
      );

      const [prices1, meta, ...candleResults] = await Promise.all([
        pricesResponse1.json(),
        metaResponse.json(),
        ...candlePromises
      ]);

                              
      // Show samples from both approaches
      if (Array.isArray(prices1)) {
              } else {
              }

      // Extract real prices from candle data
      const realPrices = new Map();
      candleResults.forEach((candleData, i) => {
        const coin = majorCoins[i];
                
        if (candleData && Array.isArray(candleData) && candleData.length > 0) {
          const latestCandle = candleData[candleData.length - 1];
                    
          if (latestCandle?.c) {
            const price = parseFloat(latestCandle.c);
                        
            if (price > 0) {
              realPrices.set(coin, price);
                          }
          }
        } else {
                  }
      });

      // Use prices1 for now but we'll override BTC with real data
      const prices = prices1;

                              
      // Show raw data structure
      if (Array.isArray(prices)) {
              } else {
              }
      
      this.priceCache.clear();

      // Enhanced validation and mapping - handle both array and object formats
      if (meta?.universe && Array.isArray(meta.universe)) {
                
        let btcFound = false;
        
        // Handle object format (current API structure with @1, @2, etc. keys)
        if (typeof prices === 'object' && !Array.isArray(prices)) {
                    
          // Debug: Log first 10 assets and their prices
                    meta.universe.slice(0, 10).forEach((asset: any, index: number) => {
            const priceKey = `@${index + 1}`;
            const priceStr = prices[priceKey];
                      });
          
          meta.universe.forEach((asset: any, index: number) => {
            const priceKey = `@${index + 1}`;
            const priceStr = prices[priceKey];
            
            if (asset?.name && priceStr && priceStr !== "0") {
              let price = parseFloat(priceStr);
              
              // 🎯 CRITICAL FIX: Override with real price from candle data for major coins
              const realPrice = realPrices.get(asset.name);
              if (realPrice && realPrice > 1000) {
                price = realPrice;
                              }
              
              if (!isNaN(price) && price > 0) {
                // Enhanced symbol mapping for BTC variations
                let symbols = [asset.name];
                if (asset.name === 'BTC') {
                  symbols = ['BTC', 'BTC-USD', 'BTCUSD', 'BTC/USD'];
                  btcFound = true;
                                                    }
                
                // Store under multiple symbol variations
                symbols.forEach(symbol => {
                  this.priceCache.set(symbol, {
                    symbol: symbol,
                    price,
                    change24h: 0,
                    volume24h: 0,
                    lastUpdate: now
                  });
                });
              }
            }
          });
        }
        // Handle array format (fallback for legacy API structure)
        else if (Array.isArray(prices)) {
                    prices.forEach((priceStr, index) => {
            const asset = meta.universe[index];
            if (asset?.name && priceStr && priceStr !== "0") {
              const price = parseFloat(priceStr);
              if (!isNaN(price) && price > 0) {
                
                // Enhanced symbol mapping for BTC variations
                let symbols = [asset.name];
                if (asset.name === 'BTC') {
                  symbols = ['BTC', 'BTC-USD', 'BTCUSD', 'BTC/USD'];
                  btcFound = true;
                                  }
                
                // Store under multiple symbol variations
                symbols.forEach(symbol => {
                  this.priceCache.set(symbol, {
                    symbol: symbol,
                    price,
                    change24h: 0,
                    volume24h: 0,
                    lastUpdate: now
                  });
                });
              }
            }
          });
        }

        if (!btcFound) {
          console.warn('⚠️ BTC not found in price data. Available assets:', 
            meta.universe.slice(0, 10).map((asset: { name?: string }) => asset?.name).join(', '));
          
          // Add fallback BTC price
          const fallbackPrice = 97000;
          ['BTC', 'BTC-USD', 'BTCUSD', 'BTC/USD'].forEach(symbol => {
            this.priceCache.set(symbol, {
              symbol: symbol,
              price: fallbackPrice,
              change24h: 0,
              volume24h: 0,
              lastUpdate: now
            });
          });
                  }

                        
      } else {
        console.error('❌ Invalid price data structure:', { 
          pricesIsArray: Array.isArray(prices), 
          metaHasUniverse: !!meta?.universe,
          pricesLength: prices?.length,
          universeLength: meta?.universe?.length
        });
        
        // Always provide fallback BTC data even when API structure is unexpected
        const fallbackPrice = 97000;
        ['BTC', 'BTC-USD', 'BTCUSD', 'BTC/USD'].forEach(symbol => {
          this.priceCache.set(symbol, {
            symbol: symbol,
            price: fallbackPrice,
            change24h: 0,
            volume24h: 0,
            lastUpdate: now
          });
        });
              }

      this.lastPriceUpdate = now;
      return this.priceCache;
      
    } catch (error) {
      console.error('❌ Price fetch failed:', error);
      
      // If we have stale cache data, use it
      if (this.priceCache.size > 0) {
                return this.priceCache;
      }
      
      // As fallback, add some dummy BTC data to prevent errors
            this.priceCache.set('BTC', {
        symbol: 'BTC',
        price: 97000, // Reasonable current BTC price
        change24h: 0,
        volume24h: 0,
        lastUpdate: now
      });
      this.priceCache.set('BTC-USD', {
        symbol: 'BTC-USD',
        price: 97000,
        change24h: 0,
        volume24h: 0,
        lastUpdate: now
      });
      
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
      // Add delay to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: "clearinghouseState",
          user: walletAddress
        })
      });

      if (!response.ok) {
        console.error(`Failed to fetch positions: ${response.status} ${response.statusText}`);
        return [];
      }

      const data = await response.json();
      if (!data || !data.assetPositions) {
        console.warn('No position data received from API');
        return [];
      }
      
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
