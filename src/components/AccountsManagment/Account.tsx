import { useEffect, useRef, useState } from "react";
import AnimateHeight from "react-animate-height";
import { motion } from "framer-motion";

// Type definition for account data
interface AccountInfo {
  title: string;
  num: number;
  status: string;
  pair: string;
  leverage: string;
  balance: string;
  pnl: string;
  selected: boolean;
}

// Props for the Account component
interface AccountProps {
  acc: AccountInfo;
  id: number;
  getId: (id: number) => void;
  getName: (name: string) => void;
}

const Account = ({ acc, id, getId, getName }: AccountProps) => {
  const [clicked, setClicked] = useState<boolean>(false); // State to toggle expand/collapse
  const [masterChecked, setMasterChecked] = useState(false); // State for MASTER PAIR checkbox
  const [subscriberChecked, setSubscriberChecked] = useState(false); // State for SUBSCRIBER PAIR checkbox
  const cardRef = useRef<HTMLDivElement | null>(null); // Ref to detect outside clicks

  // Effect to close the card dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setClicked(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handles click on the card; expands it and notifies parent of selected ID and Name
  const handleCardClick = () => {
    setClicked((prev) => {
      const next = !prev;
      if (next) {
        getId(id);
        getName(`${acc.title} ${acc.num}`);
      }
      return next;
    });
  };

  return (
    <motion.article
      ref={cardRef}
      onClick={handleCardClick}
      className={`self-start flex flex-col w-[460px] max-w-full bg-[#23272E] p-5 transition-all duration-300 relative rounded-xl ${
        clicked ? "border border-[#F0B90B]" : ""
      } ${acc.selected ? "ring-2 ring-green-400" : ""}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header Section */}
      <div className="flex justify-between items-center space-y-6">
        <h1 className="title text-sm">
          {acc.title} {acc.num}
        </h1>

        {/* Selection checkbox + Status */}
        <div className="flex gap-3 items-center justify-end">
          <label className="relative cursor-pointer flex">
            <input
              type="checkbox"
              className="cursor-pointer peer appearance-none h-[20px] w-[20px] shrink-0 rounded-xs border-2 border-[#787b7f] bg-transparent checked:bg-blue-500 checked:border-blue-500"
              checked={acc.selected}
               onClick={e => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                getId(id);

                // Reset internal toggles if unchecking
                if (!e.target.checked) {
                  setMasterChecked(false);
                  setSubscriberChecked(false);
                }
              }}
            />
            {/* Custom checkmark SVG */}
            <svg
              className="absolute left-1 top-1 h-3.5 w-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
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

          {/* Status tag */}
          <div
            className={`text-xs font-medium px-2 py-[2px] rounded ${
              acc.status === "INACTIVE"
                ? "text-[#FF3838] bg-[rgba(255,0,0,0.10)]"
                : "text-[#00FF4B]"
            }`}
          >
            {acc.status}
          </div>
        </div>
      </div>

      {/* Pair and leverage info */}
      <div className="flex justify-between text-[rgba(255,255,255,0.70)] text-xs">
        <p>{acc.pair}</p>
        <p>{acc.leverage}</p>
      </div>

      {/* Balance and PnL */}
      <div className="flex justify-between mt-6">
        <p className="text-[rgba(255,255,255,0.70)] text-xs">
          Balance:{" "}
          <span className="text-white font-bold text-xs">{acc.balance}</span>
        </p>
        <p className="text-[rgba(255,255,255,0.70)] text-xs">
          PnL: <span className="text-white font-bold text-xs">{acc.pnl}</span>
        </p>
      </div>

      {/* Expandable section with additional controls */}
      <AnimateHeight duration={400} height={clicked ? "auto" : 0}>
        <div className="mt-4 pt-4 flex flex-col gap-4 text-white text-sm">
          {/* API Key inputs */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs text-gray-400 font-semibold">API Keys</h3>
            <input
              type="text"
              placeholder="Public key"
              className="bg-[#1f2228] border border-gray-600 px-3 py-2 rounded-md text-xs"
                onClick={e => e.stopPropagation()}

            />
            <input
              type="password"
              placeholder="Private key"
              className="bg-[#1f2228] border border-gray-600 px-3 py-2 rounded-md text-xs"
                onClick={e => e.stopPropagation()}

            />
            <button className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-md w-fit text-xs font-medium ml-auto">
              Connect
            </button>
          </div>

          {/* MASTER / SUBSCRIBER toggle checkboxes */}
          <div className="flex justify-between items-center text-xs">
            <label className="flex items-center gap-2 relative">
              <span className="relative flex items-center">
                <input
                  type="checkbox"
                  disabled={!clicked || !acc.selected}
                  checked={masterChecked}
                  onChange={e => setMasterChecked(e.target.checked)}
                  onClick={e => e.stopPropagation()}
                  className="cursor-pointer peer appearance-none h-[16px] w-[16px] shrink-0 rounded-xs border-2 border-[#787b7f] bg-transparent checked:bg-blue-500 checked:border-blue-500 disabled:opacity-50"
                />
                {/* Checkmark icon */}
                <svg
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              MASTER PAIR
            </label>

            <label className="flex items-center gap-2 relative">
              <span className="relative flex items-center">
                <input
                  type="checkbox"
                  disabled={!clicked || !acc.selected}
                  checked={subscriberChecked}
                  onChange={e => setSubscriberChecked(e.target.checked)}
                  onClick={e => e.stopPropagation()}
                  className="cursor-pointer peer appearance-none h-[16px] w-[16px] shrink-0 rounded-xs border-2 border-[#787b7f] bg-transparent checked:bg-blue-500 checked:border-blue-500 disabled:opacity-50"
                />
                {/* Checkmark icon */}
                <svg
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              SUBSCRIBER PAIR
            </label>
          </div>

          {/* Dropdowns for selecting trading pairs */}
          <div className="flex justify-between gap-4">
            <select className="w-full bg-[#1f2228] border border-gray-600 px-3 py-2 rounded-md text-xs"   onClick={e => e.stopPropagation()}>
              <option>BTC/USDT</option>
              <option>ETH/USDT</option>
              <option>BNB/USDT</option>
            </select>
            <select className="w-full bg-[#1f2228] border border-gray-600 px-3 py-2 rounded-md text-xs"  onClick={e => e.stopPropagation()}>
              <option>BTC/USDT</option>
              <option>ETH/USDT</option>
              <option>BNB/USDT</option>
            </select>
          </div>
        </div>
      </AnimateHeight>
    </motion.article>
  );
};

export default Account;
