import { useTrading } from '../../hooks/useTrading';

interface Props {
  setModal: React.Dispatch<React.SetStateAction<boolean>>
}

const MidUp = ({ setModal }: Props) => {
  const { connectedAccount, marketPrices, getPrice } = useTrading();

  const handleModal = () => {
      setModal(prev => !prev);
  };

  // Get BTC price and market data
  const btcPrice = getPrice('BTC') || 0;
  const btcMarketData = marketPrices.get('BTC');
  const priceChange = btcMarketData?.change24h || 0;
  const isPositive = priceChange >= 0;

  // Format price and percentage
  const formattedPrice = btcPrice.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  const formattedChange = `${isPositive ? '+' : ''}${priceChange.toFixed(2)}%`;

  return (
      <nav className="-mx-1 roboto flex justify-between gap-2.5 p-5 bg-[#1E2329] border border-[#292E35]">
          <div className="flex items-center gap-4">
            <h1 className="topic">
              BTC/USDT - ${formattedPrice} 
              <span className={`ml-2 ${isPositive ? 'text-[rgba(0,255,76,0.80)]' : 'text-red-400'}`}>
                ({formattedChange})
              </span>
            </h1>
            {connectedAccount && (
              <div className="text-sm text-gray-400">
                • Master: {connectedAccount.accountName}
              </div>
            )}
          </div>
          
          <button 
            onClick={handleModal} 
            className={`flex py-[5px] h-9 items-center gap-2 px-2.5 text-white cursor-pointer text-xs font-bold rounded-[4px] transition-colors ${
              connectedAccount 
                ? 'bg-[#24293A] hover:bg-[#2A3142] border border-[#373A45]' 
                : 'bg-[rgba(0,255,76,0.80)] hover:bg-[rgba(0,255,76,0.90)]'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width={12} viewBox="0 0 448 512">
              <path fill="white" d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" />
            </svg>
            {connectedAccount ? 'Manage Accounts' : 'Add Account'}
          </button>
      </nav>
  )
}

export default MidUp