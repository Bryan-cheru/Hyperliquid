import * as Slider from "@radix-ui/react-slider";
import { useState, useEffect } from "react";
import { basketOrderManager } from "../../utils/basketOrderManager";
import { useTrading } from "../../contexts/TradingContext";

interface Props {
    clicked: boolean;
    setClicked: React.Dispatch<React.SetStateAction<boolean>>;
    onParametersChange?: (params: LimitChaserParams) => void;
}

export interface LimitChaserParams {
    enabled: boolean;
    distance: number;
    distanceType: 'percentage' | 'absolute';
    fillOrCancel: boolean;
    longPriceLimit?: number;
    shortPriceLimit?: number;
    updateInterval: number;
    maxChases: number;
    triggerOnCandleClose: boolean;
    timeframe: string;
}

// Enhanced LimitChaser component with basket order integration
const LimitChaser = ({ clicked, setClicked, onParametersChange }: Props) => {
    const { connectedAccount, getPrice } = useTrading();
    const [value, setValue] = useState<number[]>([1]); // Distance slider (0–5%)
    const [filled, setFilled] = useState<boolean>(false); // Toggle for "Filled or Cancel"
    const [longPriceLimit, setLongPriceLimit] = useState<number>(0);
    const [shortPriceLimit, setShortPriceLimit] = useState<number>(0);
    const [manualDistance, setManualDistance] = useState<string>("0.01");
    const [updateInterval, setUpdateInterval] = useState<number>(30);
    const [maxChases, setMaxChases] = useState<number>(10);
    const [triggerOnCandleClose, setTriggerOnCandleClose] = useState<boolean>(true);
    const [timeframe, setTimeframe] = useState<string>("15m");
    
    // Auto-update price limits based on current market price
    useEffect(() => {
        if (clicked && connectedAccount?.pair) {
            const symbol = connectedAccount.pair.replace('/USDT', '').replace('/USDC', '');
            const currentPrice = getPrice(symbol);
            
            if (currentPrice && (longPriceLimit === 0 || shortPriceLimit === 0)) {
                const distance = value[0] / 100; // Convert percentage to decimal
                setLongPriceLimit(currentPrice * (1 + distance));
                setShortPriceLimit(currentPrice * (1 - distance));
            }
        }
    }, [clicked, connectedAccount?.pair, value, getPrice, longPriceLimit, shortPriceLimit]);
    
    // Notify parent component when parameters change
    useEffect(() => {
        if (onParametersChange) {
            const params: LimitChaserParams = {
                enabled: clicked,
                distance: parseFloat(manualDistance),
                distanceType: 'percentage',
                fillOrCancel: filled,
                longPriceLimit,
                shortPriceLimit,
                updateInterval,
                maxChases,
                triggerOnCandleClose,
                timeframe
            };
            onParametersChange(params);
        }
    }, [clicked, manualDistance, filled, longPriceLimit, shortPriceLimit, updateInterval, maxChases, triggerOnCandleClose, timeframe, onParametersChange]);

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

                        {/* "Filled or Cancel" toggle and manual distance input */}
                        <div className="flex items-center gap-24">
                            <p
                                className={`inter text-xs underline cursor-pointer w-60 ${filled ? "text-blue-400" : "text-[#C5C8D0]"}`}
                                onClick={() => setFilled(prev => !prev)}
                            >
                                Filled or Cancel (IOC)
                            </p>
                            {/* Manual distance percentage input */}
                            <input
                                type="number"
                                step="0.001"
                                min="0"
                                max="5"
                                value={manualDistance}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setManualDistance(val);
                                    if (val && !isNaN(parseFloat(val))) {
                                        setValue([parseFloat(val) * 100]); // Convert to slider value
                                    }
                                }}
                                disabled={!clicked}
                                readOnly={!clicked}
                                placeholder="Distance %"
                                className={`inputs ${clicked ? "" : "bg-gray-800"}`}
                            />
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

                        {/* Price Distance Section */}
                        <div className="flex flex-col border-t border-b border-[#373A45] pt-5 pb-10">
                            <h1 className="text-white font-bold mb-2">Price Distance Configuration</h1>
                            <div className="flex gap-4 items-center">
                                
                                {/* Slider with custom styling */}
                                <div className="w-full relative">
                                    <Slider.Root
                                        value={value}
                                        disabled={!clicked}
                                        onValueChange={(newValue) => {
                                            setValue(newValue);
                                            setManualDistance((newValue[0] / 100).toFixed(3));
                                        }}
                                        min={0}
                                        max={500} // 5% max
                                        step={1}
                                        className="relative flex items-center w-full h-5"
                                    >
                                        <Slider.Track className={`relative grow rounded-full h-2 ${!clicked ? "bg-gray-700" : "bg-[#E5E5E5]"}`}>
                                            <Slider.Range className={`absolute h-full rounded-full ${!clicked ? "bg-gray-700" : "bg-yellow-400"}`} />
                                        </Slider.Track>

                                        {/* Custom Thumb SVG */}
                                        <Slider.Thumb>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="outline-none" width="18" height="18" viewBox="0 0 16 16" fill="none">
                                                <path
                                                    d="M8 15.4998C12.1421 15.4998 15.5 12.1419 15.5 7.99986C15.5 3.8577 12.1421 0.499847 8 0.499847C3.85788 0.499847 0.5 3.8577 0.5 7.99986C0.5 12.1419 3.85788 15.4998 8 15.4998Z"
                                                    fill={!clicked ? "#6B7280" : "#F0B90B"}
                                                />
                                            </svg>
                                        </Slider.Thumb>
                                    </Slider.Root>

                                    {/* Slider min/max labels */}
                                    <div className="absolute left-0 right-0 top-full mt-1 flex justify-between text-xs text-white px-[2px]">
                                        <p className="text-base font-bold">0%</p>
                                        <p className="text-base font-bold">5%</p>
                                    </div>
                                </div>

                                <p className="text-sm text-[rgba(255,255,255,0.70)]">or</p>

                                {/* Current distance display */}
                                <div className="min-w-[104px] text-center">
                                    <p className="text-xs text-gray-400">Current Distance</p>
                                    <p className="text-sm font-bold text-yellow-400">{manualDistance}%</p>
                                </div>
                            </div>
                            
                            {/* Distance explanation */}
                            <div className="mt-3 p-3 bg-[#1A1F2E] rounded border border-[#373A45]">
                                <p className="text-xs text-gray-300">
                                    <span className="text-yellow-400 font-medium">🎯 Distance Explanation:</span><br/>
                                    The limit chaser will place orders at {manualDistance}% away from the current market price.
                                    For longs: sell {manualDistance}% above market. For shorts: buy {manualDistance}% below market.
                                    Orders update every {updateInterval} seconds, maximum {maxChases} times.
                                </p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default LimitChaser;
