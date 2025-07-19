import MidUp from "./MidUp";
import TradingViewWidget from "./TradingViewWidget";

interface Prop {
  setModal: React.Dispatch<React.SetStateAction<boolean>>
}

const Graph = ({ setModal }: Prop) => {
  return (
    <>
      <MidUp setModal={setModal} />
      <article className="p-3 flex items-center justify-center h-[600px]">
        <div className="w-full h-full">
          <TradingViewWidget />
        </div>
      </article>
    </>
  )
}

export default Graph