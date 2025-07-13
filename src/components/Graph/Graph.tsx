import lgGraph from "./img/tradeview chart sm.png"
import MidUp from "./MidUp";

interface Prop {
  setModal: React.Dispatch<React.SetStateAction<boolean>>
  sidebar: boolean;
}

const Graph = ({ setModal, sidebar }: Prop) => {
  return (
    <>
      <MidUp setModal={setModal} />
      <article className="p-3 flex items-center justify-center">
        <img src={lgGraph} className="size w-full" alt="graph" />
      </article>
    </>
  )
}

export default Graph