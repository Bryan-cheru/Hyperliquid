interface Props {
    setClickedProfits: React.Dispatch<React.SetStateAction<boolean>>;
    clickedProfits: boolean;
}

const TP = ({ clickedProfits, setClickedProfits }: Props) => {
  return (
      <div className="flexColAfter items-start gap-4">
          <div className="flex gap-3">
              <p className="text-[#00FF4C] font-bold">Take profits (7 max)</p>
              <div className="flex gap-2">
                  <label className="relative cursor-pointer flex">
                      <input
                          type="checkbox"
                          onChange={() => setClickedProfits(prev => !prev)}
                          checked={clickedProfits}
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
                  <p className="text-white">TP Step</p>
              </div>
          </div>
      </div>
  )
}

export default TP