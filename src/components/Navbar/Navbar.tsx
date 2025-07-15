import { useState } from 'react';
import { useTrading } from '../../hooks/useTrading';
import ConnectionModal from '../ConnectionModal/ConnectionModal';

interface Props {
    accNum: number;
}

const Navbar = ({ accNum }: Props) => {
  const { connectedAccount, setConnectedAccount, openOrders, positions } = useTrading();
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  const handleDisconnect = () => {
    if (confirm('Are you sure you want to disconnect your trading account?')) {
      setConnectedAccount(null);
    }
  };

  // Calculate total PnL from positions
  const totalPnL = positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0);

  return (
      <nav className="bg-[#252930] w-full">
          <div className="boxShadow flex items-center justify-between px-5 py-[21px] roboto">
              <div className="flex gap-2.5 items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="34" height="35" viewBox="0 0 34 35" fill="none">
                      <path d="M15.5833 22.45C15.5833 22.0634 15.2699 21.75 14.8833 21.75H9.63262C9.11226 21.75 8.77381 21.2024 9.00652 20.737L17.0906 4.56889C17.4209 3.90821 18.4167 4.14328 18.4167 4.88193V12.55C18.4167 12.9366 18.7301 13.25 19.1167 13.25H24.3674C24.8877 13.25 25.2262 13.7976 24.9935 14.2631L16.9094 30.4312C16.5791 31.0918 15.5833 30.8568 15.5833 30.1181V22.45Z" fill="url(#paint0_linear_55_1862)" />
                      <defs>
                          <linearGradient id="paint0_linear_55_1862" x1="12.0417" y1="3.33335" x2="21.25" y2="34.5" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#F0B90B" />
                              <stop offset="1" stopColor="#F25D52" />
                          </linearGradient>
                      </defs>
                  </svg>
                  <h1 className="text-[#F0B90B] text-[29.6px] font-extrabold">Hyper Max</h1>
              </div>

              <div className="flex gap-8 mr-3 items-center">
                  {connectedAccount ? (
                    <>
                      {/* Connection Status */}
                      <div className="flex gap-1.5 items-center">
                          <div className="bg-[#00FF4D] rounded-full w-[9px] h-[9px]"></div>
                          <p className="text-base text-[#FBF9F9]">Connected</p>
                          <button
                            onClick={handleDisconnect}
                            className="ml-2 text-xs text-gray-400 hover:text-red-400 transition-colors"
                            title="Disconnect account"
                          >
                            ✕
                          </button>
                      </div>

                      {/* Active Orders */}
                      <div>
                          <p className="text-[#FBF9F9] text-base">Active Orders: <span className="text-white font-bold">{openOrders.length}</span></p>
                      </div>

                      {/* Total PnL */}
                      <div>
                          <p className="text-base text-[#FBF9F9]">Total PnL: 
                            <span className={`font-bold ${totalPnL >= 0 ? 'text-[rgba(0,255,76,0.80)]' : 'text-red-400'}`}>
                              {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                            </span>
                          </p>
                      </div>

                      {/* Account Info */}
                      <div>
                          <p className="text-base text-[#FBF9F9]">Account: <span className="font-bold text-white">{connectedAccount.accountName}</span></p>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Disconnected Status */}
                      <div className="flex gap-1.5 items-center">
                          <div className="bg-red-500 rounded-full w-[9px] h-[9px]"></div>
                          <p className="text-base text-gray-400">Not Connected</p>
                      </div>

                      {/* Connect Button */}
                      <button
                        onClick={() => setShowConnectionModal(true)}
                        className="px-4 py-2 bg-[#F0B90B] text-black font-semibold rounded-md hover:bg-[#D4A509] transition-colors"
                      >
                        Connect Master Account
                      </button>
                    </>
                  )}
              </div>
        </div>

        {/* Connection Modal */}
        <ConnectionModal 
          isOpen={showConnectionModal} 
          onClose={() => setShowConnectionModal(false)} 
        />
    </nav>
  )
}

export default Navbar