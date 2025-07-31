// Trading Performance Widget with MongoDB Analytics
import { useState, useEffect } from 'react';
import { tradingDataService } from '../../../services/tradingDataService';
import { useTrading } from '../../../contexts/TradingContext';

interface TradingStats {
  totalTrades: number;
  winRate: number;
  totalPnl: number;
  totalVolume: number;
  profitFactor: number;
}

const TradingStatsWidget = () => {
  const { connectedAccount } = useTrading();
  const [stats, setStats] = useState<TradingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeframe, setTimeframe] = useState<number>(7); // Default: last 7 days

  useEffect(() => {
    const loadTradingStats = async () => {
      if (!connectedAccount?.accountId) return;
      
      setLoading(true);
      try {
        const userId = `user_${connectedAccount.accountId}`;
        const statistics = await tradingDataService.getTradingStatistics(userId, connectedAccount.accountId, timeframe);
        setStats(statistics);
      } catch (error) {
        console.error('Error loading trading stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTradingStats();
    
    // Refresh stats every 30 seconds
    const interval = setInterval(loadTradingStats, 30000);
    return () => clearInterval(interval);
  }, [connectedAccount, timeframe]);

  if (loading) {
    return (
      <div className="bg-gray-900 p-4 rounded-lg">
        <div className="animate-pulse">Loading stats...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-gray-900 p-4 rounded-lg">
        <p className="text-gray-400">No trading data available</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-medium">📊 Trading Performance</h3>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(Number(e.target.value))}
          className="bg-gray-800 text-white text-sm rounded px-2 py-1 border border-gray-600"
        >
          <option value={1}>24H</option>
          <option value={7}>7D</option>
          <option value={30}>30D</option>
          <option value={90}>90D</option>
        </select>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-gray-400 text-xs">Total Trades</div>
          <div className="text-white font-bold">{stats.totalTrades}</div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-gray-400 text-xs">Win Rate</div>
          <div className={`font-bold ${stats.winRate >= 50 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.winRate.toFixed(1)}%
          </div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-gray-400 text-xs">Total P&L</div>
          <div className={`font-bold ${stats.totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
          </div>
        </div>
        
        <div className="bg-gray-800 p-3 rounded">
          <div className="text-gray-400 text-xs">Volume</div>
          <div className="text-white font-bold">
            ${(stats.totalVolume / 1000).toFixed(1)}K
          </div>
        </div>
      </div>
      
      {stats.profitFactor > 0 && (
        <div className="mt-3 bg-gray-800 p-3 rounded">
          <div className="text-gray-400 text-xs">Profit Factor</div>
          <div className={`font-bold ${stats.profitFactor >= 1 ? 'text-green-400' : 'text-red-400'}`}>
            {stats.profitFactor.toFixed(2)}
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingStatsWidget;
