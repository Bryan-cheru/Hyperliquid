interface Props {
  setModal: React.Dispatch<React.SetStateAction<boolean>>
}

const MidUp = ({ setModal }: Props) => {

  const handleModal = () => {
      setModal(prev => !prev);
  };

  return (
      <nav className="-mx-1 roboto flex justify-between gap-2.5 p-5 bg-[#1E2329] border border-[#292E35]">
          <h1 className="topic">BTC/USDT - $43,251.47 <span className="text-[rgba(0,255,76,0.80)]">(+2.34%)</span></h1>
          <button onClick={handleModal} className="flex py-[5px] h-9 items-center gap-2 px-2.5 bg-[rgba(0,255,76,0.80)] text-white cursor-pointer text-xs font-bold rounded-[4px]">
            <svg xmlns="http://www.w3.org/2000/svg" width={12} viewBox="0 0 448 512">
              <path fill="white" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" />
            </svg>
              Add Account
          </button>
      </nav>
  )
}

export default MidUp