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
    const [value3, setValue3] = useState<number[]>([0]);
    const [value4, setValue4] = useState(0); // Changed to 0 for Lower
    const [quantity, setQuantity] = useState<number>(0.001); // Add quantity state with default minimum
    
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
      quantity: quantity, // Include user-specified quantity
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
    console.log('🔍 Market Component - tradingParams:', tradingParams);

    return (
        <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                    <p className="text-sm text-[rgba(255,255,255,0.70)] text-center">Leverage: <span className="text-white">{value2}x</span></p>
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
                
                {/* Quantity Input Field */}
                <div className="flex flex-col gap-2">
                    <h2 className="text-white font-medium">Order Quantity</h2>
                    <div className="flex flex-col gap-1">
                        <input 
                            type="number" 
                            step="0.00001"
                            min="0"
                            placeholder="Enter quantity (e.g., 0.001 BTC)" 
                            className="inputs text-white" 
                            value={quantity || ''}
                            onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                        />
                        <p className="text-xs text-gray-400">
                            Minimum: BTC=0.0001, ETH=0.001, SOL=0.1
                        </p>
                    </div>
                </div>
            </div>
            <Profits />
            
            <div className="flex flex-col gap-6">
                
                <div className="flex flex-col gap-[21.1px]">
                    <div className="flex flex-col border-b border-[#373A45] pb-6">
                        <p className="text-[rgba(255,255,255,0.70)] text-xs">Position Size: <span className="text-white">%{value3[0] ?? 0}</span></p>
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
                            <p className="text-sm text-[rgba(255,255,255,0.70)]">or</p>
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
                                className="text-white max-w-[104px] min-w-0 w-full py-2 px-4 rounded-[4px] placeholder:text-[rgba(255,255,255,0.60)] border border-[rgba(255,255,255,0.25)]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col">
                        <p className="text-[rgba(255,255,255,0.70)] text-xs">Stop Loss: <span className="text-white">{value[0] ?? 0}%</span></p>
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
                            <p className="text-sm text-[rgba(255,255,255,0.70)]">or</p>
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
                                className="text-white max-w-[104px] min-w-0 w-full py-2 px-4 rounded-[4px] placeholder:text-[rgba(255,255,255,0.60)] border border-[rgba(255,255,255,0.25)]"
                            />
                        </div>
                    </div>
                </div>
                <div className={`gap-5 mt-4 ${orderType === "Market" ? "hidden" : "flex"}`}>
                    <div className="flex flex-col gap-1.5 w-full">
                        <h2 className="text-white font-medium">Trigger Price</h2>
                        <input 
                          type="number" 
                          placeholder="Enter Price" 
                          className="inputs" 
                          value={triggerPrice || ''}
                          onChange={(e) => setTriggerPrice(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 w-full">
                        <h2 className="text-white font-medium">Stop Price</h2>
                        <input 
                          type="number" 
                          placeholder="Enter Price" 
                          className="inputs" 
                          value={stopPrice || ''}
                          onChange={(e) => setStopPrice(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>
                
                {/* Order type is controlled by parent TradingControls - no local toggle needed */}
                
                    <div className="flex gap-3 items-center">
                        <label className="relative cursor-pointer flex">
                        <input
                            type="checkbox"
                            onChange={() => setClickedSplit(prev => !prev)}
                            checked={clickedSplit}
                            className="cursor-pointer peer appearance-none h-[22px] w-[22px] shrink-0 rounded-xs border-2 border-[#787b7f] bg-transparent checked:bg-blue-500 checked:border-blue-500"
                        />
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
                        <h1 className="text-xl font-medium text-white">Order Split</h1>
                    </div>
                    <div className="flex gap-5 w-full max-w-full">
                    <div className="flex flex-col gap-1.5 w-full basis-1/2">
                        <h2 className="text-white font-medium">Min price</h2>
                        <input 
                          type="number" 
                          readOnly={!clickedSplit} 
                          disabled={!clickedSplit} 
                          placeholder="Enter Price" 
                          className={`inputs ${clickedSplit ? "" : "bg-gray-800"}`}
                          value={clickedSplit ? (minPrice || '') : ''}
                          onChange={(e) => setMinPrice(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5 w-full basis-1/2">
                        <h2 className="text-white font-medium">Max price</h2>
                        <input 
                          type="number" 
                          readOnly={!clickedSplit} 
                          disabled={!clickedSplit} 
                          placeholder="Enter Price" 
                          className={`inputs ${clickedSplit ? "" : "bg-gray-800"}`}
                          value={clickedSplit ? (maxPrice || '') : ''}
                          onChange={(e) => setMaxPrice(parseFloat(e.target.value) || 0)}
                        />
                    </div>
                </div>
            </div>

            <div>
            <h1 className="text-[#B0B0B0] text-sm inter">Split: <span className="text-white">{leverage}</span></h1>
                              <Slider.Root
                                  className="relative flex items-center select-none touch-none w-full h-8"
                                  min={0}
                                  max={30}
                                  step={1}
                                  disabled={!clickedSplit}
                                  value={[leverage]}
                                  onValueChange={([val]) => setLeverage(val)}
                              >
                                  <Slider.Track className={`bg-[#E5E5E5] relative grow rounded-full h-2 ${!clickedSplit ? "bg-gray-700" : "bg-[#E5E5E5]"}`}>
                                        <Slider.Range className={`absolute h-full rounded-full ${!clickedSplit ? "bg-gray-700" : "bg-yellow-400"}`} />
                                   </Slider.Track>
                                  <Slider.SliderThumb >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="outline-none" width="18" height="18" viewBox="0 0 16 16" fill="none">
                                          <path d="M8 15.4998C12.1421 15.4998 15.5 12.1419 15.5 7.99986C15.5 3.8577 12.1421 0.499847 8 0.499847C3.85788 0.499847 0.5 3.8577 0.5 7.99986C0.5 12.1419 3.85788 15.4998 8 15.4998Z" fill={!clickedSplit ? "bg-gray-700" : "#F0B90B"} />
                                      </svg>
                                  </Slider.SliderThumb>
                              </Slider.Root>
            
                              <div className="flex justify-between text-sm text-white mt-1 font-bold">
                                  <span>0</span>
                                  <span>30</span>
                              </div>
                          </div>
            <div>
                    <h1 className="text-[#B0B0B0] text-sm inter">Scale: <span className="text-white">{value4 === 0 ? "Lower" : value4 === 1 ? "Mid point" : value4 === 2 ? "Upper" : ""}</span></h1>
                              <Slider.Root
                                  className="relative flex items-center select-none touch-none w-full h-8"
                                  min={0}
                                  max={2}
                                  step={1}
                                  disabled={!clickedSplit}
                                  value={[value4]}
                                  onValueChange={([val]) => setValue4(val)}
                              >
                                  <Slider.Track className={`bg-[#E5E5E5] relative grow rounded-full h-2 ${!clickedSplit ? "bg-gray-700" : "bg-[#E5E5E5]"}`}>
                                      <Slider.Range className={`absolute h-full rounded-full ${!clickedSplit ? "bg-gray-700" : "bg-yellow-400"}`} />
                                  </Slider.Track>
                                  <Slider.SliderThumb >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="outline-none" width="18" height="18" viewBox="0 0 16 16" fill="none">
                                          <path d="M8 15.4998C12.1421 15.4998 15.5 12.1419 15.5 7.99986C15.5 3.8577 12.1421 0.499847 8 0.499847C3.85788 0.499847 0.5 3.8577 0.5 7.99986C0.5 12.1419 3.85788 15.4998 8 15.4998Z" fill={!clickedSplit ? "bg-gray-700" : "#F0B90B"} />
                                      </svg>
                                  </Slider.SliderThumb>
                              </Slider.Root>
            
                              <div className="flex justify-between text-sm text-white mt-1 font-bold">
                                  <span>Lower band</span>
                                  <span>|</span>
                                  <span>Upper band</span>
                              </div>
                          </div>
            
            {/* Basket Order Component */}
            <BasketOrder clicked={clickedBasket} setClicked={setClickedBasket} />
            
            <ButtonWrapper tradingParams={tradingParams} />
        </div>
    )
}

export default Market