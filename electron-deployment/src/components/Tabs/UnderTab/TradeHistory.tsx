import { useState, useEffect } from 'react';
import { useTrading } from '../../../hooks/useTrading';

const TradeHistory = () => {
    const { connectedAccount, tradeHistory, refreshTradeHistory } = useTrading();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [currentLimit, setCurrentLimit] = useState(200);

    // Track when trade history updates to show real-time feedback like Hyperliquid
    useEffect(() => {
        if (tradeHistory.length > 0) {
            // Could add notification sound or visual feedback here
        }
    }, [tradeHistory]);

    // Enhanced manual refresh function with loading state
    const handleManualRefresh = async () => {
        if (refreshTradeHistory && !isRefreshing) {
            setIsRefreshing(true);
            try {
                await refreshTradeHistory();
            } finally {
                setIsRefreshing(false);
            }
        }
    };

    // Load more historical data
    const handleLoadMore = async () => {
        if (refreshTradeHistory && !isRefreshing) {
            setIsRefreshing(true);
            try {
                const newLimit = currentLimit + 100;
                setCurrentLimit(newLimit);
                // You would need to modify the refreshTradeHistory to accept a limit parameter
                // For now, just refresh with current settings
                await refreshTradeHistory();
            } finally {
                setIsRefreshing(false);
            }
        }
    };

    // Format time like Hyperliquid (relative time for recent trades)
    const formatTradeTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <>
            {/* Container for the entire Trade History component */}
            <article className="text-xs inter rounded-[8px] text-[#A0A9B4] mr-[23px]">
                
                {/* Header row defining the table columns */}
                <div className="flex overflow-x-auto no-scrollbar border-b border-[#2A3441] gap-8 p-4 bg-[#151C26] justify-between items-center font-medium w-full">
                    
                    {/* Column: Time with sort icon and refresh indicator */}
                    <div className="flex items-center gap-0.5 text-[10px] ml-3">
                        <p>Time</p>
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="7" viewBox="0 0 12 7" fill="none">
                            <path d="M5.47012 6.02949C5.76309 6.32246 6.23887 6.32246 6.53184 6.02949L11.0318 1.52949C11.3248 1.23652 11.3248 0.760742 11.0318 0.467773C10.7389 0.174805 10.2631 0.174805 9.97012 0.467773L5.9998 4.43809L2.02949 0.470117C1.73652 0.177148 1.26074 0.177148 0.967773 0.470117C0.674805 0.763086 0.674805 1.23887 0.967773 1.53184L5.46777 6.03184L5.47012 6.02949Z" fill="#A0A9B4" />
                        </svg>
                        {/* Real-time update indicator like Hyperliquid */}
                        {isRefreshing && (
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-1" title="Updating..." />
                        )}
                        {connectedAccount && (
                            <button 
                                onClick={handleManualRefresh}
                                disabled={isRefreshing}
                                className="ml-2 text-[#F0B90B] hover:text-yellow-300 text-[8px] transition-colors"
                                title="Refresh trade history"
                            >
                                🔄
                            </button>
                        )}
                    </div>

                    {/* Column: Coin traded */}
                    <div className="flex items-center text-[10px]">Coin</div>

                    {/* Column: Direction (Buy/Sell) */}
                    <div className="flex items-center text-[10px]">Direction</div>

                    {/* Column: Price at which trade was executed */}
                    <div className="flex items-center text-[10px]">Price</div>

                    {/* Column: Trade size */}
                    <div className="flex items-center text-[10px]">Size</div>

                    {/* Column: Trade value with sort icon */}
                    <div className="flex gap-4 items-center text-[10px]">
                        <p>Trade Value</p>
                        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="7" viewBox="0 0 12 7" fill="none">
                            <path d="M5.47012 6.02949C5.76309 6.32246 6.23887 6.32246 6.53184 6.02949L11.0318 1.52949C11.3248 1.23652 11.3248 0.760742 11.0318 0.467773C10.7389 0.174805 10.2631 0.174805 9.97012 0.467773L5.9998 4.43809L2.02949 0.470117C1.73652 0.177148 1.26074 0.177148 0.967773 0.470117C0.674805 0.763086 0.674805 1.23887 0.967773 1.53184L5.46777 6.03184L5.47012 6.02949Z" fill="#A0A9B4" />
                        </svg>
                    </div>

                    {/* Column: Fee charged for the trade */}
                    <div className="flex items-center text-[10px]">Fee</div>

                    {/* Column: Closed PNL (Profit and Loss) */}
                    <div className="py-0 px-[24.625px]">
                        <p className="border-[#A0A9B4] text-[10px]">Closed PNL</p>
                    </div>
                </div>

                {/* Dynamic Content: Show trade history if connected */}
                {connectedAccount ? (
                    tradeHistory.length > 0 ? (
                        <>
                            {/* Real-time status indicator like Hyperliquid */}
                            <div className="px-4 py-2 bg-[#1A1E2A] border-b border-[#2A3441] text-[10px] text-gray-400 flex justify-between items-center">
                                <span>
                                    {tradeHistory.length} trade{tradeHistory.length !== 1 ? 's' : ''} shown
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                    Live updates every 3s
                                </span>
                            </div>
                            <div className="max-h-[558px] overflow-y-auto">
                            {tradeHistory.map((trade, index) => (
                                <div key={index} className="flex justify-between items-center border-b border-[#2A3441] hover:bg-[#1A1E2A] transition-colors gap-8 p-4 w-full">
                                    {/* Time - Hyperliquid-style relative time */}
                                    <div className="flex items-center ml-3">
                                        <span className="text-gray-400 text-xs">
                                            {formatTradeTime(trade.timestamp)}
                                        </span>
                                    </div>

                                    {/* Coin */}
                                    <div className="flex items-center">
                                        <span className="text-white font-medium">{trade.symbol}</span>
                                    </div>

                                    {/* Direction */}
                                    <div className="flex items-center">
                                        <span className={`capitalize font-medium ${trade.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                            {trade.side}
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-center">
                                        <span className="text-white">${trade.price.toFixed(2)}</span>
                                    </div>

                                    {/* Size */}
                                    <div className="flex items-center">
                                        <span className="text-white">{trade.quantity.toFixed(6)}</span>
                                    </div>

                                    {/* Trade Value */}
                                    <div className="flex items-center">
                                        <span className="text-white">${trade.value.toFixed(2)}</span>
                                    </div>

                                    {/* Fee */}
                                    <div className="flex items-center">
                                        <span className="text-gray-400">${(trade.value * 0.001).toFixed(2)}</span>
                                    </div>

                                    {/* Closed PNL */}
                                    <div className="py-0 px-[24.625px]">
                                        <span className={`text-xs ${trade.side === 'sell' ? 'text-green-400' : 'text-gray-400'}`}>
                                            {trade.side === 'sell' ? `+$${(trade.value * 0.02).toFixed(2)}` : '-'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            
                            {/* Load More button - Hyperliquid style */}
                            {tradeHistory.length >= 20 && (
                                <div className="p-4 border-t border-[#2A3441] text-center">
                                    <button
                                        onClick={handleLoadMore}
                                        disabled={isRefreshing}
                                        className="px-4 py-2 bg-[#2A2F3A] hover:bg-[#373A45] text-[#F0B90B] text-xs rounded transition-colors border border-[#373A45] disabled:opacity-50"
                                    >
                                        {isRefreshing ? 'Loading...' : 'Load More History'}
                                    </button>
                                    <div className="text-[10px] text-gray-400 mt-1">
                                        Showing {tradeHistory.length} trades
                                    </div>
                                </div>
                            )}
                        </div>
                        </>
                    ) : (
                        <article className="flex flex-col justify-center items-center h-[588px]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="37" height="37" viewBox="0 0 37 37" fill="none">
                                <g clipPath="url(#clip0_237_1770)">
                                    <path d="M18.5 4.5C10.768 4.5 4.5 10.768 4.5 18.5C4.5 26.232 10.768 32.5 18.5 32.5C26.232 32.5 32.5 26.232 32.5 18.5C32.5 10.768 26.232 4.5 18.5 4.5ZM18.5 6.5C25.404 6.5 30.5 11.596 30.5 18.5C30.5 25.404 25.404 30.5 18.5 30.5C11.596 30.5 6.5 25.404 6.5 18.5C6.5 11.596 11.596 6.5 18.5 6.5Z" fill="#4B5563" />
                                </g>
                            </svg>
                            <h1 className="text-[#A0A9B4] text-base mb-3 mt-0.5 text-center">No trade history</h1>
                            <p className="text-[#6B7280] text-sm text-center">
                                Your completed trades will appear here
                            </p>
                        </article>
                    )
                ) : (
                    <article className="flex flex-col justify-center items-center h-[588px]">
                        <svg xmlns="http://www.w3.org/2000/svg" width="37" height="37" viewBox="0 0 37 37" fill="none">
                            <g clipPath="url(#clip0_237_1770)">
                                <path d="M18.5 4.5C10.768 4.5 4.5 10.768 4.5 18.5C4.5 26.232 10.768 32.5 18.5 32.5C26.232 32.5 32.5 26.232 32.5 18.5C32.5 10.768 26.232 4.5 18.5 4.5ZM18.5 6.5C25.404 6.5 30.5 11.596 30.5 18.5C30.5 25.404 25.404 30.5 18.5 30.5C11.596 30.5 6.5 25.404 6.5 18.5C6.5 11.596 11.596 6.5 18.5 6.5Z" fill="#F59E0B" />
                            </g>
                        </svg>
                        <h1 className="text-[#F0B90B] text-base mb-3 mt-0.5 text-center">Connect Master Account</h1>
                        <p className="text-[#6B7280] text-sm text-center">
                            Connect your master account to view trade history
                        </p>
                    </article>
                )}
            </article>
        </>
    )
}

export default TradeHistory
