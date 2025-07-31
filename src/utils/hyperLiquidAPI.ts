// Mock API handler for HyperLiquid connection
// In a real implementation, this would be a proper backend service

export interface HyperLiquidConnection {
  publicKey: string;
  privateKey: string;
  accountId: number;
}

export interface HyperLiquidResponse {
  success: boolean;
  message: string;
  data?: {
    account?: {
      id: number;
      balance: number;
      positions: unknown[];
      orders: unknown[];
    };
    timestamp?: string;
  };
}

// Add interface for account data
export interface AccountData {
  balance: string;
  pnl: string;
  openOrdersCount: number;
  positions: Position[];
}

export interface Position {
  asset: string;
  size: number;
  side: 'long' | 'short';
  entryPrice: number;
  markPrice: number;
  pnl: number;
}

// Mock function to simulate HyperLiquid API connection
export const connectToHyperLiquid = async (
  connectionData: HyperLiquidConnection
): Promise<HyperLiquidResponse> => {
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Basic validation
  if (!connectionData.publicKey || !connectionData.privateKey) {
    throw new Error('API keys are required');
  }

  if (connectionData.publicKey.length < 10 || connectionData.privateKey.length < 10) {
    throw new Error('Invalid API key format');
  }

  // In a real implementation, you would:
  // 1. Validate the API keys with HyperLiquid's authentication endpoint
  // 2. Test a basic API call (like getting account info)
  // 3. Store the connection securely
  // 4. Return connection status

  try {
    // Mock successful connection
        
    // Simulate HyperLiquid API call with realistic data
    const mockApiResponse = {
      account: {
        id: connectionData.accountId,
        balance: Math.round((Math.random() * 5000 + 1000) * 100) / 100, // $1000-$6000
        positions: [
          // Mock some realistic positions like in your screenshot
          {
            asset: "BTC",
            size: (Math.random() * 0.1).toFixed(4),
            side: Math.random() > 0.5 ? "long" : "short"
          }
        ],
        orders: []
      },
      timestamp: new Date().toISOString()
    };

    return {
      success: true,
      message: 'Successfully connected to HyperLiquid',
      data: mockApiResponse
    };

  } catch (error) {
    console.error('HyperLiquid connection failed:', error);
    throw new Error('Failed to connect to HyperLiquid API');
  }
};

// Function to test if connection is still valid
export const testHyperLiquidConnection = async (publicKey: string): Promise<boolean> => {
  try {
    // In real implementation, make a simple API call to verify connection
    await new Promise(resolve => setTimeout(resolve, 500));
    return publicKey.length > 10; // Mock validation
  } catch {
    return false;
  }
};

// Function to disconnect from HyperLiquid
export const disconnectFromHyperLiquid = async (accountId: number): Promise<void> => {
    // Clear stored credentials, close connections, etc.
  await new Promise(resolve => setTimeout(resolve, 500));
};

// Function to fetch real account data from HyperLiquid API
export const fetchAccountData = async (publicKey: string): Promise<AccountData> => {
  try {
        
    // Fetch clearinghouse state (balance, positions, etc.)
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: "clearinghouseState",
        user: publicKey
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch account data: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse balance from marginSummary
    const balance = data.marginSummary?.accountValue 
      ? `$${parseFloat(data.marginSummary.accountValue).toFixed(2)}`
      : 'N/A';
    
    // Calculate total PnL from positions
    let totalPnl = 0;
    const positions: Position[] = [];
    
    if (data.assetPositions && Array.isArray(data.assetPositions)) {
      data.assetPositions.forEach((pos: { position?: { szi?: string; unrealizedPnl?: string; coin?: string; entryPx?: string; positionValue?: string } }) => {
        if (pos.position && pos.position.szi !== "0") {
          const pnl = parseFloat(pos.position.unrealizedPnl || "0");
          totalPnl += pnl;
          
          positions.push({
            asset: pos.position.coin || 'Unknown',
            size: Math.abs(parseFloat(pos.position.szi || "0")),
            side: parseFloat(pos.position.szi || "0") > 0 ? 'long' : 'short',
            entryPrice: parseFloat(pos.position.entryPx || "0"),
            markPrice: parseFloat(pos.position.positionValue || "0") / Math.abs(parseFloat(pos.position.szi || "1")),
            pnl: pnl
          });
        }
      });
    }
    
    const pnlString = totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`;
    
    // Count open orders
    const openOrdersCount = data.openOrders ? data.openOrders.length : 0;
    
    return {
      balance,
      pnl: pnlString,
      openOrdersCount,
      positions
    };
    
  } catch (error) {
    console.error('Error fetching account data:', error);
    // Return default values on error
    return {
      balance: 'N/A',
      pnl: 'N/A',
      openOrdersCount: 0,
      positions: []
    };
  }
};
