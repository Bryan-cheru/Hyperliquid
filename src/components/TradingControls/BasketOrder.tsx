import React, { useState, useEffect } from 'react';
import { basketOrderManager } from '../../utils/basketOrderManager';
import type { BasketOrderConfig } from '../../utils/basketOrderTypes';
import { useTrading } from '../../contexts/TradingContext';

interface BasketOrderProps {
  clicked: boolean;
  setClicked: React.Dispatch<React.SetStateAction<boolean>>;
}

const BasketOrder: React.FC<BasketOrderProps> = ({ clicked, setClicked }) => {
  const { connectedAccount, agentAccount, getPrice } = useTrading();
  const [baskets, setBaskets] = useState<BasketOrderConfig[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  
  // Form state for creating new basket
  const [formData, setFormData] = useState({
    name: '',
    symbol: 'BTC',
    side: 'buy' as 'buy' | 'sell',
    quantity: 0.001,
    leverage: 10,
    orderType: 'limit' as 'market' | 'limit',
    entryPrice: 0,
    
    // Stop loss configuration
    stopLossEnabled: true,
    stopLossPrice: 0,
    stopLossType: 'limit' as 'market' | 'limit',
    timeframe: '15m' as '1m' | '5m' | '15m' | '1h' | '4h' | '1d',
    candleCloseConfirmation: true,
    
    // Limit chaser configuration
    limitChaserEnabled: true,
    chaserDistance: 0.01,
    chaserDistanceType: 'percentage' as 'percentage' | 'absolute',
    fillOrCancel: true,
    updateInterval: 30,
    maxChases: 10,
    
    // Take profit
    takeProfitPrice: 0,
    takeProfitQuantity: 100
  });

  useEffect(() => {
    if (clicked) {
      loadBaskets();
      basketOrderManager.startMarketMonitoring();
    } else {
      basketOrderManager.stopMarketMonitoring();
    }
  }, [clicked]);

  useEffect(() => {
    // Auto-fill entry price with current market price
    if (formData.symbol && clicked) {
      const currentPrice = getPrice(formData.symbol);
      if (currentPrice && formData.entryPrice === 0) {
        setFormData(prev => ({
          ...prev,
          entryPrice: currentPrice,
          stopLossPrice: prev.side === 'buy' ? currentPrice * 0.95 : currentPrice * 1.05,
          takeProfitPrice: prev.side === 'buy' ? currentPrice * 1.1 : currentPrice * 0.9
        }));
      }
    }
  }, [formData.symbol, formData.side, clicked, getPrice, formData.entryPrice]);

  const loadBaskets = () => {
    setBaskets(basketOrderManager.getAllBaskets());
  };

  const handleCreateBasket = async () => {
    if (!agentAccount) {
      alert('Please add an agent account first to enable basket trading');
      return;
    }

    if (!connectedAccount) {
      alert('Please connect a master account first to view market data');
      return;
    }

    try {
      const basketConfig = {
        name: formData.name || `${formData.symbol} ${formData.side} basket`,
        symbol: formData.symbol,
        side: formData.side,
        
        entryOrder: {
          type: formData.orderType,
          quantity: formData.quantity,
          price: formData.orderType === 'limit' ? formData.entryPrice : undefined,
          leverage: formData.leverage
        },
        
        stopLoss: {
          enabled: formData.stopLossEnabled,
          triggerPrice: formData.stopLossPrice,
          orderType: formData.stopLossType,
          timeframe: formData.timeframe,
          candleCloseConfirmation: formData.candleCloseConfirmation
        },
        
        limitChaser: {
          enabled: formData.limitChaserEnabled,
          distance: formData.chaserDistance,
          distanceType: formData.chaserDistanceType,
          fillOrCancel: formData.fillOrCancel,
          updateInterval: formData.updateInterval,
          maxChases: formData.maxChases,
          chaseCount: 0
        },
        
        takeProfits: formData.takeProfitPrice > 0 ? [{
          id: 'tp1',
          targetPrice: formData.takeProfitPrice,
          quantity: formData.takeProfitQuantity,
          orderType: 'limit' as const,
          enabled: true
        }] : []
      };

      const basketId = await basketOrderManager.createBasket(basketConfig);
      console.log(`✅ Basket created: ${basketId}`);
      
      // Execute the basket immediately
      await basketOrderManager.executeBasketEntry(basketId);
      
      loadBaskets();
      setActiveTab('manage');
    } catch (error) {
      console.error('Error creating basket:', error);
      alert('Failed to create basket order');
    }
  };

  const handleCancelBasket = async (basketId: string) => {
    const confirmed = window.confirm('Are you sure you want to cancel this basket order?');
    if (confirmed) {
      await basketOrderManager.cancelBasket(basketId);
      loadBaskets();
    }
  };

  if (!clicked) return null;

  return (
    <div className="border-t border-[#373A45] pt-4">
      <div className="flex flex-col gap-5">
        {/* Toggle Checkbox and Heading */}
        <div className="flex gap-3 items-center -mb-2">
          <label className="relative cursor-pointer flex">
            <input
              type="checkbox"
              data-testid="basket-orders-toggle"
              onChange={() => setClicked(prev => !prev)}
              checked={clicked}
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
          <h1 className="text-xl font-medium text-white">Basket Orders</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-[#373A45] pb-2">
          <button
            data-testid="create-basket-tab"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded text-sm font-medium ${
              activeTab === 'create' 
                ? 'bg-[#F0B90B] text-black' 
                : 'bg-[#24293A] text-white hover:bg-[#373A45]'
            }`}
          >
            Create Basket
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded text-sm font-medium ${
              activeTab === 'manage' 
                ? 'bg-[#F0B90B] text-black' 
                : 'bg-[#24293A] text-white hover:bg-[#373A45]'
            }`}
          >
            Manage Baskets ({baskets.length})
          </button>
        </div>

        {/* Create Basket Tab */}
        {activeTab === 'create' && (
          <div className="space-y-4">
            {/* Basic Order Setup */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Basket Name</label>
                <input
                  type="text"
                  data-testid="basket-name-input"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded text-white text-sm"
                  placeholder="My BTC Strategy"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Symbol</label>
                <select
                  data-testid="basket-symbol-select"
                  value={formData.symbol}
                  onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                  className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded text-white text-sm"
                >
                  <option value="BTC">BTC</option>
                  <option value="ETH">ETH</option>
                  <option value="SOL">SOL</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Side</label>
                <select
                  data-testid="basket-side-select"
                  value={formData.side}
                  onChange={(e) => setFormData(prev => ({ ...prev, side: e.target.value as 'buy' | 'sell' }))}
                  className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded text-white text-sm"
                >
                  <option value="buy">Long</option>
                  <option value="sell">Short</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Quantity</label>
                <input
                  type="number"
                  step="0.001"
                  data-testid="basket-quantity-input"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">Leverage</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.leverage}
                  onChange={(e) => setFormData(prev => ({ ...prev, leverage: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded text-white text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Order Type</label>
                <select
                  value={formData.orderType}
                  onChange={(e) => setFormData(prev => ({ ...prev, orderType: e.target.value as 'market' | 'limit' }))}
                  className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded text-white text-sm"
                >
                  <option value="market">Market</option>
                  <option value="limit">Limit</option>
                </select>
              </div>
              {formData.orderType === 'limit' && (
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Entry Price</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.entryPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, entryPrice: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded text-white text-sm"
                  />
                </div>
              )}
            </div>

            {/* Stop Loss Section */}
            <div className="border border-[#373A45] rounded p-4">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={formData.stopLossEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, stopLossEnabled: e.target.checked }))}
                  className="w-4 h-4"
                />
                <h3 className="text-lg font-medium text-red-400">Stop Loss Configuration</h3>
              </div>
              
              {formData.stopLossEnabled && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Stop Loss Price</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.stopLossPrice}
                        onChange={(e) => setFormData(prev => ({ ...prev, stopLossPrice: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Timeframe</label>
                      <select
                        value={formData.timeframe}
                        onChange={(e) => setFormData(prev => ({ ...prev, timeframe: e.target.value as '1m' | '5m' | '15m' | '1h' | '4h' | '1d' }))}
                        className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded text-white text-sm"
                      >
                        <option value="1m">1 Minute</option>
                        <option value="5m">5 Minutes</option>
                        <option value="15m">15 Minutes</option>
                        <option value="1h">1 Hour</option>
                        <option value="4h">4 Hours</option>
                        <option value="1d">1 Day</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.candleCloseConfirmation}
                      onChange={(e) => setFormData(prev => ({ ...prev, candleCloseConfirmation: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <label className="text-sm text-gray-300">Wait for candle close confirmation</label>
                  </div>
                </div>
              )}
            </div>

            {/* Limit Chaser Section */}
            <div className="border border-[#373A45] rounded p-4">
              <div className="flex items-center gap-3 mb-3">
                <input
                  type="checkbox"
                  checked={formData.limitChaserEnabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, limitChaserEnabled: e.target.checked }))}
                  className="w-4 h-4"
                />
                <h3 className="text-lg font-medium text-blue-400">Limit Chaser Configuration</h3>
              </div>
              
              {formData.limitChaserEnabled && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Distance</label>
                      <input
                        type="number"
                        step="0.001"
                        value={formData.chaserDistance}
                        onChange={(e) => setFormData(prev => ({ ...prev, chaserDistance: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Distance Type</label>
                      <select
                        value={formData.chaserDistanceType}
                        onChange={(e) => setFormData(prev => ({ ...prev, chaserDistanceType: e.target.value as 'percentage' | 'absolute' }))}
                        className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded text-white text-sm"
                      >
                        <option value="percentage">Percentage</option>
                        <option value="absolute">Absolute</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Max Chases</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.maxChases}
                        onChange={(e) => setFormData(prev => ({ ...prev, maxChases: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded text-white text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.fillOrCancel}
                      onChange={(e) => setFormData(prev => ({ ...prev, fillOrCancel: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <label className="text-sm text-gray-300">Fill or Cancel (IOC)</label>
                  </div>
                </div>
              )}
            </div>

            {/* Take Profit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-1">Take Profit Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.takeProfitPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, takeProfitPrice: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded text-white text-sm"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-1">TP Quantity %</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.takeProfitQuantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, takeProfitQuantity: parseInt(e.target.value) || 100 }))}
                  className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded text-white text-sm"
                />
              </div>
            </div>

            {/* Create Button */}
            <button
              data-testid="create-basket-button"
              onClick={handleCreateBasket}
              disabled={!agentAccount}
              className="w-full py-3 bg-[#F0B90B] text-black font-bold rounded hover:bg-[#E6A509] disabled:opacity-50 disabled:cursor-not-allowed"
              title={!agentAccount ? "Add an agent account to enable basket trading" : ""}
            >
              Create & Execute Basket Order
            </button>
          </div>
        )}

        {/* Manage Baskets Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-4">
            {baskets.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No basket orders created yet
              </div>
            ) : (
              baskets.map((basket) => (
                <div key={basket.id} className="border border-[#373A45] rounded p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-medium text-white">{basket.name}</h3>
                      <p className="text-sm text-gray-400">
                        {basket.symbol} • {basket.side.toUpperCase()} • {basket.entryOrder.quantity} @ {basket.entryOrder.leverage}x
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        basket.status === 'active' ? 'bg-green-500 text-white' :
                        basket.status === 'pending' ? 'bg-yellow-500 text-black' :
                        basket.status === 'completed' ? 'bg-blue-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {basket.status.toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleCancelBasket(basket.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-400">Stop Loss:</p>
                      <p className="text-white">
                        {basket.stopLoss.enabled ? `${basket.stopLoss.triggerPrice} (${basket.stopLoss.timeframe})` : 'Disabled'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Limit Chaser:</p>
                      <p className="text-white">
                        {basket.limitChaser.enabled ? 
                          `${basket.limitChaser.distance}${basket.limitChaser.distanceType === 'percentage' ? '%' : ''} (${basket.limitChaser.chaseCount}/${basket.limitChaser.maxChases})` : 
                          'Disabled'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {basket.executionLog.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#373A45]">
                      <p className="text-sm text-gray-400 mb-2">Execution Log:</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {basket.executionLog.slice(-5).map((log, index) => (
                          <p key={index} className="text-xs text-gray-300">
                            {new Date(log.timestamp).toLocaleTimeString()}: {log.details}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BasketOrder;
