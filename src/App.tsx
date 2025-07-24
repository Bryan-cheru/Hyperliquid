import { useState } from "react"
import AccountsWrapper from "./components/AccountsManagment/AccountsWrapper"
import Graph from "./components/Graph/Graph"
import Navbar from "./components/Navbar/Navbar"
import Tabs from "./components/Tabs/Tabs"
import TradingControls, { type Buttons } from "./components/TradingControls/TradingControls"
import { TradingProvider } from "./contexts/TradingContext"
import { MultiAccountTradingProvider } from "./contexts/MultiAccountTradingContext"

function App() {

  const [type, setType] = useState<Buttons>("Limit");
  const [accNum, setAccNum] = useState<number>(10);
  const [sidebar, setSidebar] = useState<boolean>(false);
  const [modal, setModal] = useState<boolean>(false)


  return (  
    <TradingProvider>
      <MultiAccountTradingProvider>
        <section className="w-full min-h-screen bg-[#0a0e13]">
        <Navbar accNum={accNum} />
        {modal && (
          <div className="fixed w-full inset-0 flex items-center justify-center z-50 backdrop-blur-[2px]">
            <AccountsWrapper setModal={setModal} setAccNum={setAccNum} />
          </div>
        )}
        <div className="flex w-full">
          {sidebar && (
            <button className="cursor-pointer rounded-tl-[8px] rounded-tr-none rounded-br-none rounded-bl-[8px]
             mt-80 transform rotate-180 flex justify-center shrink-0 items-center bg-[#374151] py-[49px] px-2 h-[111px]"
              onClick={() => setSidebar(prev => !prev)}>
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="13" viewBox="0 0 8 13" fill="none">
                <path d="M7.5 12.5L0 12.5L0 0.5L7.5 0.5L7.5 12.5Z" />
                <path d="M0.220703 5.97032C-0.0722656 6.26328 -0.0722656 6.73907 0.220703 7.03203L4.7207 11.532C5.01367 11.825 5.48945 11.825 5.78242 11.532C6.07539 11.2391 6.07539 10.7633 5.78242 10.4703L1.81211 6.5L5.78008 2.52969C6.07305 2.23672 6.07305 1.76094 5.78008 1.46797C5.48711 1.175 5.01133 1.175 4.71836 1.46797L0.218359 5.96797L0.220703 5.97032Z" fill="#D1D5DB" />
              </svg>
            </button>
          )}

          <div className="flex flex-col flex-grow min-w-0 -m-1">
            <Graph setModal={setModal} />
            <Tabs />
          </div>

          <div className="w-[350px] lg:w-[420px] shrink-0">
            <TradingControls type={type} setType={setType} />
          </div>
        </div>
      </section>
      </MultiAccountTradingProvider>
    </TradingProvider>
  )
}

export default App
