import Limit from "./Market&Limit/Limit";
import Market from "./Market&Limit/Market";
import Leverage from "./Leverage/Leverage";

export type Buttons = "Market" | "Limit";

interface Props {
  setType: React.Dispatch<React.SetStateAction<Buttons>>;
  type: string;
}

const TradingControls = ({ setType, type }: Props) => {

  return (
    <section className="bg-[#181C29] min-h-screen h-fit robot overflow-auto">
      <div className="flex flex-col gap-8 p-5 mr-3 justify-center">
        <div className="top">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-[#F0B90B] font-bold font-sans-Roboto text-xl">TRADING CONTROLS</h1>
          </div>
          
         
          
          {/* Order Type Toggle */}
          <div className="flex gap-2.5">
            <button onClick={() => setType("Market")} className={`py-1.5 cursor-pointer px-3 transform translate-x-3 rounded-[6px] font-bold ${type === "Market" ? "bg-[#F0B90B] text-black" : "bg-[#24293A] text-white"}`}>Market</button>
            <button onClick={() => setType("Limit")} className={`relative cursor-pointer py-1.5 px-3 rounded-[6px] font-bold ${type === "Limit" ? "bg-[#F0B90B] text-black" : "bg-[#24293A] text-white"}`} >Limit</button>
          </div>
        </div>
        {type === "Limit" ? <Limit /> : <Market />}
      </div>
    </section>
  )
}

export default TradingControls