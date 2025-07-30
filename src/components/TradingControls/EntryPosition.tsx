import { useState, useEffect } from "react";
import * as Slider from "@radix-ui/react-slider";
import { useTrading } from "../../contexts/TradingContext";

interface Props {
    clicked: boolean;
    setClicked: React.Dispatch<React.SetStateAction<boolean>>;
    onParametersChange?: (params: EntryPositionParams) => void;
}

export interface EntryPositionParams {
    enabled: boolean;
    entryPosition: number; // Position size as percentage (0.0 to 1.0)
    maxPositionSize: number; // Maximum position size in USD
    calculatedPosition: number; // Calculated position in USD
    positionType: 'percentage' | 'fixed'; // Position calculation type
    longPriceLimit: number; // Long price limit
    shortPriceLimit: number; // Short price limit
    priceDistance: number; // Price distance percentage
    fillOrCancel: boolean; // Fill or Cancel option
}

const EntryPosition = ({ clicked, setClicked, onParametersChange }: Props) => {
    const { connectedAccount } = useTrading();
    
    // Entry position control state
    const [entryPosition, setEntryPosition] = useState<number>(0.5); // Default 50% position size
    const [maxPositionSize, setMaxPositionSize] = useState<number>(1000); // Maximum position size in USD
    const [positionType, setPositionType] = useState<'percentage' | 'fixed'>('percentage');
    const [longPriceLimit, setLongPriceLimit] = useState<number>(0);
    const [shortPriceLimit, setShortPriceLimit] = useState<number>(0);
    const [priceDistance, setPriceDistance] = useState<number>(1.5);
    const [fillOrCancel, setFillOrCancel] = useState<boolean>(false);

    // Calculate the actual position size
    const calculatedPosition = positionType === 'percentage' 
        ? maxPositionSize * entryPosition 
        : entryPosition;

    // Update parent component when parameters change
    useEffect(() => {
        if (onParametersChange) {
            const params: EntryPositionParams = {
                enabled: clicked,
                entryPosition,
                maxPositionSize,
                calculatedPosition,
                positionType,
                longPriceLimit,
                shortPriceLimit,
                priceDistance,
                fillOrCancel
            };
            onParametersChange(params);
        }
    }, [clicked, entryPosition, maxPositionSize, positionType, calculatedPosition, longPriceLimit, shortPriceLimit, priceDistance, fillOrCancel, onParametersChange]);

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
                    <h1 className="text-xl font-medium text-white">Entry Position Control</h1>
                    {clicked && connectedAccount && (
                        <span className="text-xs text-green-400 ml-2">🟢 Active</span>
                    )}
                </div>

                {clicked && (
                    <>
                        {/* Configuration Panel */}
                        <div>
                            <h3 className="text-sm font-medium text-yellow-400 mb-3">Position Configuration</h3>
                            
                            {/* Position Type Selection */}
                            <div className="mb-4">
                                <label className="block text-xs text-gray-300 mb-2">Position Calculation Type</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="positionType"
                                            value="percentage"
                                            checked={positionType === 'percentage'}
                                            onChange={(e) => setPositionType(e.target.value as 'percentage' | 'fixed')}
                                            disabled={!clicked}
                                            className="w-3 h-3"
                                        />
                                        <span className="text-sm text-white">Percentage of Max</span>
                                    </label>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="radio"
                                            name="positionType"
                                            value="fixed"
                                            checked={positionType === 'fixed'}
                                            onChange={(e) => setPositionType(e.target.value as 'percentage' | 'fixed')}
                                            disabled={!clicked}
                                            className="w-3 h-3"
                                        />
                                        <span className="text-sm text-white">Fixed Amount</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {positionType === 'percentage' ? (
                            <>
                                {/* Percentage Mode Configuration */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-xs text-gray-300 mb-1">Position Size (%)</label>
                                        <input
                                            type="number"
                                            step="5"
                                            min="10"
                                            max="100"
                                            value={(entryPosition * 100).toFixed(0)}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value) / 100;
                                                if (!isNaN(val) && val >= 0.1 && val <= 1.0) {
                                                    setEntryPosition(val);
                                                }
                                            }}
                                            disabled={!clicked}
                                            className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-300 mb-1">Max Position Size (USD)</label>
                                        <input
                                            type="number"
                                            step="100"
                                            min="100"
                                            max="50000"
                                            value={maxPositionSize}
                                            onChange={(e) => setMaxPositionSize(parseFloat(e.target.value) || 1000)}
                                            disabled={!clicked}
                                            className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                        />
                                    </div>
                                </div>

                                {/* Position Size Slider */}
                                <div className="mb-4">
                                    <label className="block text-xs text-gray-300 mb-2">Position Size Slider</label>
                                    <div className="relative">
                                        <input
                                            type="range"
                                            min="0.1"
                                            max="1.0"
                                            step="0.05"
                                            value={entryPosition}
                                            onChange={(e) => setEntryPosition(parseFloat(e.target.value))}
                                            disabled={!clicked}
                                            className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                                            style={{
                                                background: !clicked ? '#6b7280' : `linear-gradient(to right, #F0B90B 0%, #F0B90B ${entryPosition * 100}%, #6b7280 ${entryPosition * 100}%, #6b7280 100%)`
                                            }}
                                        />
                                        <div className="flex justify-between text-xs text-gray-300 mt-1">
                                            <span>10%</span>
                                            <span className="text-[#F0B90B] font-medium">{(entryPosition * 100).toFixed(0)}%</span>
                                            <span>100%</span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Fixed Amount Mode */}
                                <div className="mb-4">
                                    <label className="block text-xs text-gray-300 mb-1">Fixed Position Size (USD)</label>
                                    <input
                                        type="number"
                                        step="10"
                                        min="10"
                                        max="50000"
                                        value={entryPosition}
                                        onChange={(e) => setEntryPosition(parseFloat(e.target.value) || 100)}
                                        disabled={!clicked}
                                        className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                        placeholder="Enter fixed amount"
                                    />
                                </div>
                            </>
                        )}

                        {/* Long and Short Price Limits */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs text-gray-300 mb-1">Long Price Limit</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={longPriceLimit || ''}
                                    onChange={(e) => setLongPriceLimit(parseFloat(e.target.value) || 0)}
                                    disabled={!clicked}
                                    placeholder="Enter Price"
                                    className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-300 mb-1">Short Price Limit</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={shortPriceLimit || ''}
                                    onChange={(e) => setShortPriceLimit(parseFloat(e.target.value) || 0)}
                                    disabled={!clicked}
                                    placeholder="Enter Price"
                                    className={`w-full px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                />
                            </div>
                        </div>

                        {/* Price Distance Slider */}
                        <div className="mb-4">
                            <h4 className="text-[#B0B0B0] text-sm mb-3">Price Distance: <span className="text-white">{priceDistance}%</span></h4>
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <Slider.Root
                                        className="relative flex items-center select-none touch-none w-full h-8"
                                        min={0.1}
                                        max={5}
                                        step={0.1}
                                        value={[priceDistance]}
                                        onValueChange={([val]) => setPriceDistance(val)}
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
                                        <span>0.1%</span>
                                        <span>5%</span>
                                    </div>
                                </div>
                                
                                <span className="text-sm text-[rgba(255,255,255,0.70)]">or</span>
                                
                                <input 
                                    type="number" 
                                    step="0.1"
                                    min="0.1"
                                    max="5"
                                    value={priceDistance.toFixed(1)}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        if (!isNaN(val) && val >= 0.1 && val <= 5) {
                                            setPriceDistance(val);
                                        }
                                    }}
                                    disabled={!clicked}
                                    placeholder="1.5%" 
                                    className={`w-20 px-3 py-2 bg-[#373A45] border border-[#4A5568] rounded text-white text-center ${clicked ? "" : "bg-gray-800"}`}
                                />
                            </div>
                        </div>

                        {/* Fill or Cancel Option */}
                        <div className="mb-4">
                            <div className="flex items-center gap-3">
                                <h4 className="text-white font-medium text-sm">Fill or Cancel</h4>
                                <button 
                                    onClick={() => setFillOrCancel(!fillOrCancel)}
                                    disabled={!clicked}
                                    className={`w-12 h-6 rounded-full transition-all relative ${
                                        fillOrCancel ? 'bg-[#F0B90B]' : 'bg-[#373A45]'
                                    } ${!clicked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className={`w-5 h-5 bg-white rounded-full transition-all absolute top-0.5 ${
                                        fillOrCancel ? 'translate-x-6' : 'translate-x-0.5'
                                    }`} />
                                </button>
                                {fillOrCancel && (
                                    <span className="text-xs text-green-400">✓ Enabled</span>
                                )}
                            </div>
                            
                        </div>

                        {/* Calculated Position Display */}
                        

                        {/* Information Panel */}
                        
                    </>
                )}
            </div>
        </div>
    );
};

export default EntryPosition;
