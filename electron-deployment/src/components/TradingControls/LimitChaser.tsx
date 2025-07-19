import { useState, useEffect } from "react";
import { useTrading } from "../../contexts/TradingContext";

interface Props {
    clicked: boolean;
    setClicked: React.Dispatch<React.SetStateAction<boolean>>;
    onParametersChange?: (params: LimitChaserParams) => void;
}

export interface LimitChaserParams {
    enabled: boolean;
    chaserPrice: number; // Direct price instead of distance
    fillOrCancel: boolean;
    longPriceLimit?: number;
    shortPriceLimit?: number;
    updateInterval: number;
    maxChases: number;
    triggerOnCandleClose: boolean;
    timeframe: string;
    stopTriggerPrice?: number; // Add stop trigger price reference
}

// Enhanced LimitChaser component with basket order integration
const LimitChaser = ({ clicked, setClicked, onParametersChange }: Props) => {
    const { connectedAccount, getPrice } = useTrading();
    const [filled, setFilled] = useState<boolean>(false); // Toggle for "Filled or Cancel"
    const [longPriceLimit, setLongPriceLimit] = useState<number>(0);
    const [shortPriceLimit, setShortPriceLimit] = useState<number>(0);
    const [chaserPrice, setChaserPrice] = useState<string>("0"); // Direct price input
    const [stopTriggerPrice, setStopTriggerPrice] = useState<string>("0"); // Stop trigger price
    const [updateInterval, setUpdateInterval] = useState<number>(30);
    const [maxChases, setMaxChases] = useState<number>(10);
    const [triggerOnCandleClose, setTriggerOnCandleClose] = useState<boolean>(true);
    const [timeframe, setTimeframe] = useState<string>("15m");
    
    // Auto-update price limits based on current market price and sync chaser price with stop trigger
    useEffect(() => {
        if (clicked && connectedAccount?.pair) {
            const symbol = connectedAccount.pair.replace('/USDT', '').replace('/USDC', '');
            const currentPrice = getPrice(symbol);
            
            if (currentPrice && (longPriceLimit === 0 || shortPriceLimit === 0)) {
                // Set initial values based on current price
                setLongPriceLimit(currentPrice * 0.99);  // 1% below for longs
                setShortPriceLimit(currentPrice * 1.01); // 1% above for shorts
            }
            
            // Auto-sync chaser price with stop trigger price if not manually set
            if (parseFloat(stopTriggerPrice) > 0 && parseFloat(chaserPrice) === 0) {
                setChaserPrice(stopTriggerPrice);
            }
        }
    }, [clicked, connectedAccount?.pair, getPrice, longPriceLimit, shortPriceLimit, stopTriggerPrice, chaserPrice]);
    
    // Notify parent component when parameters change
    useEffect(() => {
        if (onParametersChange) {
            const params: LimitChaserParams = {
                enabled: clicked,
                chaserPrice: parseFloat(chaserPrice),
                fillOrCancel: filled,
                longPriceLimit,
                shortPriceLimit,
                updateInterval,
                maxChases,
                triggerOnCandleClose,
                timeframe,
                stopTriggerPrice: parseFloat(stopTriggerPrice)
            };
            onParametersChange(params);
        }
    }, [clicked, chaserPrice, stopTriggerPrice, filled, longPriceLimit, shortPriceLimit, updateInterval, maxChases, triggerOnCandleClose, timeframe, onParametersChange]);

    return (
        <div className="border-t border-[#373A45] pt-4">
            <div className="flex flex-col gap-5">
                
                {/* Toggle Checkbox and Heading */}
                <div className="flex gap-3 items-center -mb-2">
                    <label className="relative cursor-pointer flex">
                        <input
                            type="checkbox"
                            onChange={() => setClicked(prev => !prev)}
                            checked={clicked}
                            className="cursor-pointer peer appearance-none h-[22px] w-[22px] shrink-0 rounded-xs border-2 border-[#787b7f] bg-transparent checked:bg-blue-500 checked:border-blue-500"
                        />
                        {/* Checkmark Icon */}
                        <svg
                            className="absolute left-1 top-1 h-4 w-4 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                    </label>
                    <h1 className="text-xl font-medium text-white">Enhanced Limit Chaser</h1>
                    {clicked && connectedAccount && (
                        <span className="text-xs text-green-400 ml-2">🟢 Active</span>
                    )}
                </div>

                {clicked && (
                    <>
                        {/* Configuration Panel */}
                        <div className="bg-[#24293A] p-4 rounded-lg border border-[#373A45]">
                            <h3 className="text-sm font-medium text-yellow-400 mb-3">⚙️ Chaser Configuration</h3>
                            
                            {/* Update Settings */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs text-gray-300 mb-1">Update Interval (seconds)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="300"
                                        value={updateInterval}
                                        onChange={(e) => setUpdateInterval(parseInt(e.target.value) || 30)}
                                        className="w-full px-2 py-1 bg-[#373A45] border border-[#4A5568] rounded text-white text-xs"
                                        disabled={!clicked}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-300 mb-1">Max Chases</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={maxChases}
                                        onChange={(e) => setMaxChases(parseInt(e.target.value) || 10)}
                                        className="w-full px-2 py-1 bg-[#373A45] border border-[#4A5568] rounded text-white text-xs"
                                        disabled={!clicked}
                                    />
                                </div>
                            </div>
                            
                            {/* Trigger Settings */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs text-gray-300 mb-1">Trigger Timeframe</label>
                                    <select
                                        value={timeframe}
                                        onChange={(e) => setTimeframe(e.target.value)}
                                        className="w-full px-2 py-1 bg-[#373A45] border border-[#4A5568] rounded text-white text-xs"
                                        disabled={!clicked}
                                    >
                                        <option value="1m">1 Minute</option>
                                        <option value="5m">5 Minutes</option>
                                        <option value="15m">15 Minutes</option>
                                        <option value="1h">1 Hour</option>
                                    </select>
                                </div>
                                <div className="flex items-center gap-2 pt-5">
                                    <input
                                        type="checkbox"
                                        checked={triggerOnCandleClose}
                                        onChange={(e) => setTriggerOnCandleClose(e.target.checked)}
                                        className="w-3 h-3"
                                        disabled={!clicked}
                                    />
                                    <label className="text-xs text-gray-300">Candle Close Trigger</label>
                                </div>
                            </div>
                        </div>

                        {/* "Filled or Cancel" toggle and stop trigger + chaser price inputs */}
                        <div className="flex items-center gap-4">
                            <p
                                className={`inter text-xs underline cursor-pointer ${filled ? "text-blue-400" : "text-[#C5C8D0]"}`}
                                onClick={() => setFilled(prev => !prev)}
                            >
                                Filled or Cancel (IOC)
                            </p>
                            
                            {/* Stop Trigger Price Input */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-300">Stop Trigger Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={stopTriggerPrice}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setStopTriggerPrice(val);
                                        // Auto-sync chaser price when stop trigger changes
                                        if (val && !isNaN(parseFloat(val))) {
                                            setChaserPrice(val);
                                        }
                                    }}
                                    disabled={!clicked}
                                    readOnly={!clicked}
                                    placeholder="Trigger $"
                                    className={`w-24 text-xs px-2 py-1 bg-[#373A45] border border-[#4A5568] rounded text-white ${clicked ? "" : "bg-gray-800"}`}
                                />
                            </div>
                            
                            {/* Limit Chaser Price Input */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs text-gray-300">Chaser Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={chaserPrice}
                                    onChange={(e) => setChaserPrice(e.target.value)}
                                    disabled={!clicked}
                                    readOnly={!clicked}
                                    placeholder="Limit $"
                                    className={`w-24 text-xs px-2 py-1 bg-[#373A45] border border-[#4A5568] rounded text-white ${clicked ? "" : "bg-gray-800"}`}
                                />
                                <p className="text-xs text-yellow-400">Auto-synced with trigger</p>
                            </div>
                        </div>

                        {/* Long and Short Price Limit inputs */}
                        <div>
                            <div className="flex gap-5">
                                {/* Long Limit */}
                                <div className="flex flex-col gap-1.5 w-full">
                                    <h2 className="text-white font-medium">Long Price Limit</h2>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={longPriceLimit}
                                        onChange={(e) => setLongPriceLimit(parseFloat(e.target.value) || 0)}
                                        disabled={!clicked}
                                        readOnly={!clicked}
                                        placeholder="Enter Price"
                                        className={`inputs ${clicked ? "" : "bg-gray-800"}`}
                                    />
                                    <p className="text-xs text-gray-400">
                                        {longPriceLimit > 0 && connectedAccount?.pair ? 
                                            `Exit long at $${longPriceLimit.toLocaleString()}` : 
                                            'Auto-calculated from distance'
                                        }
                                    </p>
                                </div>

                                {/* Short Limit */}
                                <div className="flex flex-col gap-1.5 w-full">
                                    <h2 className="text-white font-medium">Short Price Limit</h2>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={shortPriceLimit}
                                        onChange={(e) => setShortPriceLimit(parseFloat(e.target.value) || 0)}
                                        disabled={!clicked}
                                        readOnly={!clicked}
                                        placeholder="Enter Price"
                                        className={`inputs ${clicked ? "" : "bg-gray-800"}`}
                                    />
                                    <p className="text-xs text-gray-400">
                                        {shortPriceLimit > 0 && connectedAccount?.pair ? 
                                            `Exit short at $${shortPriceLimit.toLocaleString()}` : 
                                            'Auto-calculated from distance'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Chaser Strategy Information */}
                        <div className="flex flex-col border-t border-b border-[#373A45] pt-5 pb-10">
                            <h1 className="text-white font-bold mb-2">Limit Chaser Strategy</h1>
                            <div className="bg-[#1A1F2E] p-4 rounded border border-[#373A45]">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                                        <p className="text-xs text-gray-300">
                                            <span className="text-yellow-400 font-medium">Stop Trigger Price:</span> ${parseFloat(stopTriggerPrice) > 0 ? parseFloat(stopTriggerPrice).toLocaleString() : 'Not set'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                        <p className="text-xs text-gray-300">
                                            <span className="text-green-400 font-medium">Chaser Price:</span> ${parseFloat(chaserPrice) > 0 ? parseFloat(chaserPrice).toLocaleString() : 'Not set'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                                        <p className="text-xs text-gray-300">
                                            <span className="text-blue-400 font-medium">Strategy:</span> When price hits trigger → Close with limit order at chaser price
                                        </p>
                                    </div>
                                    {parseFloat(stopTriggerPrice) > 0 && parseFloat(chaserPrice) > 0 && (
                                        <div className="mt-3 p-2 bg-green-900/20 border border-green-500/30 rounded">
                                            <p className="text-xs text-green-400">
                                                ✅ Configuration Ready: Stop at ${parseFloat(stopTriggerPrice).toLocaleString()} → Limit exit at ${parseFloat(chaserPrice).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* <div className="mt-3 p-3 bg-[#1A1F2E] rounded border border-[#373A45]">
                                <p className="text-xs text-gray-300">
                                    <span className="text-yellow-400 font-medium">🎯 Distance Explanation:</span><br/>
                                    The limit chaser will place orders at {manualDistance}% away from the current market price.
                                    For longs: sell {manualDistance}% above market. For shorts: buy {manualDistance}% below market.
                                    Orders update every {updateInterval} seconds, maximum {maxChases} times.
                                </p>
                            </div> */}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LimitChaser;
