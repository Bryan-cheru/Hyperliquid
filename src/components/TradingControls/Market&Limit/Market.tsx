import * as Slider from "@radix-ui/react-slider"
import { useState } from "react";
import Profits from "../Profits";
import Leverage from "../Leverage/Leverage";
import ButtonWrapper from "../ButtonWrapper";
import BasketOrder from "../BasketOrder";

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
}

interface MarketProps {
  selectedOrderType?: Type; // Add prop to receive order type from parent
}

const Market = ({ selectedOrderType = "Market" }: MarketProps) => {

    const [leverage, setLeverage] = useState(10);
    const [value2, setValue2] = useState(10);
    const [value, setValue] = useState<number[]>([0]);
    const [value3, setValue3] = useState<number[]>([10]); // Start with 10% position size instead of 0%
    const [value4, setValue4] = useState(0); // Changed to 0 for Lower
    // Note: quantity is calculated dynamically from positionSize in ButtonWrapper
    
    const [clickedSplit, setClickedSplit] = useState<boolean>(false);
    const [clickedBasket, setClickedBasket] = useState<boolean>(false);
    
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
      splitCount: leverage,
      scaleType: value4 === 0 ? "Lower" : value4 === 1 ? "Mid point" : "Upper"
    };

    // Debug logging to trace order type
    console.log('🔍 Market Component - selectedOrderType:', selectedOrderType);
    console.log('🔍 Market Component - orderType:', orderType);
    console.log('🔍 Market Component - triggerPrice state:', triggerPrice);
    console.log('🔍 Market Component - tradingParams:', tradingParams);
    console.log('🔍 Market Component - triggerPrice in params:', tradingParams.triggerPrice);

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
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-[#24293A] text-white text-sm rounded border border-[#F0B90B]">
                        Cross
                    </button>
                    <button className="px-3 py-1.5 bg-[#24293A] text-white text-sm rounded">
                        Isolated
                    </button>
                </div>
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

            {/* Order Split Section */}
            <div className="border-t border-[#373A45] pt-6">
                <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-white font-medium text-lg">Order Split</h3>
                    <button 
                        onClick={() => setClickedSplit(!clickedSplit)}
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
                            <h4 className="text-[#B0B0B0] text-sm mb-3">Split: <span className="text-white">{leverage}</span></h4>
                            <Slider.Root
                                className="relative flex items-center select-none touch-none w-full h-8"
                                min={0}
                                max={30}
                                step={1}
                                value={[leverage]}
                                onValueChange={([val]) => setLeverage(val)}
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
                                <span>0</span>
                                <span>30</span>
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

            {/* Limit Chaser Section */}
            <div className="border-t border-[#373A45] pt-6">
                <div className="flex items-center gap-3 mb-4">
                    <h3 className="text-white font-medium text-lg">Limit Chaser</h3>
                    <button className="px-3 py-1.5 bg-[#24293A] text-white text-sm rounded border border-[rgba(255,255,255,0.25)]">
                        Fill or Cancel
                    </button>
                </div>
                
                <div className="flex gap-4 mb-4">
                    <div className="flex flex-col gap-2 flex-1">
                        <h4 className="text-white font-medium text-sm">Long Price Limit</h4>
                        <input 
                            type="number" 
                            placeholder="Enter Price" 
                            className="inputs"
                        />
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                        <h4 className="text-white font-medium text-sm">Short Price Limit</h4>
                        <input 
                            type="number" 
                            placeholder="Enter Price" 
                            className="inputs"
                        />
                    </div>
                </div>

                <div>
                    <h4 className="text-[#B0B0B0] text-sm mb-3">Price Distance</h4>
                    <Slider.Root
                        className="relative flex items-center select-none touch-none w-full h-8"
                        min={0}
                        max={5}
                        step={0.1}
                        value={[0]}
                        onValueChange={() => {}}
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
                    <div className="text-center mt-2">
                        <span className="text-sm text-[rgba(255,255,255,0.70)]">or</span>
                    </div>
                </div>
            </div>
            
            {/* Basket Order Component */}
            <BasketOrder clicked={clickedBasket} setClicked={setClickedBasket} />
            
            {/* Trading Buttons */}
            <ButtonWrapper tradingParams={tradingParams} basketOrderEnabled={clickedBasket} />
        </div>
    )
}

export default Market
