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

  // Debug logging
  console.log('ButtonWrapper - agentAccount:', agentAccount);
  console.log('ButtonWrapper - connectedAccount:', connectedAccount);
  console.log('🔍 ButtonWrapper - tradingParams received:', tradingParams);
  console.log('🔍 ButtonWrapper - orderType detection:', tradingParams?.orderType === "Market" ? "MARKET" : "LIMIT");

  // Handle Long/Short trading using real UI parameters
  const handleTrade = async (side: "buy" | "sell") => {
    // 🔍 DEBUG: Add comprehensive logging for SHORT button troubleshooting
    if (side === "sell") {
      console.log('\n🚨 SHORT BUTTON CLICKED - DEBUGGING:');
      console.log('=================================');
      console.log('1️⃣ Agent Account:', agentAccount ? '✓ Present' : '❌ Missing');
      if (agentAccount) {
        console.log('   - Account Name:', agentAccount.accountName);
        console.log('   - Private Key:', agentAccount.privateKey ? '✓ Present' : '❌ Missing');
        console.log('   - Connection Status:', agentAccount.connectionStatus);
      }
      console.log('2️⃣ Connected Account:', connectedAccount ? '✓ Present' : '❌ Missing');
      if (connectedAccount) {
        console.log('   - Trading Pair:', connectedAccount.pair);
      }
      console.log('3️⃣ Trading Parameters:', tradingParams ? '✓ Present' : '❌ Missing');
      if (tradingParams) {
        console.log('   - Order Type:', tradingParams.orderType);
        console.log('   - Leverage:', tradingParams.leverage);
        console.log('   - Position Size:', tradingParams.positionSize);
      }
    }

    if (!agentAccount) {
      setStatusMessage("Please add an agent account first to enable trading");
      return;
    }

    if (!connectedAccount) {
      setStatusMessage("Please connect a master account first to view market data");
      return;
    }

    // Get the current trading pair from connected account
    // Convert display format (BTC-USD) to HyperLiquid API format (BTC)
    const displayPair = connectedAccount.pair; // e.g., "BTC-USD"
    const apiSymbol = displayPair.split('-')[0]; // Extract "BTC" from "BTC-USD"
    
    console.log(`🎯 Display pair: ${displayPair} -> API symbol: ${apiSymbol}`);

    // Use REAL trading parameters from UI inputs
    // Adjust order size to fit $20 account - use much smaller BTC amount
    const baseOrderSize = 0.0001; // Very small: 0.0001 BTC (~$10-12) to fit in $20 account
    const sizeMultiplier = tradingParams ? Math.max(tradingParams.positionSize / 100, 0.1) : 1; // Minimum 10% of base size
    
    const order: TradingOrder = {
      symbol: apiSymbol,
      side,
      orderType: "market", // Force market orders to avoid price calculation issues
      quantity: baseOrderSize * sizeMultiplier, // Ensure minimum viable order size
      leverage: tradingParams?.leverage || 20,
      price: undefined, // No price needed for market orders
      stopPrice: undefined, // No stop price for market orders
      stopLoss: tradingParams?.stopLoss ? tradingParams.stopLoss / 100 : undefined, // Convert percentage
      // DISABLE automatic order splitting for simple trades
      orderSplit: false, // Force disable order splitting
      minPrice: undefined,
      maxPrice: undefined,
      splitCount: 1, // Force single order
      scaleType: tradingParams?.scaleType,
    };

    console.log(`🚀 Executing ${side.toUpperCase()} order with UI parameters:`, order);
    console.log(`📊 Trading Params from UI:`, tradingParams);
    console.log(`🧮 Order Size Calculation:`);
    console.log(`   Base Size: ${baseOrderSize} BTC`);
    console.log(`   UI Position Size: ${tradingParams?.positionSize || 0}%`);
    console.log(`   Size Multiplier: ${sizeMultiplier}`);
    console.log(`   Final Order Size: ${order.quantity} BTC (~$${(order.quantity * 120000).toFixed(2)})`); // Estimate at ~$120k BTC
    
    try {
      const result = await executeOrder(order);
      console.log(`✅ ${side.toUpperCase()} order result:`, result);
      setStatusMessage(result.message);
    } catch (error) {
      console.error(`❌ Error executing ${side.toUpperCase()} order:`, error);
      setStatusMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    }
    
    // Clear message after 5 seconds
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
              <div className="space-y-1">
                {connectedAccount ? (
                  <span className="text-blue-400">
                     Master: {connectedAccount.accountName} (Data Source)
                  </span>
                ) : (
                  <span className="text-gray-400">
                    Connect master account to view trading data
                  </span>
                )}
                <div>
                  {agentAccount ? (
                    <span className="text-green-400">
                       Agent: {agentAccount.accountName} (Trading Ready)
                    </span>
                  ) : (
                    <span className="text-red-400">
                       No Agent Account (Trading Disabled)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Trading Parameters Display - Show current UI values */}
            {/* <div className="text-xs text-left w-full bg-[#24293A] p-2 rounded-md mb-2">
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
            </div> */}

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