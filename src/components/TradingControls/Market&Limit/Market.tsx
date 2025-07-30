import * as Slider from "@radix-ui/react-slider"
import { useState, useCallback } from "react";
import Profits from "../Profits";
import Leverage from "../Leverage/Leverage";
import ButtonWrapper from "../ButtonWrapper";
import BasketOrder from "../BasketOrder";
import EntryLimitChaser from "../EntryLimitChaser";
import EntryPosition from "../EntryPosition";
import { useEntryPosition } from "../../../hooks/useEntryPosition";
import type { EntryPositionParams } from "../EntryPosition";

export type Type = "Limit" | "Market";

// Trading parameters interface
export interface TradingParams {
  leverage: number;
  positionSize: number;
  quantity?: number; // Add explicit quantity field
  stopLoss: number;
  orderType: Type;
  triggerPrice?: number;
  stopPrice?: number;
  orderSplit: boolean;
  minPrice?: number;
  maxPrice?: number;
  splitCount: number;
  scaleType: 'Lower' | 'Mid point' | 'Upper';
  // Limit Chaser properties
  limitChaser?: boolean;
  longPriceLimit?: number;
  shortPriceLimit?: number;
  priceDistance?: number;
}

interface MarketProps {
  selectedOrderType?: Type; // Add prop to receive order type from parent
}

const Market = ({ selectedOrderType = "Market" }: MarketProps) => {
    // Entry Position Hook Integration
    const { createEntry, updateEntry, cancelEntry, activeEntries, error: entryError } = useEntryPosition();

    const [value2, setValue2] = useState(10);
    const [value, setValue] = useState<number[]>([0]);
    const [value3, setValue3] = useState<number[]>([10]); // Start with 10% position size instead of 0%
    const [value4, setValue4] = useState(0); // Changed to 0 for Lower
    // Note: quantity is calculated dynamically from positionSize in ButtonWrapper
    
    const [clickedSplit, setClickedSplit] = useState<boolean>(false);
    const [clickedBasket, setClickedBasket] = useState<boolean>(false);
    const [splitCount, setSplitCount] = useState<number>(2); // Separate split count state
    
        // Limit Chaser state variables
    const [clickedLimitChaser, setClickedLimitChaser] = useState<boolean>(false);
    const [longPriceLimit, setLongPriceLimit] = useState<number>(0);
    const [shortPriceLimit, setShortPriceLimit] = useState<number>(0);
    const [priceDistance, setPriceDistance] = useState<number>(1.5);
    
    // Entry Limit Chaser state variables
    const [clickedEntryLimitChaser, setClickedEntryLimitChaser] = useState<boolean>(false);
    
    // Entry Position Control state variables
    const [clickedEntryPosition, setClickedEntryPosition] = useState<boolean>(false);
    const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
    
    // Entry Position parameters handler
    const handleEntryPositionChange = useCallback(async (params: EntryPositionParams) => {
        if (!params.enabled) {
            // Cancel existing entry if disabled
            if (currentEntryId) {
                await cancelEntry(currentEntryId);
                setCurrentEntryId(null);
            }
            return;
        }
        
        try {
            if (currentEntryId) {
                // Update existing entry
                await updateEntry(currentEntryId, params);
            } else {
                // Create new entry (default to buy side, could be configurable)
                const entryId = await createEntry('buy', params);
                if (entryId) {
                    setCurrentEntryId(entryId);
                }
            }
        } catch (error) {
            console.error('Error handling entry position change:', error);
        }
    }, [createEntry, updateEntry, cancelEntry, currentEntryId]);
    
    // Use the order type passed from parent instead of local state
    const orderType = selectedOrderType;
    
    // Additional state for limit order inputs
    const [triggerPrice, setTriggerPrice] = useState<number>(0);
    const [stopPrice, setStopPrice] = useState<number>(0);
    const [minPrice, setMinPrice] = useState<number>(0);
    const [maxPrice, setMaxPrice] = useState<number>(0);

    // Create trading parameters object to pass to ButtonWrapper
    const tradingParams: TradingParams = {
      leverage: value2,
      positionSize: value3[0] ?? 0,
      // quantity will be calculated dynamically in ButtonWrapper based on positionSize
      stopLoss: value[0] ?? 0,
      orderType: orderType,
      triggerPrice: orderType === "Limit" ? triggerPrice : undefined,
      stopPrice: orderType === "Limit" ? stopPrice : undefined,
      orderSplit: clickedSplit,
      minPrice: clickedSplit ? minPrice : undefined,
      maxPrice: clickedSplit ? maxPrice : undefined,
      splitCount: splitCount, // Use separate split count instead of leverage
      scaleType: value4 === 0 ? "Lower" : value4 === 1 ? "Mid point" : "Upper",
      // Limit Chaser parameters
      limitChaser: clickedLimitChaser,
      longPriceLimit: clickedLimitChaser ? longPriceLimit : undefined,
      shortPriceLimit: clickedLimitChaser ? shortPriceLimit : undefined,
      priceDistance: clickedLimitChaser ? priceDistance : undefined,
    };

    // Debug logging to trace order type
                    
    return (
        <div className="flex flex-col gap-6">
            {/* Leverage Section */}
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-[rgba(255,255,255,0.70)]">Leverage: <span className="text-white font-medium">{value2}x</span></p>
                    <Leverage />
                </div>
                <div>
                    <Slider.Root
                        className="relative flex items-center select-none touch-none w-full h-8"
                        min={0}
                        max={100}
                        step={1}
                        value={[value2]}
                        onValueChange={([val]) => setValue2(val)}
                    >
                        <Slider.Track className="bg-[#E5E5E5] relative grow rounded-full h-2">
                            <Slider.Range className="absolute h-full bg-yellow-400 rounded-full" />
                        </Slider.Track>
                        <Slider.SliderThumb >
                            <svg xmlns="http://www.w3.org/2000/svg" className="outline-none" width="18" height="18" viewBox="0 0 16 16" fill="none">
                                <path d="M8 15.4998C12.1421 15.4998 15.5 12.1419 15.5 7.99986C15.5 3.8577 12.1421 0.499847 8 0.499847C3.85788 0.499847 0.5 3.8577 0.5 7.99986C0.5 12.1419 3.85788 15.4998 8 15.4998Z" fill="#F0B90B" />
                            </svg>
                        </Slider.SliderThumb>
                    </Slider.Root>
                    <div className="flex justify-between text-sm text-white mt-1">
                        <span>0x</span>
                        <span>100x</span>
                    </div>
                </div>
                
                {/* Margin Mode Selection */}
                {/*   */}
            </div>

            {/* Take Profits Section */}
            <Profits />
            
            {/* Order Configuration */}
            <div className="flex flex-col gap-6 border-t border-[#373A45] pt-6">
                <h3 className="text-white font-medium text-lg">{orderType === "Market" ? "Market order" : "Limit order"}</h3>
                
                {/* Position Size */}
                <div className="flex flex-col">
                    <p className="text-[rgba(255,255,255,0.70)] text-sm mb-3">Position Size: <span className="text-white">{value3[0] ?? 0}%</span></p>
                    <div className="flex justify-between items-center gap-5">
                        <Slider.Root value={value3} min={0} max={100} step={1} onValueChange={setValue3} className="relative flex items-center w-full h-5">
                            <Slider.Track className="bg-[#E5E5E5] relative grow rounded-full h-2">
                                <Slider.Range className="absolute h-full bg-yellow-400 rounded-full" />
                            </Slider.Track>
                            <Slider.Thumb className="block w-4 h-4 rounded-full bg-yellow-400 focus:outline-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="outline-none" width="18" height="18" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 15.4998C12.1421 15.4998 15.5 12.1419 15.5 7.99986C15.5 3.8577 12.1421 0.499847 8 0.499847C3.85788 0.499847 0.5 3.8577 0.5 7.99986C0.5 12.1419 3.85788 15.4998 8 15.4998Z" fill="#F0B90B" />
                                </svg>
                            </Slider.Thumb>
                        </Slider.Root>
                        <span className="text-sm text-[rgba(255,255,255,0.70)]">or</span>
                        <input
                            type="number"
                            placeholder="Enter size"
                            value={value3[0] ?? 0}
                            onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                    setValue3([0]);
                                } else {
                                    const num = Number(raw);
                                    if (!isNaN(num) && num >= 0 && num <= 100) {
                                        setValue3([num]);
                                    }
                                }
                            }}
                            className="text-white max-w-[100px] py-2 px-3 rounded bg-[#24293A] border border-[rgba(255,255,255,0.25)] text-sm"
                        />
                    </div>
                </div>

                {/* Stop Loss */}
                <div className="flex flex-col">
                    <p className="text-[rgba(255,255,255,0.70)] text-sm mb-3">Stop Loss: <span className="text-white">{value[0] ?? 0}%</span></p>
                    <div className="flex justify-between items-center gap-5">
                        <Slider.Root value={value} onValueChange={setValue} className="relative flex items-center w-full h-5">
                            <Slider.Track className="bg-[#E5E5E5] relative grow rounded-full h-2">
                                <Slider.Range className="absolute h-full bg-yellow-400 rounded-full" />
                            </Slider.Track>
                            <Slider.Thumb className="block w-4 h-4 rounded-full bg-yellow-400 focus:outline-none">
                                <svg xmlns="http://www.w3.org/2000/svg" className="outline-none" width="18" height="18" viewBox="0 0 16 16" fill="none">
                                    <path d="M8 15.4998C12.1421 15.4998 15.5 12.1419 15.5 7.99986C15.5 3.8577 12.1421 0.499847 8 0.499847C3.85788 0.499847 0.5 3.8577 0.5 7.99986C0.5 12.1419 3.85788 15.4998 8 15.4998Z" fill="#F0B90B" />
                                </svg>
                            </Slider.Thumb>
                        </Slider.Root>
                        <span className="text-sm text-[rgba(255,255,255,0.70)]">or</span>
                        <input
                            type="number"
                            placeholder="Enter size"
                            value={value[0] ?? 0}
                            onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === "") {
                                    setValue([0]);
                                } else {
                                    const num = Number(raw);
                                    if (!isNaN(num) && num >= 0 && num <= 100) {
                                        setValue([num]);
                                    }
                                }
                            }}
                            className="text-white max-w-[100px] py-2 px-3 rounded bg-[#24293A] border border-[rgba(255,255,255,0.25)] text-sm"
                        />
                    </div>
                </div>

                {/* Trigger and Stop Price for Limit Orders */}
                {orderType === "Limit" && (
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-2 flex-1">
                            <h4 className="text-white font-medium text-sm">Trigger Price</h4>
                            <input 
                                type="number" 
                                placeholder="Enter Price" 
                                className="inputs"
                                value={triggerPrice || ''}
                                onChange={(e) => setTriggerPrice(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                        <div className="flex flex-col gap-2 flex-1">
                            <h4 className="text-white font-medium text-sm">Stop Price</h4>
                            <input 
                                type="number" 
                                placeholder="Enter Price" 
                                className="inputs"
                                value={stopPrice || ''}
                                onChange={(e) => setStopPrice(parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                )}

                {/* Order Type Selection for Stop Loss */}
                {orderType === "Limit" && (
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-[#F0B90B] text-black text-sm rounded font-medium">
                            Market
                        </button>
                        <button className="px-4 py-2 bg-[#24293A] text-white text-sm rounded font-medium border border-[rgba(255,255,255,0.25)]">
                            Limit
                        </button>
                    </div>
                )}
            </div>

            {/* Entry Limit Chaser Component - MOVED TO TOP POSITION */}
            <EntryLimitChaser clicked={clickedEntryLimitChaser} setClicked={setClickedEntryLimitChaser} />

            {/* Entry Position Control Component */}
            <EntryPosition 
                clicked={clickedEntryPosition} 
                setClicked={setClickedEntryPosition}
                onParametersChange={handleEntryPositionChange}
            />

            {/* Order Split Section */}
            <div className="border-t border-[#373A45] pt-6">
                <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-white font-medium text-lg">Order Split</h3>
                    <button 
                        onClick={() => setClickedSplit(!clickedSplit)}
                        data-testid="order-split-toggle"
                        className={`w-12 h-6 rounded-full transition-all relative ${
                            clickedSplit ? 'bg-[#F0B90B]' : 'bg-[#373A45]'
                        }`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full transition-all absolute top-0.5 ${
                            clickedSplit ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                    </button>
                </div>

                {clickedSplit && (
                    <div className="flex flex-col gap-4">
                        {/* Min/Max Price */}
                        <div className="flex gap-4">
                            <div className="flex flex-col gap-2 flex-1">
                                <h4 className="text-white font-medium text-sm">Min Price</h4>
                                <input 
                                    type="number" 
                                    placeholder="Enter Price" 
                                    className="inputs"
                                    value={minPrice || ''}
                                    onChange={(e) => setMinPrice(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className="flex flex-col gap-2 flex-1">
                                <h4 className="text-white font-medium text-sm">Max Price</h4>
                                <input 
                                    type="number" 
                                    placeholder="Enter Price" 
                                    className="inputs"
                                    value={maxPrice || ''}
                                    onChange={(e) => setMaxPrice(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        {/* Split Count */}
                        <div>
                            <h4 className="text-[#B0B0B0] text-sm mb-3">Split Count: <span className="text-white">{splitCount}</span></h4>
                            <Slider.Root
                                className="relative flex items-center select-none touch-none w-full h-8"
                                min={2}
                                max={10}
                                step={1}
                                value={[splitCount]}
                                onValueChange={([val]) => setSplitCount(val)}
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
                                <span>2</span>
                                <span>10</span>
                            </div>
                        </div>

                        {/* Scale */}
                        <div>
                            <h4 className="text-[#B0B0B0] text-sm mb-3">Scale: <span className="text-white">{value4 === 0 ? "Lower" : value4 === 1 ? "Mid point" : "Upper"}</span></h4>
                            <Slider.Root
                                className="relative flex items-center select-none touch-none w-full h-8"
                                min={0}
                                max={2}
                                step={1}
                                value={[value4]}
                                onValueChange={([val]) => setValue4(val)}
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
                                <span>Lower band</span>
                                <span>|</span>
                                <span>Upper band</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stop Loss Limit Chaser Section - RENAMED */}
            <div className="border-t border-[#373A45] pt-6">
                <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-white font-medium text-lg">Stop Loss Limit Chaser</h3>
                    <button 
                        onClick={() => setClickedLimitChaser(!clickedLimitChaser)}
                        data-testid="limit-chaser-toggle"
                        className={`w-12 h-6 rounded-full transition-all relative ${
                            clickedLimitChaser ? 'bg-[#F0B90B]' : 'bg-[#373A45]'
                        }`}
                    >
                        <div className={`w-5 h-5 bg-white rounded-full transition-all absolute top-0.5 ${
                            clickedLimitChaser ? 'translate-x-6' : 'translate-x-0.5'
                        }`} />
                    </button>
                </div>
                
                {clickedLimitChaser && (
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-4 mb-4">
                            <div className="flex flex-col gap-2 flex-1">
                                <h4 className="text-white font-medium text-sm">Long Price Limit</h4>
                                <input 
                                    type="number" 
                                    placeholder="Enter Price" 
                                    className="inputs"
                                    value={longPriceLimit || ''}
                                    onChange={(e) => setLongPriceLimit(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                            <div className="flex flex-col gap-2 flex-1">
                                <h4 className="text-white font-medium text-sm">Short Price Limit</h4>
                                <input 
                                    type="number" 
                                    placeholder="Enter Price" 
                                    className="inputs"
                                    value={shortPriceLimit || ''}
                                    onChange={(e) => setShortPriceLimit(parseFloat(e.target.value) || 0)}
                                />
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[#B0B0B0] text-sm mb-3">Price Distance: <span className="text-white">{priceDistance}%</span></h4>
                            <Slider.Root
                                className="relative flex items-center select-none touch-none w-full h-8"
                                min={0.1}
                                max={5}
                                step={0.1}
                                value={[priceDistance]}
                                onValueChange={([val]) => setPriceDistance(val)}
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
                    </div>
                )}
            </div>
            
            {/* Basket Order Component */}
            <BasketOrder clicked={clickedBasket} setClicked={setClickedBasket} />
            
            {/* Trading Buttons */}
            <ButtonWrapper tradingParams={tradingParams} basketOrderEnabled={clickedBasket} />
        </div>
    )
}

export default Market
