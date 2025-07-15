import { useTrading } from '../../../hooks/useTrading';

const OrderHistory = () => {
    const { connectedAccount, tradeHistory } = useTrading();

    // Create order history from trade history (assuming orders that resulted in trades)
    const orderHistory = tradeHistory.map(trade => ({
        id: trade.id,
        timestamp: trade.timestamp,
        type: 'limit' as const,
        symbol: trade.symbol,
        side: trade.side,
        size: trade.quantity,
        filledSize: trade.quantity, // Fully filled since it's in trade history
        orderValue: trade.value,
        price: trade.price,
        reduceOnly: false,
        status: trade.status
    }));

    return (
        <>
            {/* Outer container with base text styling and padding */}
            <article className="text-xs inter rounded-[8px] text-[#A0A9B4] mr-[23px]">
                
                {/* Header row for order history table columns */}
                <div className="text-center flex overflow-x-auto no-scrollbar border-b border-[#2A3441] gap-7 p-4 bg-[#151C26] justify-between items-center font-medium">
                    
                    {/* Time column with sort icon */}
                    <div className="flex gap-1 items-center text-[10px]">
                        <p>Time</p>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="7" viewBox="0 0 12 7" fill="none">
                            <path d="M5.47012 5.92988C5.76309 6.22285 6.23887 6.22285 6.53184 5.92988L11.0318 1.42988C11.3248 1.13691 11.3248 0.661133 11.0318 0.368164C10.7389 0.0751953 10.2631 0.0751953 9.97012 0.368164L5.9998 4.33848L2.02949 0.370508C1.73652 0.0775388 1.26074 0.0775388 0.967773 0.370508C0.674805 0.663476 0.674805 1.13926 0.967773 1.43223L5.46777 5.93223L5.47012 5.92988Z" fill="#A0A9B4" />
                        </svg>
                    </div>

                    {/* Other column headers */}
                    <div className="flex items-center text-[10px] ml-2">Type</div>
                    <div className="flex items-center text-[10px]">Coin</div>
                    <div className="flex items-center text-[10px]">Direction</div>
                    <div className="flex items-center text-[10px]">Size</div>
                    <div className="flex items-center text-[10px]">Filled Size</div>
                    <div className="flex items-center text-[10px]">Order Value</div>
                    <div className="flex items-center text-[10px]">Price</div>
                    <div className="flex items-center text-[10px]">Reduce Only</div>
                </div>

                {/* Dynamic Content: Show order history if connected */}
                {connectedAccount ? (
                    orderHistory.length > 0 ? (
                        <div className="max-h-[588px] overflow-y-auto">
                            {orderHistory.map((order, index) => (
                                <div key={index} className="flex justify-between items-center border-b border-[#2A3441] hover:bg-[#1A1E2A] transition-colors gap-7 p-4">
                                    {/* Time */}
                                    <div className="flex items-center">
                                        <span className="text-gray-400 text-xs">
                                            {new Date(order.timestamp).toLocaleDateString()} {new Date(order.timestamp).toLocaleTimeString()}
                                        </span>
                                    </div>

                                    {/* Type */}
                                    <div className="flex items-center ml-2">
                                        <span className="text-white capitalize">{order.type}</span>
                                    </div>

                                    {/* Coin */}
                                    <div className="flex items-center">
                                        <span className="text-white font-medium">{order.symbol}</span>
                                    </div>

                                    {/* Direction */}
                                    <div className="flex items-center">
                                        <span className={`capitalize font-medium ${order.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                            {order.side}
                                        </span>
                                    </div>

                                    {/* Size */}
                                    <div className="flex items-center">
                                        <span className="text-white">{order.size.toFixed(6)}</span>
                                    </div>

                                    {/* Filled Size */}
                                    <div className="flex items-center">
                                        <span className="text-green-400">{order.filledSize.toFixed(6)}</span>
                                    </div>

                                    {/* Order Value */}
                                    <div className="flex items-center">
                                        <span className="text-white">${order.orderValue.toFixed(2)}</span>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-center">
                                        <span className="text-white">${order.price.toFixed(2)}</span>
                                    </div>

                                    {/* Reduce Only */}
                                    <div className="flex items-center">
                                        <span className="text-gray-400">{order.reduceOnly ? 'Yes' : 'No'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <article className="flex flex-col justify-center items-center h-[588px]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="37" height="37" viewBox="0 0 37 37" fill="none">
                                <g clipPath="url(#clip0_237_1770)">
                                    <path d="M18.5 4.5C10.768 4.5 4.5 10.768 4.5 18.5C4.5 26.232 10.768 32.5 18.5 32.5C26.232 32.5 32.5 26.232 32.5 18.5C32.5 10.768 26.232 4.5 18.5 4.5ZM18.5 6.5C25.404 6.5 30.5 11.596 30.5 18.5C30.5 25.404 25.404 30.5 18.5 30.5C11.596 30.5 6.5 25.404 6.5 18.5C6.5 11.596 11.596 6.5 18.5 6.5Z" fill="#4B5563" />
                                </g>
                            </svg>
                            <h1 className="text-[#A0A9B4] text-base mb-3 mt-0.5 text-center">No order history</h1>
                            <p className="text-[#6B7280] text-sm text-center">
                                Your completed orders will appear here
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
                            Connect your master account to view order history
                        </p>
                    </article>
                )}
            </article>
        </>
    )
}

export default OrderHistory
