import React, { useState } from 'react';
import { useTrading } from '../../hooks/useTrading';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose }) => {
  const { setConnectedAccount } = useTrading();
  const [publicKey, setPublicKey] = useState('');
  const [accountName, setAccountName] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!publicKey.trim() || !accountName.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Validate public key format (basic validation)
      if (!publicKey.startsWith('0x') || publicKey.length !== 42) {
        throw new Error('Invalid public key format. Should be 42 characters starting with 0x');
      }

      // Create connected account object (master account for viewing data)
      const newAccount = {
        accountId: 1,
        accountName: accountName.trim(),
        publicKey: publicKey.trim(),
        privateKey: '', // Not needed for master account viewing
        balance: '0.00', // Will be updated after connection
        pnl: '0.00',
        pair: 'BTC-USD',
        openOrdersCount: 0,
        connectionStatus: 'connected' as const
      };

      // Set the connected account
      setConnectedAccount(newAccount);
      
      // Clear form and close modal
      setPublicKey('');
      setAccountName('');
      onClose();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect account');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleClose = () => {
    setPublicKey('');
    setAccountName('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-[2px]">
      <div className="bg-[#181C29] rounded-lg p-6 w-full max-w-md mx-4 border border-[#373A45]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#3B82F6]">Connect Master Account (View Only)</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-md">
          <p className="text-blue-400 text-sm">
            👁️ <strong>Master Account:</strong> View-only access to account data, positions, and history.
          </p>
          <p className="text-blue-300 text-xs mt-1">
            🤖 <strong>Trading:</strong> Orders will be executed using a separate agent wallet.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g., Main Trading Account"
              className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded-md text-white placeholder-gray-400 focus:border-[#F0B90B] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Public Key (Wallet Address) *
            </label>
            <input
              type="text"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="0x..."
              className="w-full px-3 py-2 bg-[#24293A] border border-[#373A45] rounded-md text-white placeholder-gray-400 focus:border-[#F0B90B] focus:outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">
              ℹ️ Only public key needed for viewing account data and positions
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-md">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-[#24293A] text-gray-300 rounded-md hover:bg-[#2A3142] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex-1 px-4 py-2 bg-[#F0B90B] text-black font-semibold rounded-md hover:bg-[#D4A509] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isConnecting ? 'Connecting...' : 'Connect Master Account'}
            </button>
          </div>
        </div>

        <div className="mt-4 p-3 bg-[#24293A] rounded-md">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Master Account Info:</h4>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Connect with public key to view account data</li>
            <li>• View positions, orders, and trading history</li>
            <li>• No private key needed for read-only access</li>
            <li>• Trading requires separate agent wallet setup</li>
            <li>• Account data refreshes automatically</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ConnectionModal;
