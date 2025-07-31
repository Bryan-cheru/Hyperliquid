// HyperLiquid Integration Test Script
// This script tests the actual trading integration with HyperLiquid API

import { ethers } from 'ethers';

// Test Configuration
const TEST_CONFIG = {
  // Test accounts (replace with your actual test accounts)
  MASTER_ACCOUNT: {
    name: 'Test Master Account',
    address: '0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB'
  },
  AGENT_ACCOUNT: {
    name: 'Test Agent Account', 
    address: '0x744b5f069e0e2f38cf625edbb524a8a2d024dad0',
    privateKey: '0x86ac8c28e32b673b6d9d04086bf6dba13161665ea912a8e5a91133ad38debf39'
  },
  // Test parameters
  TEST_SYMBOL: 'BTC',
  TEST_POSITION_SIZES: [1, 5, 10, 25],
  HYPERLIQUID_API_URL: 'https://api.hyperliquid.xyz',
  HYPERLIQUID_TESTNET_URL: 'https://api.hyperliquid-testnet.xyz'
};

class HyperLiquidTester {
  constructor() {
    this.wallet = null;
    this.isTestnet = true; // Set to false for mainnet testing
    this.apiUrl = this.isTestnet ? TEST_CONFIG.HYPERLIQUID_TESTNET_URL : TEST_CONFIG.HYPERLIQUID_API_URL;
  }

  // Initialize wallet connection
  async initializeWallet() {
    try {
      console.log('🔐 Initializing wallet connection...');
      this.wallet = new ethers.Wallet(TEST_CONFIG.AGENT_ACCOUNT.privateKey);
      console.log('✅ Wallet initialized for address:', this.wallet.address);
      
      // Verify the address matches our test account
      if (this.wallet.address.toLowerCase() !== TEST_CONFIG.AGENT_ACCOUNT.address.toLowerCase()) {
        throw new Error('Private key does not match expected address');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Wallet initialization failed:', error.message);
      return false;
    }
  }

  // Test API connectivity
  async testAPIConnection() {
    try {
      console.log('🌐 Testing API connection to:', this.apiUrl);
      
      const response = await fetch(`${this.apiUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'meta'
        })
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ API connection successful');
      console.log('📊 Available assets:', data.universe?.length || 'Unknown');
      
      return data;
    } catch (error) {
      console.error('❌ API connection failed:', error.message);
      return null;
    }
  }

  // Get account information
  async getAccountInfo() {
    try {
      console.log('📋 Fetching account information...');
      
      const response = await fetch(`${this.apiUrl}/info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'clearinghouseState',
          user: TEST_CONFIG.AGENT_ACCOUNT.address
        })
      });

      if (!response.ok) {
        throw new Error(`Account info request failed: ${response.status}`);
      }

      const accountData = await response.json();
      console.log('✅ Account info retrieved');
      
      // Log important account details
      if (accountData.marginSummary) {
        console.log('💰 Account Balance:', accountData.marginSummary.accountValue);
        console.log('📊 Available Balance:', accountData.marginSummary.totalMarginUsed);
      }
      
      if (accountData.assetPositions && accountData.assetPositions.length > 0) {
        console.log('📈 Current Positions:');
        accountData.assetPositions.forEach(pos => {
          console.log(`   ${pos.position.coin}: ${pos.position.szi} (Entry: ${pos.position.entryPx})`);
        });
      } else {
        console.log('📋 No open positions');
      }
      
      return accountData;
    } catch (error) {
      console.error('❌ Failed to get account info:', error.message);
      return null;
    }
  }

  // Test position size calculations
  testPositionSizeCalculation() {
    console.log('🧮 Testing Position Size Calculations...');
    
    // Base order amounts (same as in ButtonWrapper.tsx)
    const baseOrderAmounts = {
      'BTC': 0.01,     // 0.01 BTC (~$1000 at $100k BTC) for 100% position size
      'ETH': 0.1,      // 0.1 ETH (~$400 at $4k ETH) for 100% position size
      'SOL': 5,        // 5 SOL (~$1000 at $200 SOL) for 100% position size
      'ARB': 100,      // 100 ARB (~$100 at $1 ARB) for 100% position size
      'MATIC': 100,    // 100 MATIC (~$100 at $1 MATIC) for 100% position size
      'AVAX': 10,      // 10 AVAX (~$400 at $40 AVAX) for 100% position size
      'DOGE': 1000,    // 1000 DOGE (~$400 at $0.4 DOGE) for 100% position size
      'default': 0.01  // Default base amount
    };

    const minimumOrderSizes = {
      'BTC': 0.0001, 'ETH': 0.001, 'SOL': 0.1, 'ARB': 1, 'MATIC': 1, 'AVAX': 0.01, 'DOGE': 10, 'default': 0.001
    };

    console.log('📊 Position Size Test Results:');
    console.log('=====================================');

    TEST_CONFIG.TEST_POSITION_SIZES.forEach(positionSize => {
      const baseAmount = baseOrderAmounts[TEST_CONFIG.TEST_SYMBOL] || baseOrderAmounts['default'];
      let orderQuantity = (baseAmount * positionSize) / 100;
      
      const minimumSize = minimumOrderSizes[TEST_CONFIG.TEST_SYMBOL] || minimumOrderSizes['default'];
      
      if (orderQuantity < minimumSize) {
        console.log(`⚠️ ${positionSize}% → ${orderQuantity} ${TEST_CONFIG.TEST_SYMBOL} (below minimum, adjusted to ${minimumSize})`);
        orderQuantity = minimumSize;
      } else {
        console.log(`✅ ${positionSize}% → ${orderQuantity} ${TEST_CONFIG.TEST_SYMBOL}`);
      }
      
      // Estimate USD value
      const estimatedPrice = 100000; // Assume $100k BTC
      const estimatedValue = orderQuantity * estimatedPrice;
      console.log(`   💵 Estimated Value: ~$${estimatedValue.toFixed(2)}`);
    });
  }

  // Create a test order (but don't submit it)
  async createTestOrder(side = 'buy', positionSize = 5) {
    try {
      console.log(`📋 Creating test ${side.toUpperCase()} order (${positionSize}% position)...`);
      
      // Calculate position size (same logic as ButtonWrapper)
      const baseOrderAmounts = {
        'BTC': 0.01,
        'default': 0.01
      };
      
      const baseAmount = baseOrderAmounts[TEST_CONFIG.TEST_SYMBOL] || baseOrderAmounts['default'];
      let orderQuantity = (baseAmount * positionSize) / 100;
      
      // Ensure minimum size
      const minimumSize = 0.0001; // BTC minimum
      if (orderQuantity < minimumSize) {
        orderQuantity = minimumSize;
      }

      const order = {
        symbol: TEST_CONFIG.TEST_SYMBOL,
        side: side,
        orderType: 'market',
        quantity: orderQuantity,
        leverage: 5,
        timestamp: Date.now()
      };

      console.log('📄 Test Order Details:', JSON.stringify(order, null, 2));
      console.log('⚠️ NOTE: This is a TEST order - not actually submitted to HyperLiquid');
      
      return order;
    } catch (error) {
      console.error('❌ Failed to create test order:', error.message);
      return null;
    }
  }

  // Test order signing (without submitting)
  async testOrderSigning() {
    try {
      console.log('🔐 Testing order signing...');
      
      const testOrder = await this.createTestOrder('buy', 5);
      if (!testOrder) return false;

      // Create a simple message to sign (simplified version)
      const message = JSON.stringify(testOrder);
      const messageHash = ethers.keccak256(ethers.toUtf8Bytes(message));
      
      // Sign the message
      const signature = await this.wallet.signMessage(ethers.getBytes(messageHash));
      
      console.log('✅ Order signing successful');
      console.log('📝 Signature:', signature.substring(0, 20) + '...');
      
      return true;
    } catch (error) {
      console.error('❌ Order signing failed:', error.message);
      return false;
    }
  }

  // Check for common issues
  async diagnoseIssues() {
    console.log('🔍 Diagnosing Common Issues...');
    console.log('================================');
    
    const issues = [];
    
    // Check wallet setup
    if (!this.wallet) {
      issues.push('❌ Wallet not initialized');
    } else {
      console.log('✅ Wallet initialized correctly');
    }
    
    // Check API connectivity
    const apiConnected = await this.testAPIConnection();
    if (!apiConnected) {
      issues.push('❌ API connection failed');
    } else {
      console.log('✅ API connection working');
    }
    
    // Check account info
    const accountInfo = await this.getAccountInfo();
    if (!accountInfo) {
      issues.push('❌ Cannot retrieve account information');
    } else {
      console.log('✅ Account information accessible');
      
      // Check if account has balance
      if (accountInfo.marginSummary && parseFloat(accountInfo.marginSummary.accountValue) === 0) {
        issues.push('⚠️ Account has zero balance');
      }
    }
    
    // Test signing
    const signingWorks = await this.testOrderSigning();
    if (!signingWorks) {
      issues.push('❌ Order signing failed');
    } else {
      console.log('✅ Order signing working');
    }
    
    console.log('\n📋 Diagnosis Summary:');
    console.log('=====================');
    
    if (issues.length === 0) {
      console.log('🎉 No issues found! Integration should be working.');
    } else {
      console.log('⚠️ Issues found:');
      issues.forEach(issue => console.log(`   ${issue}`));
    }
    
    return issues;
  }

  // Run full test suite
  async runFullTest() {
    console.log('🚀 Starting HyperLiquid Integration Test Suite');
    console.log('==============================================\n');
    
    // Step 1: Initialize wallet
    const walletInit = await this.initializeWallet();
    if (!walletInit) {
      console.log('❌ Test failed at wallet initialization');
      return;
    }
    
    // Step 2: Test position calculations
    this.testPositionSizeCalculation();
    console.log('');
    
    // Step 3: Test API connection
    await this.testAPIConnection();
    console.log('');
    
    // Step 4: Get account info
    await this.getAccountInfo();
    console.log('');
    
    // Step 5: Test order creation and signing
    await this.createTestOrder('buy', 10);
    await this.createTestOrder('sell', 5);
    console.log('');
    
    // Step 6: Run diagnosis
    await this.diagnoseIssues();
    
    console.log('\n✅ Test suite completed');
    console.log('📊 Check the output above for any issues that need to be resolved.');
  }
}

// Run the test if this file is executed directly
async function main() {
  const tester = new HyperLiquidTester();
  await tester.runFullTest();
}

// Export for use in other files
export { HyperLiquidTester, TEST_CONFIG };

// Run test if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
