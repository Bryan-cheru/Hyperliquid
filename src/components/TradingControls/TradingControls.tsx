import Limit from "./Market&Limit/Limit";
import Market from "./Market&Limit/Market";

export type Buttons = "Market" | "Limit";

interface Props {
  setType: React.Dispatch<React.SetStateAction<Buttons>>;
  type: string;
}

const TradingControls = ({ setType, type }: Props) => {

  return (
    <section className="bg-[#181C29] min-h-screen h-fit robot overflow-auto">
      <div className="flex flex-col gap-6 p-5 mr-3">
        <div className="top">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-[#F0B90B] font-bold font-sans-Roboto text-xl">TRADING CONTROLS</h1>
          </div>
          
          {/* Order Type Toggle */}
          <div className="flex gap-0 bg-[#24293A] rounded-[6px] p-1">
            <button 
              onClick={() => setType("Market")} 
              className={`py-2 cursor-pointer px-4 rounded-[4px] font-bold text-sm transition-all ${
                type === "Market" ? "bg-[#F0B90B] text-black" : "bg-transparent text-white"
              }`}
            >
              Market
            </button>
            <button 
              onClick={() => setType("Limit")} 
              className={`py-2 cursor-pointer px-4 rounded-[4px] font-bold text-sm transition-all ${
                type === "Limit" ? "bg-[#F0B90B] text-black" : "bg-transparent text-white"
              }`}
            >
              Limit
            </button>
          </div>
        </div>
        
        {type === "Limit" ? <Limit /> : <Market selectedOrderType={type as "Market" | "Limit"} />}
      </div>
    </section>
  )
}

export default TradingControls