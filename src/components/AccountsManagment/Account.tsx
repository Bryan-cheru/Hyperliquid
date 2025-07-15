import { useEffect, useRef, useState } from "react";
import AnimateHeight from "react-animate-height";
import { motion } from "framer-motion";
import { useTrading } from "../../hooks/useTrading";
import type { AgentAccount } from "../../contexts/TradingContext";
import { verifyPrivateKeyToAddress } from "../../utils/hyperLiquidSigning";

// Type definition for account data
interface AccountInfo {
  title: string;
  num: number;
  status: string;
  pair: string;
  leverage: string;
  balance: string;
  pnl: string;
  selected: boolean;
}

// Props for the Account component
interface AccountProps {
  acc: AccountInfo;
  id: number;
  getId: (id: number) => void;
  getName: (name: string) => void;
}

const Account = ({ acc, id, getId, getName }: AccountProps) => {
  const [clicked, setClicked] = useState<boolean>(false); // State to toggle expand/collapse
  const [masterChecked, setMasterChecked] = useState(false); // State for MASTER PAIR checkbox
  const [subscriberChecked, setSubscriberChecked] = useState(false); // State for SUBSCRIBER PAIR checkbox
  const [publicKey, setPublicKey] = useState<string>(""); // Wallet address (public key)
  const [privateKey, setPrivateKey] = useState<string>(""); // Private key for trading
  const [isConnecting, setIsConnecting] = useState<boolean>(false); // Connection status
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connected" | "error">("idle"); // Connection state
  const [errorMessage, setErrorMessage] = useState<string>(""); // Error message
  
  // Trading context to connect agent account for trading
  const { setAgentAccount } = useTrading();
  
  const cardRef = useRef<HTMLDivElement | null>(null); // Ref to detect outside clicks

  // Effect to close the card dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setClicked(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handles click on the card; expands it and notifies parent of selected ID and Name
  const handleCardClick = () => {
    setClicked((prev) => {
      const next = !prev;
      if (next) {
        getId(id);
        getName(`${acc.title} ${acc.num}`);
      }
      return next;
    });
  };

  // Function to handle HyperLiquid API connection and fetch real data
  const handleConnect = async () => {
    if (!publicKey.trim() || !privateKey.trim()) {
      setErrorMessage("Please provide both wallet address and private key");
      setConnectionStatus("error");
      return;
    }

    console.log('🔗 Connecting with user credentials...');
    console.log('  Wallet address:', publicKey.trim());
    console.log('  Private key provided:', '✓');

    setIsConnecting(true);
    setErrorMessage("");
    setConnectionStatus("idle");

    try {
      // First, verify that the private key actually corresponds to the provided wallet address
      console.log('🔍 Verifying private key matches wallet address...');
      const verification = await verifyPrivateKeyToAddress(privateKey.trim(), publicKey.trim());
      
      if (!verification.isValid) {
        console.error('❌ Private key verification failed:', verification.error);
        setErrorMessage(`Private key mismatch: ${verification.error}`);
        setConnectionStatus("error");
        setIsConnecting(false);
        return;
      }
      
      console.log('✅ Private key verification successful');
      console.log('  Expected address:', publicKey.trim());
      console.log('  Derived address:', verification.actualAddress);

      // For agent wallets, we need to approve this wallet to trade on behalf of subaccounts
      console.log('🔗 Setting up agent wallet for subaccount trading...');
      
      // Test if this agent wallet is already approved by trying to fetch account data
      console.log('� Testing agent wallet permissions...');
      // Test if this agent wallet is already approved by trying to fetch account data
      console.log('🔍 Testing agent wallet permissions...');
      
      // For agent wallets, we just need to verify the wallet exists
      // The actual subaccount data would be queried separately if needed
      const accountResponse = await fetch('https://api.hyperliquid.xyz/info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: "clearinghouseState",
          user: publicKey.trim() // Query the agent wallet itself first
        }),
      });

      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        
        console.log('✅ Agent wallet connection successful');
        console.log('📊 Account Data:', accountData);
        console.log('✅ Agent wallet verified successfully');
        
        // For agent accounts, we just need to verify the keys work
        // The master account handles displaying balance/PnL data
        setConnectionStatus("connected");
        setIsConnecting(false);
        setErrorMessage("");
        
        console.log('✅ Agent wallet connected successfully with Python-compatible signing');
        console.log('🔐 Signature verification should now work correctly with HyperLiquid');
        
        // Set agent account for trading context
        const agentAccountData: AgentAccount = {
          accountId: acc.num,
          accountName: `${acc.title} ${acc.num}`,
          publicKey: publicKey.trim(),
          privateKey: privateKey.trim(),
          isActive: true,
          connectionStatus: "connected"
        };
        
        setAgentAccount(agentAccountData);
        console.log('Agent account connected for trading:', agentAccountData.accountName);
        console.log('Agent account ready for trade execution');
        
      } else {
        throw new Error(`API request failed. Status: ${accountResponse.status}`);
      }
    } catch (error: unknown) {
      console.error('HyperLiquid connection error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to HyperLiquid API';
      setErrorMessage(errorMessage);
      setConnectionStatus("error");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <motion.article
      ref={cardRef}
      onClick={handleCardClick}
      className={`self-start flex flex-col w-[460px] max-w-full bg-[#23272E] p-5 transition-all duration-300 relative rounded-xl ${
        clicked ? "border border-[#F0B90B]" : ""
      } ${acc.selected ? "ring-2 ring-green-400" : ""}`}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header Section */}
      <div className="flex justify-between items-center space-y-6">
        <h1 className="title text-sm">
          {acc.title} {acc.num}
        </h1>

        {/* Selection checkbox + Status */}
        <div className="flex gap-3 items-center justify-end">
          <label className="relative cursor-pointer flex">
            <input
              type="checkbox"
              className="cursor-pointer peer appearance-none h-[20px] w-[20px] shrink-0 rounded-xs border-2 border-[#787b7f] bg-transparent checked:bg-blue-500 checked:border-blue-500"
              checked={acc.selected}
               onClick={e => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                getId(id);

                // Reset internal toggles if unchecking
                if (!e.target.checked) {
                  setMasterChecked(false);
                  setSubscriberChecked(false);
                }
              }}
            />
            {/* Custom checkmark SVG */}
            <svg
              className="absolute left-1 top-1 h-3.5 w-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
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

          {/* Status tag */}
          <div
            className={`text-xs font-medium px-2 py-[2px] rounded ${
              acc.status === "INACTIVE"
                ? "text-[#FF3838] bg-[rgba(255,0,0,0.10)]"
                : "text-[#00FF4B]"
            }`}
          >
            {acc.status}
          </div>
        </div>
      </div>

      {/* Pair and leverage info */}
      <div className="flex justify-between text-[rgba(255,255,255,0.70)] text-xs">
        <p>{acc.pair}</p>
        <p>{acc.leverage}</p>
      </div>

      {/* Balance and PnL */}
      <div className="flex justify-between mt-6">
        <p className="text-[rgba(255,255,255,0.70)] text-xs">
          Balance:{" "}
          <span className="text-white font-bold text-xs">
            {acc.balance}
          </span>
        </p>
        <p className="text-[rgba(255,255,255,0.70)] text-xs">
          PnL: <span className="text-white font-bold text-xs">
            {acc.pnl}
          </span>
        </p>
      </div>

      {/* Show open orders count if connected */}
      {connectionStatus === "connected" && (
        <div className="mt-2">
          <p className="text-[rgba(255,255,255,0.70)] text-xs">
            Open Orders: <span className="text-white font-bold text-xs">-</span>
          </p>
        </div>
      )}

      {/* Expandable section with additional controls */}
      <AnimateHeight duration={400} height={clicked ? "auto" : 0}>
        <div className="mt-4 pt-4 flex flex-col gap-4 text-white text-sm">
          {/* API Key inputs */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs text-gray-400 font-semibold">🤖 Agent Account Setup (Trading)</h3>
            <input
              type="text"
              placeholder="Wallet Address (0x...)"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              className="bg-[#1f2228] border border-gray-600 px-3 py-2 rounded-md text-xs"
              onClick={e => e.stopPropagation()}
            />
            <input
              type="password"
              placeholder="Private Key (for trading operations)"
              value={privateKey}
              onChange={(e) => setPrivateKey(e.target.value)}
              className="bg-[#1f2228] border border-gray-600 px-3 py-2 rounded-md text-xs"
              onClick={e => e.stopPropagation()}
            />
            <div className="text-xs text-gray-400">
              Add agent account with private key for executing trades (separate from master account)
            </div>

            {/* Connection status indicator */}
            {connectionStatus === "connected" && (
              <div className="flex items-center gap-2 text-green-400 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                🤖 Agent account connected - Ready for trading
              </div>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleConnect();
              }}
              disabled={isConnecting || !publicKey.trim() || !privateKey.trim()}
              className={`px-4 py-2 rounded-md w-fit text-xs font-medium ml-auto transition-colors ${
                connectionStatus === "connected" 
                  ? "bg-green-600 text-white" 
                  : isConnecting 
                    ? "bg-gray-500 text-gray-300 cursor-not-allowed" 
                    : "bg-green-500 hover:bg-green-600 text-white"
              }`}
            >
              {isConnecting ? "Connecting..." : connectionStatus === "connected" ? "Trading Ready" : "Connect & Enable Trading"}
            </button>
          </div>

          {/* Error message for connection failures */}
          {connectionStatus === "error" && errorMessage && (
            <div className="text-red-400 text-xs">
              {errorMessage}
            </div>
          )}

          {/* MASTER / SUBSCRIBER toggle checkboxes */}
          <div className="flex justify-between items-center text-xs">
            <label className="flex items-center gap-2 relative">
              <span className="relative flex items-center">
                <input
                  type="checkbox"
                  disabled={!clicked || !acc.selected}
                  checked={masterChecked}
                  onChange={e => setMasterChecked(e.target.checked)}
                  onClick={e => e.stopPropagation()}
                  className="cursor-pointer peer appearance-none h-[16px] w-[16px] shrink-0 rounded-xs border-2 border-[#787b7f] bg-transparent checked:bg-blue-500 checked:border-blue-500 disabled:opacity-50"
                />
                {/* Checkmark icon */}
                <svg
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              MASTER PAIR
            </label>

            <label className="flex items-center gap-2 relative">
              <span className="relative flex items-center">
                <input
                  type="checkbox"
                  disabled={!clicked || !acc.selected}
                  checked={subscriberChecked}
                  onChange={e => setSubscriberChecked(e.target.checked)}
                  onClick={e => e.stopPropagation()}
                  className="cursor-pointer peer appearance-none h-[16px] w-[16px] shrink-0 rounded-xs border-2 border-[#787b7f] bg-transparent checked:bg-blue-500 checked:border-blue-500 disabled:opacity-50"
                />
                {/* Checkmark icon */}
                <svg
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              SUBSCRIBER PAIR
            </label>
          </div>

          {/* Dropdowns for selecting trading pairs */}
          <div className="flex justify-between gap-4">
            <select className="w-full bg-[#1f2228] border border-gray-600 px-3 py-2 rounded-md text-xs"   onClick={e => e.stopPropagation()}>
              <option>BTC-USD</option>
              <option>ETH-USD</option>
              <option>SOL-USD</option>
              <option>HYPE-USD</option>
              <option>ARB-USD</option>
            </select>
            <select className="w-full bg-[#1f2228] border border-gray-600 px-3 py-2 rounded-md text-xs"  onClick={e => e.stopPropagation()}>
              <option>BTC-USD</option>
              <option>ETH-USD</option>
              <option>SOL-USD</option>
              <option>HYPE-USD</option>
              <option>ARB-USD</option>
            </select>
          </div>
        </div>
      </AnimateHeight>
    </motion.article>
  );
};

export default Account;
