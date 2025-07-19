import { useTrading } from '../../../hooks/useTrading';

const OpenOrders = () => {
    const { connectedAccount, openOrders } = useTrading();

    return (
        <>
            {/* Outer container with base text styling and padding */}
            <article className="text-xs inter rounded-[8px] text-[#A0A9B4] mr-[23px]">
                
                {/* Header row for table headings */}
                <div className="text-center flex overflow-x-auto no-scrollbar border-b items-center border-[#2A3441] p-[12px_24px_13px_24px] gap-7 bg-[#151C26] justify-between  font-medium">
                    
                    {/* Column headers */}
                    <div className="flex items-center text-[10px] ml-4">Time</div>
                    <div className="flex items-center text-[10px]">Type</div>
                    <div className="flex items-center text-[10px]">Coin</div>
                    <div className="flex items-center text-[10px]">Direction</div>
                    <div className="flex items-center text-[10px]">Size</div>
                    <div className="flex items-center text-[10px]">Orignial Size</div>

                    {/* Order Value column with down arrow icon */}
                    <div className="flex items-center gap-1 text-[10px]">
                        <p>Order Value</p>
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
                            <path d="M12.5303 12.4004H0.530273V0.400391H12.5303V12.4004Z" />
                            <path d="M6.00039 9.92988C6.29336 10.2229 6.76914 10.2229 7.06211 9.92988L11.5621 5.42988C11.8551 5.13691 11.8551 4.66113 11.5621 4.36816C11.2691 4.0752 10.7934 4.0752 10.5004 4.36816L6.53008 8.33848L2.55977 4.37051C2.2668 4.07754 1.79102 4.07754 1.49805 4.37051C1.20508 4.66348 1.20508 5.13926 1.49805 5.43223L5.99805 9.93223L6.00039 9.92988Z" fill="#A0A9B4" />
                        </svg>
                    </div>

                    {/* Price column */}
                    <div className="flex items-center mr-7 text-[10px]">Price</div>
                </div>

                {/* Dynamic Content: Show open orders if connected */}
                {connectedAccount ? (
                    openOrders.length > 0 ? (
                        <div className="max-h-[588px] overflow-y-auto">
                            {openOrders.map((order, index) => (
                                <div key={index} className="flex justify-between items-center border-b border-[#2A3441] hover:bg-[#1A1E2A] transition-colors p-[12px_24px_13px_24px] gap-7">
                                    {/* Time */}
                                    <div className="flex items-center ml-4">
                                        <span className="text-gray-400">{new Date(order.timestamp).toLocaleTimeString()}</span>
                                    </div>

                                    {/* Type */}
                                    <div className="flex items-center">
                                        <span className="text-white capitalize">{order.type}</span>
                                    </div>

                                    {/* Coin */}
                                    <div className="flex items-center">
                                        <span className="text-white font-medium">{order.symbol}</span>
                                    </div>

                                    {/* Direction */}
                                    <div className="flex items-center">
                                        <span className={`capitalize ${order.side === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                                            {order.side}
                                        </span>
                                    </div>

                                    {/* Size */}
                                    <div className="flex items-center">
                                        <span className="text-white">{order.remaining.toFixed(4)}</span>
                                    </div>

                                    {/* Original Size */}
                                    <div className="flex items-center">
                                        <span className="text-gray-400">{order.quantity.toFixed(4)}</span>
                                    </div>

                                    {/* Order Value */}
                                    <div className="flex items-center">
                                        <span className="text-white">${((order.price || 0) * order.remaining).toFixed(2)}</span>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-center mr-7">
                                        <span className="text-white">${(order.price || 0).toFixed(2)}</span>
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
                            <h1 className="text-[#A0A9B4] text-base mb-3 mt-0.5 text-center">No open orders</h1>
                            <p className="text-[#6B7280] text-sm text-center">
                                Your active orders will appear here when you place them
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
                            Connect your master account to view open orders
                        </p>
                    </article>
                )}
            </article>
        </>
    )
}

export default OpenOrders
