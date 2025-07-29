import { useState, useEffect } from "react";
import * as Slider from "@radix-ui/react-slider";
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
    // Add distance-based parameters
    distance: number; // Distance value
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
    const [timeframe, setTimeframe] = useState<string>("1000ms");
    
    // Add distance-based state variables
    const [distance, setDistance] = useState<number>(1.0); // Default 1% distance
    
    // Auto-calculate default take profit levels when position is created
    useEffect(() => {
        // Remove auto basket creation logic - keep limit chaser focused
    }, [clicked, connectedAccount?.pair, getPrice]);
    
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
                stopTriggerPrice: parseFloat(stopTriggerPrice),
                distance
            };
            onParametersChange(params);
        }
    }, [clicked, chaserPrice, stopTriggerPrice, filled, longPriceLimit, shortPriceLimit, updateInterval, maxChases, triggerOnCandleClose, timeframe, distance, onParametersChange]);

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
                        {/* Simple Configuration Panel */}
                        <div className="mb-4">
                            {/* Timeframe and Update Interval */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Trigger Timeframe (Milliseconds)</label>
                                    <select
                                        value={timeframe}
                                        onChange={(e) => setTimeframe(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-sm"
                                        disabled={!clicked}
                                    >
                                        <option value="100ms">100 Milliseconds</option>
                                        <option value="250ms">250 Milliseconds</option>
                                        <option value="500ms">500 Milliseconds</option>
                                        <option value="1000ms">1 Second (1000ms)</option>
                                        <option value="2000ms">2 Seconds (2000ms)</option>
                                        <option value="5000ms">5 Seconds (5000ms)</option>
                                        <option value="10000ms">10 Seconds (10000ms)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Update Interval (seconds)</label>
                                    <input
                                        type="number"
                                        min="5"
                                        max="300"
                                        value={updateInterval}
                                        onChange={(e) => setUpdateInterval(parseInt(e.target.value) || 30)}
                                        disabled={!clicked}
                                        placeholder="Update Interval"
                                        className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                    />
                                </div>
                            </div>

                            {/* Max Chases and Candle Close Trigger */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Max Chases (≤100)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={maxChases}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value) || 10;
                                            // Validate max chases should not exceed 100
                                            if (value > 100) {
                                                setMaxChases(100);
                                            } else if (value < 1) {
                                                setMaxChases(1);
                                            } else {
                                                setMaxChases(value);
                                            }
                                        }}
                                        disabled={!clicked}
                                        placeholder="Max Chases"
                                        className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                    />
                                    {maxChases > 100 && (
                                        <div className="mt-1 p-1 bg-orange-900/20 border border-orange-500/30 rounded">
                                            <p className="text-xs text-orange-400">
                                                ⚠️ Max: 100
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 pt-5">
                                    <input
                                        type="checkbox"
                                        checked={triggerOnCandleClose}
                                        onChange={(e) => setTriggerOnCandleClose(e.target.checked)}
                                        className="w-4 h-4 text-[#F0B90B] bg-[#373A45] border-2 border-[#4A5568] rounded focus:ring-[#F0B90B] focus:ring-2"
                                        disabled={!clicked}
                                    />
                                    <label className="text-sm text-gray-300">Candle Close Trigger</label>
                                </div>
                            </div>
                        </div>
                        
                        {/* Filled or Cancel toggle */}
                        <div className="flex items-center gap-4 mb-6">
                            <p
                                className={`inter text-xs underline cursor-pointer ${filled ? "text-blue-400" : "text-[#C5C8D0]"}`}
                                onClick={() => setFilled(prev => !prev)}
                            >
                                Filled or Cancel
                            </p>
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
                                placeholder="00"
                                className={`w-32 text-center px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white ${clicked ? "" : "bg-gray-800"}`}
                            />
                        </div>

                        {/* Long and Short Price Limits */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <h3 className="text-white font-medium mb-2">Long Price Limit</h3>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={longPriceLimit}
                                    onChange={(e) => setLongPriceLimit(parseFloat(e.target.value) || 0)}
                                    disabled={!clicked}
                                    readOnly={!clicked}
                                    placeholder="Enter Price"
                                    className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                />
                            </div>
                            <div>
                                <h3 className="text-white font-medium mb-2">Short Price Limit</h3>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={shortPriceLimit}
                                    onChange={(e) => setShortPriceLimit(parseFloat(e.target.value) || 0)}
                                    disabled={!clicked}
                                    readOnly={!clicked}
                                    placeholder="Enter Price"
                                    className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                />
                            </div>
                        </div>

                        {/* Simple Price Distance Slider */}
                        <div className="mb-6">
                            <h4 className="text-[#B0B0B0] text-sm mb-3">Price Distance</h4>
                            <div className="flex items-center gap-4">
                                {/* Slider */}
                                <div className="flex-1">
                                    <Slider.Root
                                        className="relative flex items-center select-none touch-none w-full h-8"
                                        min={0}
                                        max={5}
                                        step={0.1}
                                        value={[distance]}
                                        onValueChange={([val]) => setDistance(val)}
                                        disabled={!clicked}
                                    >
                                        <Slider.Track className="bg-[#E5E5E5] relative grow rounded-full h-2">
                                            <Slider.Range className="absolute h-full bg-yellow-400 rounded-full" />
                                        </Slider.Track>
                                        <Slider.SliderThumb>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="outline-none" width="18" height="18" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 15.4998C12.1421 15.4998 15.5 12.1419 15.5 7.99986C15.5 3.8577 12.1421 0.499847 8 0.499847C3.85788 0.499847 0.5 3.8577 0.5 7.99986C0.5 12.1419 3.85788 15.4998 8 15.4998Z" fill="#F0B90B" />
                                            </svg>
                                        </Slider.SliderThumb>
                                    </Slider.Root>
                                    <div className="flex justify-between text-sm text-white mt-1">
                                        <span>0%</span>
                                        <span>5%</span>
                                    </div>
                                </div>
                                
                                {/* Or statement */}
                                <span className="text-sm text-[rgba(255,255,255,0.70)]">or</span>
                                
                                {/* Manual Input */}
                                <input 
                                    type="number" 
                                    step="0.1"
                                    min="0"
                                    max="5"
                                    value={distance.toFixed(1)}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (!isNaN(val) && val >= 0 && val <= 5) {
                                            setDistance(val);
                                        }
                                    }}
                                    disabled={!clicked}
                                    placeholder="Enter %" 
                                    className={`w-20 px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                />
                            </div>
                        </div>

                        {/* Price Distance Section - HIDDEN but logic preserved */}
                        <div className="mb-6" style={{ display: 'none' }}>
                            <h3 className="text-white font-medium mb-3">Price Distance</h3>
                            <div className="flex items-center gap-4">
                                {/* Distance Slider */}
                                <div className="flex-1 relative">
                                    <input
                                        type="range"
                                        min="0"
                                        max="5"
                                        step="0.01"
                                        value={distance}
                                        onChange={(e) => setDistance(parseFloat(e.target.value))}
                                        disabled={!clicked}
                                        className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                        style={{
                                            background: !clicked ? '#6b7280' : `linear-gradient(to right, #F0B90B 0%, #F0B90B ${(distance / 5) * 100}%, #6b7280 ${(distance / 5) * 100}%, #6b7280 100%)`
                                        }}
                                    />
                                    <div className="flex justify-between text-sm text-white mt-1 font-medium">
                                        <span>0%</span>
                                        <span>5%</span>
                                    </div>
                                </div>
                                
                                <span className="text-white text-sm">or</span>
                                
                                {/* Manual Distance Input */}
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="5"
                                    value={distance.toFixed(2)}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (!isNaN(val) && val >= 0 && val <= 5) {
                                            setDistance(val);
                                        }
                                    }}
                                    disabled={!clicked}
                                    className={`w-20 px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                />
                            </div>
                        </div>

                        {/* Chaser Strategy Information */}
                     
                    </>
                )}
            </div>
        </div>
    );
};

export default LimitChaser;
