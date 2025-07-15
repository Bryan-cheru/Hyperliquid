import { useTrading } from '../../../hooks/useTrading';

const Postions = () => {
    const { connectedAccount, positions } = useTrading();

    return (
        // Outer container for the entire Positions component
        <article className="text-xs inter rounded-[8px] text-[#A0A9B4] mr-[23px]">
            
            {/* Header row: scrollable, sticky top bar with column titles */}
            <div className="flex overflow-x-auto no-scrollbar border-b border-[#2A3441] bg-[#151C26] p-[12px_16px_13px_16px] items-center font-medium gap-x-4">
                
                {/* Column header: Coin */}
                <div className="min-w-[70px] text-[10px] flex items-center ml-3">Coin</div>

                {/* Column header: Size */}
                <div className="min-w-[70px] text-[10px] flex items-center">Size</div>

                {/* Column header: Position Value with an icon */}
                <div className="min-w-[120px] text-[10px] flex items-center gap-1">
                    <p>Position Value</p>
                    {/* Downward arrow icon (indicates sortable column maybe) */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M12 12H0V0H12V12Z"/>
                        <path 
                            d="M5.47012 9.52949C5.76309 9.82246 6.23887 9.82246 6.53184 9.52949L11.0318 5.02949C11.3248 4.73652 11.3248 4.26074 11.0318 3.96777C10.7389 3.6748 10.2631 3.6748 9.97012 3.96777L5.9998 7.93809L2.02949 3.97012C1.73652 3.67715 1.26074 3.67715 0.967773 3.97012C0.674805 4.26309 0.674805 4.73887 0.967773 5.03184L5.46777 9.53184L5.47012 9.52949Z" 
                            fill="#A0A9B4" 
                        />
                    </svg>
                </div>

                {/* Column header: Entry Price */}
                <div className="min-w-[90px] text-[10px] flex items-center">Entry Price</div>

                {/* Column header: Mark Price */}
                <div className="min-w-[90px] text-[10px] flex items-center">Mark Price</div>

                {/* Column header: Profit & Loss and Return on Equity */}
                <div className="min-w-[90px] text-[10px] flex items-center">PNL (ROE%)</div>

                {/* Column header: Liquidation Price */}
                <div className="min-w-[90px] text-[10px] flex items-center">Liq. Price</div>

                {/* Column header: Margin */}
                <div className="min-w-[20px] text-[10px] flex items-center">Margin</div>
            </div>

            {/* Dynamic Content: Show positions if connected and have positions */}
            {connectedAccount ? (
                positions.length > 0 ? (
                    <div className="max-h-[588px] overflow-y-auto">
                        {positions.map((position, index) => (
                            <div key={index} className="flex gap-x-4 border-b border-[#2A3441] hover:bg-[#1A1E2A] transition-colors p-[12px_16px_13px_16px] items-center">
                                {/* Coin */}
                                <div className="min-w-[70px] flex items-center ml-3">
                                    <span className="text-white font-medium">{position.symbol}</span>
                                    <span className={`ml-1 text-xs px-1 rounded ${position.side === 'long' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'}`}>
                                        {position.side.toUpperCase()}
                                    </span>
                                </div>

                                {/* Size */}
                                <div className="min-w-[70px] flex items-center">
                                    <span className="text-white">{position.size.toFixed(4)}</span>
                                </div>

                                {/* Position Value */}
                                <div className="min-w-[120px] flex items-center">
                                    <span className="text-white">${(position.size * position.markPrice).toFixed(2)}</span>
                                </div>

                                {/* Entry Price */}
                                <div className="min-w-[90px] flex items-center">
                                    <span className="text-white">${position.entryPrice.toFixed(2)}</span>
                                </div>

                                {/* Mark Price */}
                                <div className="min-w-[90px] flex items-center">
                                    <span className="text-white">${position.markPrice.toFixed(2)}</span>
                                </div>

                                {/* PNL (ROE%) */}
                                <div className="min-w-[90px] flex items-center">
                                    <span className={position.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                                        {position.pnl >= 0 ? '+' : ''}${position.pnl.toFixed(2)} ({position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%)
                                    </span>
                                </div>

                                {/* Liquidation Price */}
                                <div className="min-w-[90px] flex items-center">
                                    <span className="text-gray-400">${(position.entryPrice * 0.8).toFixed(2)}</span>
                                </div>

                                {/* Margin */}
                                <div className="min-w-[20px] flex items-center">
                                    <span className="text-white">${position.margin.toFixed(2)}</span>
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
                        <h1 className="text-[#A0A9B4] text-base mb-3 mt-0.5 text-center">No positions</h1>
                        <p className="text-[#6B7280] text-sm text-center">
                            Open positions will appear here when you start trading
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
                        Connect your master account to view positions and trading data
                    </p>
                </article>
            )}
        </article>
    );
};

export default Postions;
