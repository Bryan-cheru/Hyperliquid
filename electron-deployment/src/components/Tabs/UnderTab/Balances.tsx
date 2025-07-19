import { useTrading } from '../../../hooks/useTrading';

const Balances = () => {
  const { connectedAccount, marketPrices } = useTrading();

  // Mock balance data when account is connected
  const balances = connectedAccount ? [
    {
      coin: 'USDC',
      totalBalance: parseFloat(connectedAccount.balance || '0'),
      availableBalance: parseFloat(connectedAccount.balance || '0') * 0.8, // 80% available
      usdcValue: parseFloat(connectedAccount.balance || '0'),
      pnl: 0,
      pnlPercent: 0,
      contract: 'Spot'
    },
    {
      coin: 'BTC',
      totalBalance: 0.025,
      availableBalance: 0.020,
      usdcValue: 0.025 * (marketPrices.get('BTC')?.price || 43000),
      pnl: 127.50,
      pnlPercent: 2.34,
      contract: 'Perp'
    }
  ] : [];

  return (
    <>
      {/* Container for the whole balances section */}
      <article className="text-xs inter rounded-[8px] text-[#A0A9B4]  ">

        {/* Header Row for balance table */}
        <div className="text-center flex overflow-x-auto no-scrollbar border-b border-[#2A3441] bg-[#151C26] font-medium text-[#A0A9B4] text-xs  ">
          {/* Column: Coin */}
          <div className="flex items-center justify-center min-w-[100px] px-8 py-3 text-[10px] ml-9">Coin</div>

          {/* Column: Total Balance */}
          <div className="flex items-center justify-center min-w-[120px] px-8 py-3 text-[10px]">Total Balance</div>

          {/* Column: Available Balance */}
          <div className="flex items-center justify-center min-w-[140px] px-8 py-3 text-[10px]">Available Balance</div>

          {/* Column: USDC Value with arrow icon */}
          <div className="flex items-center justify-center min-w-[120px] px-8 py-3 gap-1 text-[10px]">
            <p>USDC Value</p>
            {/* Down arrow icon */}
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none">
              <g clipPath="url(#clip0_237_1698)">
                <path d="M5.59536 10.0297C5.88833 10.3227 6.36411 10.3227 6.65708 10.0297L11.1571 5.52974C11.45 5.23677 11.45 4.76099 11.1571 4.46802C10.8641 4.17505 10.3883 4.17505 10.0954 4.46802L6.12505 8.43833L2.15474 4.47036C1.86177 4.17739 1.38599 4.17739 1.09302 4.47036C0.800049 4.76333 0.800049 5.23911 1.09302 5.53208L5.59302 10.0321L5.59536 10.0297Z" fill="#A0A9B4" />
              </g>
              <defs>
                <clipPath id="clip0_237_1698">
                  <path d="M0.125 0.5H12.125V12.5H0.125V0.5Z" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </div>

          {/* Column: PNL (ROE%) */}
          <div className="flex items-center justify-center min-w-[140px] px-8 ">
            <p className="border-[#A0A9B4] text-[10px]">PNL (ROE%)</p>
          </div>

          {/* Column: Contract */}
          <div className="flex items-center justify-center min-w-[100px] px-8 text-[10px]">Contract</div>
        </div>

        {/* Dynamic Content: Show balances if connected, empty state if not */}
        {connectedAccount ? (
          balances.length > 0 ? (
            <div className="max-h-[588px] overflow-y-auto">
              {balances.map((balance, index) => (
                <div key={index} className="flex border-b border-[#2A3441] hover:bg-[#1A1E2A] transition-colors">
                  {/* Coin */}
                  <div className="flex items-center justify-center min-w-[100px] px-8 py-4 ml-9">
                    <span className="text-white font-medium">{balance.coin}</span>
                  </div>

                  {/* Total Balance */}
                  <div className="flex items-center justify-center min-w-[120px] px-8 py-4">
                    <span className="text-white">{balance.totalBalance.toFixed(6)}</span>
                  </div>

                  {/* Available Balance */}
                  <div className="flex items-center justify-center min-w-[140px] px-8 py-4">
                    <span className="text-white">{balance.availableBalance.toFixed(6)}</span>
                  </div>

                  {/* USDC Value */}
                  <div className="flex items-center justify-center min-w-[120px] px-8 py-4">
                    <span className="text-white">${balance.usdcValue.toFixed(2)}</span>
                  </div>

                  {/* PNL (ROE%) */}
                  <div className="flex items-center justify-center min-w-[140px] px-8 py-4">
                    <span className={balance.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {balance.pnl >= 0 ? '+' : ''}${balance.pnl.toFixed(2)} ({balance.pnlPercent >= 0 ? '+' : ''}{balance.pnlPercent.toFixed(2)}%)
                    </span>
                  </div>

                  {/* Contract */}
                  <div className="flex items-center justify-center min-w-[100px] px-8 py-4">
                    <span className="text-gray-400">{balance.contract}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <article className="flex flex-col justify-center items-center h-[588px]">
              <svg xmlns="http://www.w3.org/2000/svg" width="37" height="37" viewBox="0 0 37 37" fill="none">
                <g clipPath="url(#clip0_237_1770)">
                  <path d="M18.5 4.5C10.768 4.5 4.5 10.768 4.5 18.5C4.5 26.232 10.768 32.5 18.5 32.5C26.232 32.5 32.5 26.232 32.5 18.5C32.5 10.768 26.232 4.5 18.5 4.5ZM18.5 6.5C25.404 6.5 30.5 11.596 30.5 18.5C30.5 25.404 25.404 30.5 18.5 30.5C11.596 30.5 6.5 25.404 6.5 18.5C6.5 11.596 11.596 6.5 18.5 6.5Z" fill="#4B5563" />
                </g>
                <defs>
                  <clipPath id="clip0_237_1770">
                    <path d="M0.84375 0.5H36.8438V36.5H0.84375V0.5Z" fill="white" />
                  </clipPath>
                </defs>
              </svg>
              <h1 className="text-[#A0A9B4] text-base mb-3 mt-0.5 text-center">No balances yet</h1>
              <p className="text-[#6B7280] text-sm text-center">
                Your balances will appear here once you deposit funds
              </p>
            </article>
          )
        ) : (
          <article className="flex flex-col justify-center items-center h-[588px]">
            <svg xmlns="http://www.w3.org/2000/svg" width="37" height="37" viewBox="0 0 37 37" fill="none">
              <g clipPath="url(#clip0_237_1770)">
                <path d="M18.5 4.5C10.768 4.5 4.5 10.768 4.5 18.5C4.5 26.232 10.768 32.5 18.5 32.5C26.232 32.5 32.5 26.232 32.5 18.5C32.5 10.768 26.232 4.5 18.5 4.5ZM18.5 6.5C25.404 6.5 30.5 11.596 30.5 18.5C30.5 25.404 25.404 30.5 18.5 30.5C11.596 30.5 6.5 25.404 6.5 18.5C6.5 11.596 11.596 6.5 18.5 6.5Z" fill="#F59E0B" />
              </g>
              <defs>
                <clipPath id="clip0_237_1770">
                  <path d="M0.84375 0.5H36.8438V36.5H0.84375V0.5Z" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <h1 className="text-[#F0B90B] text-base mb-3 mt-0.5 text-center">Connect Master Account</h1>
            <p className="text-[#6B7280] text-sm text-center">
              Connect your master account to view balances and trading data
            </p>
          </article>
        )}

      </article>
    </>
  );
};

export default Balances;
