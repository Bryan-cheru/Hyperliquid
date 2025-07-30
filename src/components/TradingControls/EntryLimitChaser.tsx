import { useState, useEffect } from "react";
import * as Slider from "@radix-ui/react-slider";
import { useTrading } from "../../contexts/TradingContext";

interface Props {
    clicked: boolean;
    setClicked: React.Dispatch<React.SetStateAction<boolean>>;
    onParametersChange?: (params: EntryLimitChaserParams) => void;
}

export interface EntryLimitChaserParams {
    enabled: boolean;
    entryPrice: number;
    longPriceLimit?: number;
    shortPriceLimit?: number;
    updateInterval: number;
    maxChases: number;
    distance: number;
    side: 'buy' | 'sell';
    quantity: number;
    leverage: number;
}

// Entry Limit Chaser component for entry position management
const EntryLimitChaser = ({ clicked, setClicked, onParametersChange }: Props) => {
    const { connectedAccount, getPrice } = useTrading();
    const [longPriceLimit, setLongPriceLimit] = useState<number>(0);
    const [shortPriceLimit, setShortPriceLimit] = useState<number>(0);
    const [entryPrice, setEntryPrice] = useState<string>("0");
    const [updateInterval, setUpdateInterval] = useState<number>(30);
    const [maxChases, setMaxChases] = useState<number>(5);
    const [distance, setDistance] = useState<number>(0.5); // Default 0.5% for entries
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [quantity, setQuantity] = useState<number>(0.001);
    const [leverage, setLeverage] = useState<number>(10);
    
    // Auto-update price limits based on current market price
    useEffect(() => {
        if (clicked && connectedAccount?.pair) {
            const symbol = connectedAccount.pair.replace('/USDT', '').replace('/USDC', '');
            const currentPrice = getPrice(symbol);
            
            if (currentPrice) {
                // Set initial values based on current price
                if (longPriceLimit === 0) setLongPriceLimit(currentPrice * 0.99);  // 1% below for longs
                if (shortPriceLimit === 0) setShortPriceLimit(currentPrice * 1.01); // 1% above for shorts
                if (parseFloat(entryPrice) === 0) setEntryPrice(currentPrice.toString());
            }
        }
    }, [clicked, connectedAccount?.pair, getPrice, longPriceLimit, shortPriceLimit, entryPrice]);
    
    // Notify parent component when parameters change
    useEffect(() => {
        if (onParametersChange) {
            const params: EntryLimitChaserParams = {
                enabled: clicked,
                entryPrice: parseFloat(entryPrice),
                longPriceLimit,
                shortPriceLimit,
                updateInterval,
                maxChases,
                distance,
                side,
                quantity,
                leverage
            };
            onParametersChange(params);
        }
    }, [clicked, entryPrice, longPriceLimit, shortPriceLimit, updateInterval, maxChases, distance, side, quantity, leverage, onParametersChange]);

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
                    <h1 className="text-xl font-medium text-white">Entry Limit Chaser</h1>
                    {clicked && connectedAccount && (
                        <span className="text-xs text-green-400 ml-2">🟢 Active</span>
                    )}
                </div>

                {clicked && (
                    <>
                        {/* Entry Configuration Panel */}
                        <div className="mb-4">
                            {/* Side and Entry Price */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Position Side</label>
                                    <select
                                        value={side}
                                        onChange={(e) => setSide(e.target.value as 'buy' | 'sell')}
                                        className="w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-sm"
                                        disabled={!clicked}
                                    >
                                        <option value="buy">Long (Buy)</option>
                                        <option value="sell">Short (Sell)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Entry Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={entryPrice}
                                        onChange={(e) => setEntryPrice(e.target.value)}
                                        disabled={!clicked}
                                        placeholder="0.00"
                                        className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                    />
                                </div>
                            </div>

                            {/* Quantity and Leverage */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Quantity</label>
                                    <input
                                        type="number"
                                        step="0.001"
                                        min="0.001"
                                        value={quantity}
                                        onChange={(e) => setQuantity(parseFloat(e.target.value) || 0.001)}
                                        disabled={!clicked}
                                        placeholder="0.001"
                                        className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Leverage</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={leverage}
                                        onChange={(e) => setLeverage(parseInt(e.target.value) || 10)}
                                        disabled={!clicked}
                                        placeholder="10"
                                        className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                    />
                                </div>
                            </div>

                            {/* Update Interval and Max Chases */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Update Interval (seconds)</label>
                                    <input
                                        type="number"
                                        min="10"
                                        max="120"
                                        value={updateInterval}
                                        onChange={(e) => setUpdateInterval(parseInt(e.target.value) || 30)}
                                        disabled={!clicked}
                                        placeholder="30"
                                        className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-300 mb-1">Max Chases (≤10)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={maxChases}
                                        onChange={(e) => {
                                            const value = parseInt(e.target.value) || 5;
                                            if (value > 10) {
                                                setMaxChases(10);
                                            } else if (value < 1) {
                                                setMaxChases(1);
                                            } else {
                                                setMaxChases(value);
                                            }
                                        }}
                                        disabled={!clicked}
                                        placeholder="5"
                                        className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                    />
                                </div>
                            </div>
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
                                    placeholder="Max entry price for longs"
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
                                    placeholder="Min entry price for shorts"
                                    className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                />
                            </div>
                        </div>

                        {/* Entry Distance Slider */}
                        <div className="mb-6">
                            <h4 className="text-[#B0B0B0] text-sm mb-3">Entry Distance</h4>
                            <div className="flex items-center gap-4">
                                {/* Slider */}
                                <div className="flex-1">
                                    <Slider.Root
                                        className="relative flex items-center select-none touch-none w-full h-8"
                                        min={0.1}
                                        max={3}
                                        step={0.1}
                                        value={[distance]}
                                        onValueChange={([val]) => setDistance(val)}
                                        disabled={!clicked}
                                    >
                                        <Slider.Track className="bg-[#E5E5E5] relative grow rounded-full h-2">
                                            <Slider.Range className="absolute h-full bg-blue-400 rounded-full" />
                                        </Slider.Track>
                                        <Slider.SliderThumb>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="outline-none" width="18" height="18" viewBox="0 0 16 16" fill="none">
                                                <path d="M8 15.4998C12.1421 15.4998 15.5 12.1419 15.5 7.99986C15.5 3.8577 12.1421 0.499847 8 0.499847C3.85788 0.499847 0.5 3.8577 0.5 7.99986C0.5 12.1419 3.85788 15.4998 8 15.4998Z" fill="#3B82F6" />
                                            </svg>
                                        </Slider.SliderThumb>
                                    </Slider.Root>
                                    <div className="flex justify-between text-sm text-white mt-1">
                                        <span>0.1%</span>
                                        <span>3%</span>
                                    </div>
                                </div>
                                
                                {/* Or statement */}
                                <span className="text-sm text-[rgba(255,255,255,0.70)]">or</span>
                                
                                {/* Manual Input */}
                                <input 
                                    type="number" 
                                    step="0.1"
                                    min="0.1"
                                    max="3"
                                    value={distance.toFixed(1)}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (!isNaN(val) && val >= 0.1 && val <= 3) {
                                            setDistance(val);
                                        }
                                    }}
                                    disabled={!clicked}
                                    placeholder="0.5%" 
                                    className={`w-20 px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                />
                            </div>
                        </div>

                        {/* Entry Strategy Information */}
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
                            <h4 className="text-blue-400 text-sm font-medium mb-2">How Entry Limit Chasing Works:</h4>
                            <ul className="text-xs text-gray-300 space-y-1">
                                <li>• <strong>Long positions:</strong> Chases price DOWN for better entry (buy below market)</li>
                                <li>• <strong>Short positions:</strong> Chases price UP for better entry (sell above market)</li>
                                <li>• <strong>Distance:</strong> How far from current price to place limit orders</li>
                                <li>• <strong>Price Limits:</strong> Maximum/minimum acceptable entry prices</li>
                                <li>• <strong>Max Chases:</strong> Stops after this many order updates</li>
                            </ul>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EntryLimitChaser;
