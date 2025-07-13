import { useState } from "react";
import TP from "./TP/TP";

const Profits = () => {
  const [profitNum] = useState<number>(7);
  const [profits, setProfits] = useState<(number | undefined)[]>(Array(profitNum).fill(undefined));
  const [size, setSize] = useState<(number | undefined)[]>(Array(profitNum).fill(undefined));
  const [clickedProfits, setClickedProfits] = useState<boolean>(false);
  const [enabledRows, setEnabledRows] = useState<boolean[]>(Array(profitNum).fill(false));

  const items = Array.from({ length: profitNum }, (_, i) => i);

  const handleSizeChange = (index: number, value: string) => {
    const updated = [...size];
    updated[index] = value === "" ? undefined : Number(value);
    setSize(updated);
  };

  const handleProfitChange = (index: number, value: string) => {
    const updated = [...profits];
    updated[index] = value === "" ? undefined : Number(value);
    setProfits(updated);
  };

  const handleReset = (id: number) => {
    const updatedProfits = [...profits];
    const updatedSize = [...size];
    updatedProfits[id] = undefined;
    updatedSize[id] = undefined;
    setProfits(updatedProfits);
    setSize(updatedSize);
  };

  const toggleRowEnabled = (index: number) => {
    const updated = [...enabledRows];
    updated[index] = !updated[index];
    setEnabledRows(updated);
  };

  return (
    <>
      <TP clickedProfits={clickedProfits} setClickedProfits={setClickedProfits} />
      <article className="flex flex-col gap-3 -mt-5">
        {items.map((item) => {
          const isEnabled = !clickedProfits || enabledRows[item];
          return (
            <div key={item} className="line">
              <div className="inputLeft">
                <label className="relative cursor-pointer flex">
                  <input
                    type="checkbox"
                    checked={enabledRows[item]}
                    onChange={() => toggleRowEnabled(item)}
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
                <input
                  type="number"
                  value={size[item] ?? ""}
                  disabled={!isEnabled}
                  readOnly={!isEnabled}
                  onChange={(e) => handleSizeChange(item, e.target.value)}
                  className={`placeholder:text-[rgba(255,255,255,0.60)] w-full text-white outline-none ${isEnabled ? "" : "bg-gray-800"}`}
                  placeholder="Enter size"
                />
              </div>
              <div className="inputRight">
                <input
                  type="number"
                  value={profits[item] ?? ""}
                  disabled={!isEnabled}
                  readOnly={!isEnabled}
                  onChange={(e) => handleProfitChange(item, e.target.value)}
                  className={`flex-grow placeholder:text-[rgba(255,255,255,0.60)] w-full text-white outline-none ${isEnabled ? "" : "bg-gray-800"}`}
                  placeholder="Enter profit"
                />
                <button
                  onClick={() => handleReset(item)}
                  disabled={!isEnabled}
                  className="py-[5px] px-2.5 text-sm bg-[rgba(240,185,11,0.30)] text-[#FFC200] rounded-[4px]"
                >
                  Reset
                </button>
              </div>
            </div>
          );
        })}
      </article>
    </>
  );
};

export default Profits;
