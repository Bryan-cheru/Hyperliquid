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
    
    // Entry limit chaser configuration
    entryLimitChaserEnabled: false,
    entryDistance: 0.5,
    entryMaxChases: 5,
    entryUpdateInterval: 30,
    entryLongPriceLimit: 0,
    entryShortPriceLimit: 0,
    
    // Take profit
    takeProfitPrice: 0,
    takeProfitQuantity: 100
  });

  useEffect(() => {
    // Auto-enable basket orders in background (hidden from user)
    if (!clicked && agentAccount && connectedAccount) {
      setClicked(true);
    }
    
    if (clicked) {
      loadBaskets();
      basketOrderManager.startMarketMonitoring();
    } else {
      basketOrderManager.stopMarketMonitoring();
    }
  }, [clicked, agentAccount, connectedAccount, setClicked]);

  // Auto-create default basket when accounts are connected (hidden functionality)
  useEffect(() => {
    if (clicked && agentAccount && connectedAccount && baskets.length === 0) {
      // Auto-create a default basket configuration
      const currentPrice = getPrice('BTC');
      if (currentPrice) {
        const autoBasketConfig = {
          name: 'Auto BTC Strategy',
          symbol: 'BTC',
          side: 'buy' as const,
          
          entryOrder: {
            type: 'limit' as const,
            quantity: 0.001,
            price: currentPrice,
            leverage: 10
          },
          
          stopLoss: {
            enabled: true,
            triggerPrice: currentPrice * 0.95,
            orderType: 'limit' as const,
            timeframe: '15m' as const,
            candleCloseConfirmation: true
          },
          
          limitChaser: {
            enabled: true,
            distance: 0.01,
            distanceType: 'percentage' as const,
            fillOrCancel: true,
            updateInterval: 30,
            maxChases: 10,
            chaseCount: 0
          },
          
          takeProfits: [{
            id: 'tp1',
            targetPrice: currentPrice * 1.1,
            quantity: 100,
            orderType: 'limit' as const,
            enabled: true
          }]
        };
        
        // Create basket silently in background
        basketOrderManager.createBasket(autoBasketConfig).then((basketId) => {
                    loadBaskets();
        }).catch(console.error);
      }
    }
  }, [clicked, agentAccount, connectedAccount, baskets.length, getPrice]);

  useEffect(() => {
    // Auto-fill entry price with current market price
    if (formData.symbol && clicked) {
      const currentPrice = getPrice(formData.symbol);
      if (currentPrice && formData.entryPrice === 0) {
        setFormData(prev => ({
          ...prev,
          entryPrice: currentPrice,
          stopLossPrice: prev.side === 'buy' ? currentPrice * 0.95 : currentPrice * 1.05,
          takeProfitPrice: prev.side === 'buy' ? currentPrice * 1.1 : currentPrice * 0.9,
          // Auto-fill entry price limits if they haven't been set
          entryLongPriceLimit: prev.entryLongPriceLimit === 0 ? currentPrice * 0.99 : prev.entryLongPriceLimit,
          entryShortPriceLimit: prev.entryShortPriceLimit === 0 ? currentPrice * 1.01 : prev.entryShortPriceLimit
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
          leverage: formData.leverage,
          limitChaser: formData.entryLimitChaserEnabled ? {
            enabled: formData.entryLimitChaserEnabled,
            distance: formData.entryDistance,
            distanceType: 'percentage' as const,
            maxChases: formData.entryMaxChases,
            updateInterval: formData.entryUpdateInterval,
            chaseCount: 0,
            longPriceLimit: formData.entryLongPriceLimit,
            shortPriceLimit: formData.entryShortPriceLimit
          } : undefined
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

  return (
    <div className="border-t border-[#373A45] pt-4 mt-2" style={{ display: 'none' }}>
      {/* ENTIRE BASKET ORDER UI HIDDEN - Functionality preserved but invisible to user */}
      <div className="flex flex-col gap-3">
        {/* Compact Toggle Section - HIDDEN */}
        <div className="bg-[#1a1e2a] rounded-md p-3 border border-[#373A45] hover:border-[#F0B90B] transition-colors">
          <div className="flex gap-3 items-center">
            <label className="relative cursor-pointer flex items-center">
              <input
                type="checkbox"
                data-testid="basket-orders-toggle"
                onChange={() => setClicked(prev => !prev)}
                checked={clicked}
                className="cursor-pointer peer appearance-none h-[18px] w-[18px] shrink-0 rounded border-2 border-[#787b7f] bg-transparent checked:bg-[#F0B90B] checked:border-[#F0B90B] transition-all duration-200"
              />
              <svg
                className="absolute left-0.5 top-0.5 h-3 w-3 text-black pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
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
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">🧺</span>
              <h3 className="text-md font-medium text-white">Basket Orders</h3>
              {clicked && <span className="text-green-400 text-xs">✓</span>}
            </div>
            {!clicked && (
              <span className="text-[#F0B90B] text-xs bg-[#F0B90B]/10 px-2 py-1 rounded">
                Enable
              </span>
            )}
          </div>
          
          {!clicked && (
            <div className="mt-2 text-xs text-gray-400 border-l-2 border-[#F0B90B] pl-2">
              Multi-order execution with smart tracking
            </div>
          )}
        </div>

        {clicked && (
          <>
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

              {/* Filled or Cancel - Entry Limit Chaser */}
              {formData.orderType === 'limit' && (
                <div className="flex items-center gap-3 mt-3">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.entryLimitChaserEnabled}
                      onChange={(e) => {
                        const enabled = e.target.checked;
                        setFormData(prev => ({ 
                          ...prev, 
                          entryLimitChaserEnabled: enabled,
                          // Auto-set default distance when enabled
                          entryDistance: enabled && prev.entryDistance === 0 ? 0.5 : prev.entryDistance
                        }))
                      }}
                      className="sr-only"
                    />
                    <div className={`relative w-10 h-5 rounded-full transition-colors mr-2 ${
                      formData.entryLimitChaserEnabled ? 'bg-blue-600' : 'bg-gray-600'
                    }`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                        formData.entryLimitChaserEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}></div>
                    </div>
                    <span className="text-sm text-blue-400 underline">Filled or Cancel</span>
                  </label>
                  <span className="text-xs text-gray-400">
                    (Chases current price with limit orders)
                  </span>
                </div>
              )}

              {/* Entry Limit Chaser Section */}
              {formData.orderType === 'limit' && formData.entryLimitChaserEnabled && (
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mt-3">
                  <h4 className="text-blue-400 text-sm font-medium mb-3">Entry Chaser Settings</h4>

                  {/* Entry Price Limits for Long and Short */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Long Price Limit</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.entryLongPriceLimit || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, entryLongPriceLimit: parseFloat(e.target.value) || 0 }))}
                        placeholder="Long limit price"
                        className="w-full px-2 py-1 bg-[#24293A] border border-[#373A45] rounded text-white text-xs text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Short Price Limit</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.entryShortPriceLimit || 0}
                        onChange={(e) => setFormData(prev => ({ ...prev, entryShortPriceLimit: parseFloat(e.target.value) || 0 }))}
                        placeholder="Short limit price"
                        className="w-full px-2 py-1 bg-[#24293A] border border-[#373A45] rounded text-white text-xs text-center"
                      />
                    </div>
                  </div>

                  {/* Entry Distance Slider */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-300 mb-2">
                      Entry Distance: {formData.entryDistance.toFixed(1)}%
                    </label>
                    <div className="flex items-center gap-4">
                      {/* Slider */}
                      <div className="flex-1">
                        <input
                          type="range"
                          min="0.1"
                          max="3.0"
                          step="0.1"
                          value={formData.entryDistance}
                          onChange={(e) => setFormData(prev => ({ ...prev, entryDistance: parseFloat(e.target.value) }))}
                          className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(formData.entryDistance / 3) * 100}%, #6b7280 ${(formData.entryDistance / 3) * 100}%, #6b7280 100%)`
                          }}
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                          <span>0.1%</span>
                          <span>3.0%</span>
                        </div>
                      </div>
                      
                      {/* Or statement */}
                      <span className="text-xs text-gray-400">or</span>
                      
                      {/* Manual Input */}
                      <input 
                        type="number" 
                        step="0.1"
                        min="0.1"
                        max="3.0"
                        value={formData.entryDistance.toFixed(1)}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val) && val >= 0.1 && val <= 3.0) {
                            setFormData(prev => ({ ...prev, entryDistance: val }));
                          }
                        }}
                        placeholder="0.5" 
                        className="w-16 px-2 py-1 bg-[#24293A] border border-[#373A45] rounded text-white text-xs text-center"
                      />
                    </div>
                  </div>

                  {/* Entry Settings Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Max Chases</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={formData.entryMaxChases}
                        onChange={(e) => setFormData(prev => ({ ...prev, entryMaxChases: parseInt(e.target.value) || 5 }))}
                        className="w-full px-2 py-1 bg-[#24293A] border border-[#373A45] rounded text-white text-xs text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-300 mb-1">Update (s)</label>
                      <input
                        type="number"
                        min="10"
                        max="120"
                        step="10"
                        value={formData.entryUpdateInterval}
                        onChange={(e) => setFormData(prev => ({ ...prev, entryUpdateInterval: parseInt(e.target.value) || 30 }))}
                        className="w-full px-2 py-1 bg-[#24293A] border border-[#373A45] rounded text-white text-xs text-center"
                      />
                    </div>
                  </div>
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
      </>
    )}
  </div>
</div>
);
};

export default BasketOrder;
