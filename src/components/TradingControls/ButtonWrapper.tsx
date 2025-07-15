import { useState } from "react";
import { useTrading } from "../../hooks/useTrading";
import type { TradingOrder } from "../../contexts/TradingContext";
import type { TradingParams } from "./Market&Limit/Market";

interface ButtonWrapperProps {
  tradingParams?: TradingParams;
}

const ButtonWrapper = ({ tradingParams }: ButtonWrapperProps) => {
  const { connectedAccount, agentAccount, isTrading, executeOrder, closeAllPositions, cancelAllOrders } = useTrading();
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Handle Long/Short trading using real UI parameters
  const handleTrade = async (side: "buy" | "sell") => {
    if (!agentAccount) {
      setStatusMessage("Please add an agent account first to enable trading");
      return;
    }

    if (!connectedAccount) {
      setStatusMessage("Please connect a master account first to view market data");
      return;
    }

    // Get the current trading pair from connected account
    let symbol = connectedAccount.pair;
    if (symbol.includes('/')) {
      // Convert BTC/USDT to BTC-USD format for HyperLiquid
      symbol = symbol.replace('/USDT', '-USD').replace('/USDC', '-USD');
    }

    // Use REAL trading parameters from UI inputs
    const baseOrderSize = 0.001; // Base order size: 0.001 BTC (~$100)
    const sizeMultiplier = tradingParams ? Math.max(tradingParams.positionSize / 100, 0.1) : 1; // Minimum 10% of base size
    
    const order: TradingOrder = {
      symbol: symbol,
      side,
      orderType: tradingParams?.orderType === "Market" ? "market" : "limit",
      quantity: baseOrderSize * sizeMultiplier, // Ensure minimum viable order size
      leverage: tradingParams?.leverage || 20,
      price: tradingParams?.orderType === "Limit" ? tradingParams.triggerPrice : undefined,
      stopPrice: tradingParams?.orderType === "Limit" ? tradingParams.stopPrice : undefined,
      stopLoss: tradingParams?.stopLoss ? tradingParams.stopLoss / 100 : undefined, // Convert percentage
      // Additional parameters from UI
      orderSplit: tradingParams?.orderSplit || false,
      minPrice: tradingParams?.minPrice,
      maxPrice: tradingParams?.maxPrice,
      splitCount: tradingParams?.splitCount || 1,
      scaleType: tradingParams?.scaleType,
    };

    console.log(`🚀 Executing ${side.toUpperCase()} order with UI parameters:`, order);
    console.log(`📊 Trading Params from UI:`, tradingParams);
    console.log(`🧮 Order Size Calculation:`);
    console.log(`   Base Size: ${baseOrderSize} BTC`);
    console.log(`   UI Position Size: ${tradingParams?.positionSize || 0}%`);
    console.log(`   Size Multiplier: ${sizeMultiplier}`);
    console.log(`   Final Order Size: ${order.quantity} BTC (~$${(order.quantity * 100000).toFixed(2)})`);
    
    const result = await executeOrder(order);
    setStatusMessage(result.message);
    
    // Clear message after 5 seconds
    setTimeout(() => setStatusMessage(""), 5000);
  };

  const handleCloseAll = async () => {
    if (!agentAccount) {
      setStatusMessage("Agent account required for trading operations");
      setTimeout(() => setStatusMessage(""), 3000);
      return;
    }
    const result = await closeAllPositions();
    setStatusMessage(result.message);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const handleCancelAll = async () => {
    if (!agentAccount) {
      setStatusMessage("Agent account required for trading operations");
      setTimeout(() => setStatusMessage(""), 3000);
      return;
    }
    const result = await cancelAllOrders();
    setStatusMessage(result.message);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  return (
    <article>
        <div className="flex flex-col items-center justify-center gap-5">
            {/* Account Status */}
            <div className="text-xs text-center w-full">
              <div className="space-y-1">
                {connectedAccount ? (
                  <span className="text-blue-400">
                    👁️ Master: {connectedAccount.accountName} (Data Source)
                  </span>
                ) : (
                  <span className="text-gray-400">
                    Connect master account to view trading data
                  </span>
                )}
                <div>
                  {agentAccount ? (
                    <span className="text-green-400">
                      🤖 Agent: {agentAccount.accountName} (Trading Ready)
                    </span>
                  ) : (
                    <span className="text-red-400">
                      🤖 No Agent Account (Trading Disabled)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Trading Parameters Display - Show current UI values */}
            <div className="text-xs text-left w-full bg-[#24293A] p-2 rounded-md mb-2">
              <div className="text-yellow-400 font-semibold mb-1">📊 Current Trading Settings:</div>
              {tradingParams ? (
                <div className="text-gray-300 space-y-0.5">
                  <div>Order Type: {tradingParams.orderType}</div>
                  <div>Leverage: {tradingParams.leverage}x</div>
                  <div>Position Size: {tradingParams.positionSize}%</div>
                  <div>Stop Loss: {tradingParams.stopLoss}%</div>
                  {tradingParams.orderType === "Limit" && tradingParams.triggerPrice && tradingParams.triggerPrice > 0 && (
                    <div>Trigger Price: ${tradingParams.triggerPrice}</div>
                  )}
                  {tradingParams.orderSplit && (
                    <div>Order Split: ✓ ({tradingParams.splitCount} orders)</div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400">No trading parameters available</div>
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
                  disabled={!agentAccount || isTrading}
                  className={`long !w-full ${
                    !agentAccount || isTrading 
                      ? "opacity-50 cursor-not-allowed" 
                      : ""
                  }`}
                  title={!agentAccount ? "Add an agent account to enable trading" : ""}
                >
                  {isTrading ? "..." : "LONG"}
                </button>
                <button 
                  onClick={() => handleTrade("sell")}
                  disabled={!agentAccount || isTrading}
                  className={`short !w-full ${
                    !agentAccount || isTrading 
                      ? "opacity-50 cursor-not-allowed" 
                      : ""
                  }`}
                  title={!agentAccount ? "Add an agent account to enable trading" : ""}
                >
                  {isTrading ? "..." : "SHORT"}
                </button>
            </div>
            <div className="flex flex-col w-full items-center justify-center gap-3">
                <button 
                  onClick={handleCloseAll}
                  disabled={!agentAccount || isTrading}
                  className={`positions ${
                    !agentAccount || isTrading 
                      ? "opacity-50 cursor-not-allowed" 
                      : ""
                  }`}
                  title={!agentAccount ? "Add an agent account to enable trading" : ""}
                >
                  {isTrading ? "..." : "Close All Positions"}
                </button>
                <button 
                  onClick={handleCancelAll}
                  disabled={!agentAccount || isTrading}
                  className={`orders ${
                    !agentAccount || isTrading 
                      ? "opacity-50 cursor-not-allowed" 
                      : ""
                  }`}
                  title={!agentAccount ? "Add an agent account to enable trading" : ""}
                >
                  {isTrading ? "..." : "Cancel All Orders"}
                </button>
            </div>
        </div>
    </article>
  )
}

export default ButtonWrapper