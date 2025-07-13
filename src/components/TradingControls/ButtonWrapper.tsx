import { useState } from "react";
import { useTrading } from "../../hooks/useTrading";
import type { TradingOrder } from "../../contexts/TradingContext";

const ButtonWrapper = () => {
  const { connectedAccount, isTrading, executeOrder, closeAllPositions, cancelAllOrders } = useTrading();
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Handle Long/Short trading
  const handleTrade = async (side: "buy" | "sell") => {
    if (!connectedAccount) {
      setStatusMessage("Please connect an account first");
      return;
    }

    // This would normally get values from the trading form (leverage, size, etc.)
    // For now, using default values as example
    const order: TradingOrder = {
      symbol: connectedAccount.pair,
      side,
      orderType: "market", // This should come from the form state
      quantity: 0.01, // This should come from position size input
      leverage: 10, // This should come from leverage slider
    };

    const result = await executeOrder(order);
    setStatusMessage(result.message);
    
    // Clear message after 3 seconds
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleCloseAll = async () => {
    const result = await closeAllPositions();
    setStatusMessage(result.message);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleCancelAll = async () => {
    const result = await cancelAllOrders();
    setStatusMessage(result.message);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  return (
    <article>
        <div className="flex flex-col items-center justify-center gap-5">
            {/* Account Status */}
            <div className="text-xs text-center w-full">
              {connectedAccount ? (
                <span className="text-green-400">
                  ✓ {connectedAccount.accountName} Ready
                </span>
              ) : (
                <span className="text-gray-400">
                  No account connected for trading
                </span>
              )}
            </div>

            {/* Status Message */}
            {statusMessage && (
              <div className="text-xs text-center text-yellow-400 w-full">
                {statusMessage}
              </div>
            )}

            <div className="flex gap-5 w-full">
                <button 
                  onClick={() => handleTrade("buy")}
                  disabled={!connectedAccount || isTrading}
                  className={`long !w-full ${
                    !connectedAccount || isTrading 
                      ? "opacity-50 cursor-not-allowed" 
                      : ""
                  }`}
                >
                  {isTrading ? "..." : "LONG"}
                </button>
                <button 
                  onClick={() => handleTrade("sell")}
                  disabled={!connectedAccount || isTrading}
                  className={`short !w-full ${
                    !connectedAccount || isTrading 
                      ? "opacity-50 cursor-not-allowed" 
                      : ""
                  }`}
                >
                  {isTrading ? "..." : "SHORT"}
                </button>
            </div>
            <div className="flex flex-col w-full items-center justify-center gap-3">
                <button 
                  onClick={handleCloseAll}
                  disabled={!connectedAccount || isTrading}
                  className={`positions ${
                    !connectedAccount || isTrading 
                      ? "opacity-50 cursor-not-allowed" 
                      : ""
                  }`}
                >
                  {isTrading ? "..." : "Close All Positions"}
                </button>
                <button 
                  onClick={handleCancelAll}
                  disabled={!connectedAccount || isTrading}
                  className={`orders ${
                    !connectedAccount || isTrading 
                      ? "opacity-50 cursor-not-allowed" 
                      : ""
                  }`}
                >
                  {isTrading ? "..." : "Cancel All Orders"}
                </button>
            </div>
        </div>
    </article>
  )
}

export default ButtonWrapper