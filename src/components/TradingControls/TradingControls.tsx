import Limit from "./Market&Limit/Limit";
import Market from "./Market&Limit/Market";
import { useTrading } from "../../hooks/useTrading";

export type Buttons = "Market" | "Limit";

interface Props {
  setType: React.Dispatch<React.SetStateAction<Buttons>>;
  type: string;
}

const TradingControls = ({ setType, type }: Props) => {
  const { connectedAccount, agentAccount } = useTrading();

  return (
    <section className="bg-[#181C29] min-h-screen h-fit robot overflow-auto">
      <div className="flex flex-col gap-8 p-5 mr-3 justify-center">
        <div className="top">
          <h1 className="text-[#F0B90B] font-bold font-sans-Roboto text-xl">TRADING CONTROLS</h1>
          
          {/* Master Account Status */}
          <div className="mt-2 mb-3 p-2 bg-[#24293A] rounded-md">
            {connectedAccount ? (
              <div className="text-xs">
                <div className="text-blue-400 font-semibold">�️ Master Account Connected (View Only)</div>
                <div className="text-gray-300">{connectedAccount.accountName}</div>
                <div className="text-gray-400">{connectedAccount.pair} • Balance: {connectedAccount.balance}</div>
              </div>
            ) : (
              <div className="text-xs text-gray-400">
                ⚠️ No master account connected. Connect to view account data.
              </div>
            )}
          </div>

          {/* Agent Account Status for Trading */}
          <div className="mt-2 mb-3 p-2 bg-[#2A2F3A] rounded-md border border-[#373A45]">
            <div className="text-xs">
              <div className="text-orange-400 font-semibold">🤖 Agent Account Status</div>
              {agentAccount ? (
                <div>
                  <div className="text-green-400 mt-1">✅ Agent Account Connected</div>
                  <div className="text-gray-300">{agentAccount.accountName}</div>
                  <div className="text-gray-400 text-[10px] mt-1">
                    Ready to execute trades with agent wallet
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-red-400 mt-1">❌ No Agent Account</div>
                  <div className="text-gray-400 text-[10px] mt-1">
                    Add an agent account to enable trading
                  </div>
                  <button className="mt-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-[10px] rounded transition-colors">
                    Add Agent Account
                  </button>
                </div>
              )}
            </div>
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