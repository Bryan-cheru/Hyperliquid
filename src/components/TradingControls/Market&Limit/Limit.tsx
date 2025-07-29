import * as Slider from "@radix-ui/react-slider"
import { useState, useEffect } from "react";
import ButtonWrapper from "../ButtonWrapper";
import LimitChaser from "../LimitChaser";
import { LimitOrder } from "../LimitOrder";
import Profits from "../Profits";
import Leverage from "../Leverage/Leverage";
import BasketOrder from "../BasketOrder";
import EntryPosition from "../EntryPosition";
import { useTrading } from "../../../contexts/TradingContext";
import { type TradingParams } from "./Market";

const Limit = () => {

    const { getPrice } = useTrading(); // Get current market price
    const [leverage, setLeverage] = useState<number>(10);
    const [value, setValue] = useState<number>(0);
    const [value2, setValue2] = useState<number>(0);
    const [clicked, setClicked] = useState<boolean>(false);
    const [clickedSplit, setClickedSplit] = useState<boolean>(false);
    const [clickedBasket, setClickedBasket] = useState<boolean>(false);
    const [clickedEntryPosition, setClickedEntryPosition] = useState<boolean>(false);
    const [limitPrice, setLimitPrice] = useState<number>(0); // Start with 0, will be set from market price

    // Get current BTC price and set reasonable limit price
    useEffect(() => {
        const currentPrice = getPrice('BTC');
        if (currentPrice && currentPrice > 0 && limitPrice === 0) {
            // Set initial limit price to current market price
            setLimitPrice(currentPrice);
            console.log(`🔄 Initial limit price set to current BTC price: $${currentPrice.toLocaleString()}`);
        } else if (!currentPrice && limitPrice === 0) {
            // Fallback to reasonable BTC price if no market data
            setLimitPrice(97000);
            console.log('🔄 Using fallback limit price: $97,000');
        }
    }, [getPrice, limitPrice]);

    // Handle price change from LimitOrder component
    const handlePriceChange = (price: number) => {
        console.log('🔍 Limit component - received price change:', price);
        setLimitPrice(price);
    };

    // Create trading parameters to pass to ButtonWrapper
    const tradingParams: TradingParams = {
        leverage: value2,
        positionSize: value,
        stopLoss: 0, // This would come from the stop loss slider
        orderType: "Limit",
        triggerPrice: limitPrice, // ⚠️ POTENTIAL BUG: For simple limit orders, the limit price IS the trigger price - but this might conflict with Market component's trigger price
        stopPrice: undefined,
        orderSplit: clickedSplit,
        minPrice: undefined,
        maxPrice: undefined,
        splitCount: leverage,
        scaleType: 'Lower'
    };

    // Debug logging
    console.log('🔍 Limit Component - Trading Params:', tradingParams);
    console.log('🔍 Limit Component - limitPrice:', limitPrice);
    console.log('🔍 Limit Component - triggerPrice in params:', tradingParams.triggerPrice);
    console.log('🔍 Limit Component - current BTC price from context:', getPrice('BTC'));

  return (
    <>
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
              </div>
              <Profits />
              <LimitOrder onPriceChange={handlePriceChange} />
              <div className="flex gap-3 items-center -mt-3 -mb-3">
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
              <div className="flex gap-5">
                  <div className="flex flex-col gap-1.5 w-full">
                      <h2 className="text-white font-medium inter">Min Price</h2>
                      <input type="number" readOnly={!clickedSplit} disabled={!clickedSplit} placeholder="Enter Price" className={`inputs ${clickedSplit ? "" : "bg-gray-800"}`} />
                  </div>
                  <div className="flex flex-col gap-1.5 w-full">
                      <h2 className="text-white font-medium inter">Max Price</h2>
                      <input type="number" readOnly={!clickedSplit} disabled={!clickedSplit} placeholder="Enter Price" className={`inputs ${clickedSplit ? "" : "bg-gray-800"}`} />
                  </div>
              </div>
              <div>
                  <h1 className="text-[#B0B0B0] text-sm inter">Split: <span className="text-white">{leverage}</span></h1>
                  <Slider.Root
                      className="relative flex items-center select-none touch-none w-full h-8"
                      min={0}
                      max={100}
                      disabled={!clickedSplit}
                      step={1}
                      value={[leverage]}
                      onValueChange={([val]) => setLeverage(val)}
                  >
                      <Slider.Track className={`bg-[#E5E5E5] relative grow rounded-full h-2 ${!clickedSplit ? "bg-gray-700" : "bg-[#E5E5E5]"}`}>
                          <Slider.Range className={`absolute h-full rounded-full ${!clickedSplit ? "bg-gray-700" : "bg-yellow-400"}`} />
                       </Slider.Track>
                      <Slider.SliderThumb>
                          <svg xmlns="http://www.w3.org/2000/svg" className="outline-none" width="18" height="18" viewBox="0 0 16 16" fill="none">
                              <path d="M8 15.4998C12.1421 15.4998 15.5 12.1419 15.5 7.99986C15.5 3.8577 12.1421 0.499847 8 0.499847C3.85788 0.499847 0.5 3.8577 0.5 7.99986C0.5 12.1419 3.85788 15.4998 8 15.4998Z" fill={!clickedSplit ? "bg-gray-700" : "#F0B90B"} />
                          </svg>
                      </Slider.SliderThumb>
                  </Slider.Root>

                  <div className="flex justify-between text-sm text-white mt-1 font-bold">
                      <span>0</span>
                      <span>100</span>
                  </div>
              </div>
              <div>
                  <h1 className="text-[#B0B0B0] text-sm inter">Scale: <span className="text-white">{value === 0 ? "Lower" : value === 1 ? "Mid point" : value === 2 ? "Upper" : ""}</span></h1>
                  <Slider.Root
                      className="relative flex items-center select-none touch-none w-full h-8"
                      min={0}
                      max={2}
                      disabled={!clickedSplit}
                      step={1}
                      value={[value]}
                      onValueChange={([val]) => setValue(val)}
                  >
                      <Slider.Track className={`bg-[#E5E5E5] relative grow rounded-full h-2 ${!clickedSplit ? "bg-gray-700" : "bg-[#E5E5E5]"}`}>
                          <Slider.Range className={`absolute h-full rounded-full ${!clickedSplit ? "bg-gray-700" : "bg-yellow-400"}`} />
                      </Slider.Track>
                      <Slider.SliderThumb>
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
              
              <BasketOrder clicked={clickedBasket} setClicked={setClickedBasket} />
              
              <LimitChaser setClicked={setClicked} clicked={clicked} />
              
              <EntryPosition setClicked={setClickedEntryPosition} clicked={clickedEntryPosition} />
              
              <ButtonWrapper tradingParams={tradingParams} />
          </div>
    </>
  )
}

export default Limit