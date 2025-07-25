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
    // Get user-specified quantity or calculate from position size as fallback
    let orderQuantity: number;
    
    if (tradingParams?.quantity && tradingParams.quantity > 0) {
      // Use user-specified quantity directly
      orderQuantity = tradingParams.quantity;
      console.log(`✅ Using user-specified quantity: ${orderQuantity} ${apiSymbol}`);
    } else {
      // Calculate order quantity based on position size percentage
      const positionSizePercent = tradingParams?.positionSize || 1; // Default to 1% if not specified
      
      // Base order amounts that represent reasonable trading sizes for each asset
      const baseOrderAmounts: { [key: string]: number } = {
        'BTC': 0.01,     // 0.01 BTC (~$1000 at $100k BTC) for 100% position size
        'ETH': 0.1,      // 0.1 ETH (~$400 at $4k ETH) for 100% position size
        'SOL': 5,        // 5 SOL (~$1000 at $200 SOL) for 100% position size
        'ARB': 100,      // 100 ARB (~$100 at $1 ARB) for 100% position size
        'MATIC': 100,    // 100 MATIC (~$100 at $1 MATIC) for 100% position size
        'AVAX': 10,      // 10 AVAX (~$400 at $40 AVAX) for 100% position size
        'DOGE': 1000,    // 1000 DOGE (~$400 at $0.4 DOGE) for 100% position size
        'default': 0.01  // Default base amount
      };
      
      const baseAmount = baseOrderAmounts[apiSymbol] || baseOrderAmounts['default'];
      // Calculate order quantity as percentage of base amount
      orderQuantity = (baseAmount * positionSizePercent) / 100;
      
      console.log(`📊 Position size calculation:`);
      console.log(`   - Position Size: ${positionSizePercent}%`);
      console.log(`   - Base Amount (100%): ${baseAmount} ${apiSymbol}`);
      console.log(`   - Calculated Quantity: ${orderQuantity} ${apiSymbol}`);
    }
    
    // Validate minimum order size and adjust if necessary
    const minimumOrderSizes: { [key: string]: number } = {
      'BTC': 0.0001,   // Minimum 0.0001 BTC 
      'ETH': 0.001,    // Minimum 0.001 ETH
      'SOL': 0.1,      // Minimum 0.1 SOL
      'ARB': 1,        // Minimum 1 ARB
      'MATIC': 1,      // Minimum 1 MATIC
      'AVAX': 0.01,    // Minimum 0.01 AVAX
      'DOGE': 10,      // Minimum 10 DOGE
      'default': 0.001 // Default minimum
    };
    
    const minimumSize = minimumOrderSizes[apiSymbol] || minimumOrderSizes['default'];
    
    // Ensure order quantity meets minimum requirements
    if (orderQuantity < minimumSize) {
      console.log(`⚠️ Calculated quantity ${orderQuantity} below minimum ${minimumSize}, using minimum`);
      orderQuantity = minimumSize;
    }
    
    console.log(`🎯 Final order quantity: ${orderQuantity} ${apiSymbol}`);
    
    const order: TradingOrder = {
      symbol: apiSymbol,
      side,
      orderType: tradingParams?.orderType === "Market" ? "market" : "limit", // Respect UI selection
      quantity: orderQuantity, // Use calculated order quantity from user input or position size
      leverage: tradingParams?.leverage || 20,
      price: tradingParams?.orderType === "Market" ? undefined : tradingParams?.triggerPrice, // Use trigger price for limit orders
      stopPrice: tradingParams?.stopPrice, 
      stopLoss: tradingParams?.stopLoss ? tradingParams.stopLoss / 100 : undefined, // Convert percentage
      // DISABLE automatic order splitting for simple trades
      orderSplit: false, // Force disable order splitting
      minPrice: undefined,
      maxPrice: undefined,
      splitCount: 1, // Force single order
      scaleType: tradingParams?.scaleType,
    };

    console.log(`🎯 ORDER TYPE SELECTION DEBUG:`);
    console.log(`   UI Order Type: "${tradingParams?.orderType}"`);
    console.log(`   Is Market?: ${tradingParams?.orderType === "Market"}`);
    console.log(`   Final Order Type: "${order.orderType}"`);
    console.log(`   Price for Limit: ${order.price}`);
    console.log(`🚀 Executing ${side.toUpperCase()} order with UI parameters:`, order);
    console.log(`📊 Trading Params from UI:`, tradingParams);
    console.log(`🧮 Order Size Calculation Summary:`);
    console.log(`   User Specified Quantity: ${tradingParams?.quantity || 'not specified'}`);
    console.log(`   UI Position Size: ${tradingParams?.positionSize || 0}%`);
    console.log(`   Final Order Size: ${order.quantity} ${apiSymbol}`);
    
    // Provide USD estimate based on asset
    const priceEstimates: { [key: string]: number } = {
      'BTC': 100000, 'ETH': 4000, 'SOL': 200, 'ARB': 1, 'MATIC': 1, 'AVAX': 40, 'DOGE': 0.4
    };
    const estimatedPrice = priceEstimates[apiSymbol] || 1;
    console.log(`   Estimated USD Value: ~$${(order.quantity * estimatedPrice).toFixed(2)}`);
    
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