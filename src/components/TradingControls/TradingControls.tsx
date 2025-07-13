import Limit from "./Market&Limit/Limit";
import Market from "./Market&Limit/Market";
import { useTrading } from "../../hooks/useTrading";

export type Buttons = "Market" | "Limit";

interface Props {
  setType: React.Dispatch<React.SetStateAction<Buttons>>;
  type: string;
}

const TradingControls = ({ setType, type }: Props) => {
  const { connectedAccount } = useTrading();

  return (
    <section className="bg-[#181C29] min-h-screen h-fit robot overflow-auto">
      <div className="flex flex-col gap-8 p-5 mr-3 justify-center">
        <div className="top">
          <h1 className="text-[#F0B90B] font-bold font-sans-Roboto text-xl">TRADING CONTROLS</h1>
          
          {/* Connected Account Status */}
          <div className="mt-2 mb-3 p-2 bg-[#24293A] rounded-md">
            {connectedAccount ? (
              <div className="text-xs">
                <div className="text-green-400 font-semibold">🟢 Trading Account Connected</div>
                <div className="text-gray-300">{connectedAccount.accountName}</div>
                <div className="text-gray-400">{connectedAccount.pair} • Balance: {connectedAccount.balance}</div>
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                ⚠️ No trading account connected. Open Account Management to connect.
              </div>
            )}
          </div>
          
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