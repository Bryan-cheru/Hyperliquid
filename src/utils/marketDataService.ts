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
  pnlPercent: number;
  margin: number;
  leverage: number;
}

class MarketDataService {
  private priceCache = new Map<string, MarketPrice>();
  private lastPriceUpdate = 0;
  private readonly PRICE_CACHE_MS = 5000; // Cache prices for 5 seconds

  // Fetch current market prices for all symbols
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
      
      prices.forEach((price: string, index: number) => {
        if (meta.universe[index]) {
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

  // Fetch trade history for a wallet
  async fetchTradeHistory(walletAddress: string): Promise<TradeHistoryItem[]> {
    try {
      const response = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: "userFills",
          user: walletAddress
        })
      });

      const fills = await response.json();
      
      return fills.map((fill: any, index: number) => ({
        id: `${fill.oid || index}`,
        timestamp: fill.time || Date.now(),
        symbol: fill.coin || 'Unknown',
        side: fill.side === 'A' ? 'buy' : 'sell',
        quantity: parseFloat(fill.sz || '0'),
        price: parseFloat(fill.px || '0'),
        value: parseFloat(fill.sz || '0') * parseFloat(fill.px || '0'),
        status: 'filled',
        orderId: fill.oid?.toString() || `${index}`
      })).sort((a, b) => b.timestamp - a.timestamp);
      
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
        side: order.side === 'B' ? 'buy' : 'sell',
        type: order.orderType === 'limit' ? 'limit' : 'market',
        quantity: parseFloat(order.sz || '0'),
        price: parseFloat(order.limitPx || '0'),
        filled: 0, // TODO: Calculate filled amount
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
      
      if (!data.assetPositions) return [];
      
      return data.assetPositions
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
            markPrice: entryPrice, // TODO: Get current mark price
            pnl: unrealizedPnl,
            pnlPercent: entryPrice > 0 ? (unrealizedPnl / (entryPrice * Math.abs(size))) * 100 : 0,
            margin: parseFloat(pos.position.marginUsed || '0'),
            leverage: parseFloat(pos.position.leverage?.value || '1')
          };
        });
      
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  }

  // Cancel an order
  async cancelOrder(orderId: string, walletAddress: string, privateKey: string): Promise<boolean> {
    try {
      // TODO: Implement order cancellation using HyperLiquid API
      console.log('Cancelling order:', orderId, 'for wallet:', walletAddress);
      return true;
    } catch (error) {
      console.error('Error cancelling order:', error);
      return false;
    }
  }
}

export const marketDataService = new MarketDataService();
