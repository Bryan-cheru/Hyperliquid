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

    // Get the current trading pair from connected account
    // Convert from various formats to standard format
    let symbol = connectedAccount.pair;
    if (symbol.includes('/')) {
      // Convert BTC/USDT to BTC-USD format for HyperLiquid
      symbol = symbol.replace('/USDT', '-USD').replace('/USDC', '-USD');
    }

    // Use actual trading parameters (in production, get these from form inputs)
    const order: TradingOrder = {
      symbol: symbol,
      side,
      orderType: "market", // TODO: Get from Market/Limit toggle
      quantity: 0.1, // TODO: Get from position size slider/input
      leverage: 20, // TODO: Get from leverage slider
    };

    console.log(`🚀 Executing ${side.toUpperCase()} order:`, order);
    
    const result = await executeOrder(order);
    setStatusMessage(result.message);
    
    // Clear message after 5 seconds to see the result
    setTimeout(() => setStatusMessage(""), 5000);
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