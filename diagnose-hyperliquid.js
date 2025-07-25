// Simple HyperLiquid Diagnostic Script
// Run this with: node diagnose-hyperliquid.js

const https = require('https');
const crypto = require('crypto');

// Test Configuration
const CONFIG = {
  AGENT_ADDRESS: '0x744b5f069e0e2f38cf625edbb524a8a2d024dad0',
  PRIVATE_KEY: '0x86ac8c28e32b673b6d9d04086bf6dba13161665ea912a8e5a91133ad38debf39',
  API_URL: 'https://api.hyperliquid.xyz',
  TESTNET_URL: 'https://api.hyperliquid-testnet.xyz'
};

class HyperLiquidDiagnostic {
  constructor() {
    this.useTestnet = true; // Change to false for mainnet
    this.apiUrl = this.useTestnet ? CONFIG.TESTNET_URL : CONFIG.API_URL;
  }

  // Make HTTP request
  makeRequest(url, data) {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(data);
      const urlObj = new URL(url);
      
      const options = {
        hostname: urlObj.hostname,
        port: 443,
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve({ status: res.statusCode, data: parsed });
          } catch (error) {
            resolve({ status: res.statusCode, data: responseData });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    });
  }

  // Test API connectivity
  async testAPIConnection() {
    console.log('🌐 Testing API Connection...');
    console.log(`📡 Target: ${this.apiUrl}`);
    
    try {
      const response = await this.makeRequest(`${this.apiUrl}/info`, {
        type: 'meta'
      });

      if (response.status === 200) {
        console.log('✅ API connection successful');
        console.log(`📊 Universe assets: ${response.data.universe?.length || 'Unknown'}`);
        return true;
      } else {
        console.log(`❌ API connection failed with status: ${response.status}`);
        console.log('📄 Response:', response.data);
        return false;
      }
    } catch (error) {
      console.log('❌ API connection error:', error.message);
      return false;
    }
  }

  // Get account information
  async getAccountInfo() {
    console.log('\n📋 Fetching Account Information...');
    console.log(`🔍 Address: ${CONFIG.AGENT_ADDRESS}`);
    
    try {
      const response = await this.makeRequest(`${this.apiUrl}/info`, {
        type: 'clearinghouseState',
        user: CONFIG.AGENT_ADDRESS
      });

      if (response.status === 200) {
        console.log('✅ Account info retrieved successfully');
        
        const accountData = response.data;
        
        // Check margin summary
        if (accountData.marginSummary) {
          console.log('💰 Account Details:');
          console.log(`   Account Value: $${accountData.marginSummary.accountValue || '0'}`);
          console.log(`   Total Margin Used: $${accountData.marginSummary.totalMarginUsed || '0'}`);
          console.log(`   Total Raw Usd: $${accountData.marginSummary.totalRawUsd || '0'}`);
        } else {
          console.log('⚠️ No margin summary found - account may not exist or have balance');
        }
        
        // Check positions
        if (accountData.assetPositions && accountData.assetPositions.length > 0) {
          console.log('📈 Open Positions:');
          accountData.assetPositions.forEach((pos, index) => {
            console.log(`   ${index + 1}. ${pos.position.coin}: ${pos.position.szi} (Entry: $${pos.position.entryPx})`);
          });
        } else {
          console.log('📋 No open positions');
        }
        
        return accountData;
      } else {
        console.log(`❌ Account info request failed with status: ${response.status}`);
        console.log('📄 Response:', response.data);
        return null;
      }
    } catch (error) {
      console.log('❌ Account info error:', error.message);
      return null;
    }
  }

  // Test position size calculations
  testPositionCalculations() {
    console.log('\n🧮 Testing Position Size Calculations...');
    
    const baseOrderAmounts = {
      'BTC': 0.01,     // $1000 at $100k
      'ETH': 0.1,      // $400 at $4k
      'SOL': 5,        // $1000 at $200
      'default': 0.01
    };

    const minimumSizes = {
      'BTC': 0.0001,
      'ETH': 0.001,
      'SOL': 0.1,
      'default': 0.001
    };

    const testCases = [1, 5, 10, 25, 50, 100];
    const symbol = 'BTC';
    
    console.log(`📊 Position calculations for ${symbol}:`);
    console.log('=====================================');
    
    testCases.forEach(positionPercent => {
      const baseAmount = baseOrderAmounts[symbol] || baseOrderAmounts.default;
      let quantity = (baseAmount * positionPercent) / 100;
      
      const minSize = minimumSizes[symbol] || minimumSizes.default;
      const isAdjusted = quantity < minSize;
      
      if (isAdjusted) {
        quantity = minSize;
      }
      
      const estimatedValue = quantity * 100000; // $100k BTC
      
      console.log(`   ${positionPercent}%: ${quantity} BTC (~$${estimatedValue.toFixed(2)}) ${isAdjusted ? '(min adjusted)' : ''}`);
    });
  }

  // Check wallet and private key
  testWalletSetup() {
    console.log('\n🔐 Testing Wallet Setup...');
    
    try {
      // Basic validation of private key format
      if (!CONFIG.PRIVATE_KEY.startsWith('0x') || CONFIG.PRIVATE_KEY.length !== 66) {
        console.log('❌ Invalid private key format');
        return false;
      }
      
      if (!CONFIG.AGENT_ADDRESS.startsWith('0x') || CONFIG.AGENT_ADDRESS.length !== 42) {
        console.log('❌ Invalid address format');
        return false;
      }
      
      console.log('✅ Private key format valid');
      console.log('✅ Address format valid');
      console.log(`🔍 Agent Address: ${CONFIG.AGENT_ADDRESS}`);
      
      return true;
    } catch (error) {
      console.log('❌ Wallet setup error:', error.message);
      return false;
    }
  }

  // Test different order scenarios
  testOrderScenarios() {
    console.log('\n📋 Testing Order Scenarios...');
    
    const scenarios = [
      { side: 'buy', type: 'market', size: 5, description: 'Small market buy order' },
      { side: 'sell', type: 'market', size: 10, description: 'Medium market sell order' },
      { side: 'buy', type: 'limit', size: 25, price: 95000, description: 'Large limit buy order' },
      { side: 'sell', type: 'limit', size: 1, price: 105000, description: 'Small limit sell order' }
    ];
    
    scenarios.forEach((scenario, index) => {
      console.log(`\n   Scenario ${index + 1}: ${scenario.description}`);
      
      // Calculate quantity
      const baseAmount = 0.01; // BTC base
      let quantity = (baseAmount * scenario.size) / 100;
      if (quantity < 0.0001) quantity = 0.0001; // BTC minimum
      
      console.log(`   📊 Side: ${scenario.side.toUpperCase()}`);
      console.log(`   📊 Type: ${scenario.type.toUpperCase()}`);
      console.log(`   📊 Quantity: ${quantity} BTC`);
      if (scenario.price) {
        console.log(`   📊 Price: $${scenario.price}`);
      }
      console.log(`   💵 Est. Value: ~$${(quantity * 100000).toFixed(2)}`);
      console.log('   ⚠️ NOTE: Test scenario only - not executed');
    });
  }

  // Run complete diagnostic
  async runDiagnostic() {
    console.log('🚀 HyperLiquid Integration Diagnostic');
    console.log('=====================================');
    console.log(`🌐 Environment: ${this.useTestnet ? 'TESTNET' : 'MAINNET'}`);
    console.log(`📡 API URL: ${this.apiUrl}\n`);
    
    const results = {
      walletSetup: false,
      apiConnection: false,
      accountInfo: false,
      issues: []
    };
    
    // Test 1: Wallet setup
    results.walletSetup = this.testWalletSetup();
    
    // Test 2: API connection
    results.apiConnection = await this.testAPIConnection();
    
    // Test 3: Account information
    const accountData = await this.getAccountInfo();
    results.accountInfo = accountData !== null;
    
    // Test 4: Position calculations
    this.testPositionCalculations();
    
    // Test 5: Order scenarios
    this.testOrderScenarios();
    
    // Summary
    console.log('\n📋 DIAGNOSTIC SUMMARY');
    console.log('=====================');
    
    console.log(`🔐 Wallet Setup: ${results.walletSetup ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`🌐 API Connection: ${results.apiConnection ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`📊 Account Access: ${results.accountInfo ? '✅ PASS' : '❌ FAIL'}`);
    
    // Identify common issues
    if (!results.walletSetup) {
      results.issues.push('Invalid wallet configuration');
    }
    
    if (!results.apiConnection) {
      results.issues.push('Cannot connect to HyperLiquid API');
    }
    
    if (!results.accountInfo) {
      results.issues.push('Cannot access account information');
    }
    
    if (accountData && accountData.marginSummary && parseFloat(accountData.marginSummary.accountValue) === 0) {
      results.issues.push('Account has zero balance');
    }
    
    console.log('\n🔍 POTENTIAL ISSUES:');
    if (results.issues.length === 0) {
      console.log('🎉 No major issues detected!');
      console.log('💡 If orders still fail, check:');
      console.log('   - Account authorization on HyperLiquid');
      console.log('   - API trading permissions');
      console.log('   - Network connectivity');
    } else {
      results.issues.forEach(issue => {
        console.log(`❌ ${issue}`);
      });
    }
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Fix any issues listed above');
    console.log('2. Ensure account has sufficient balance');
    console.log('3. Verify API trading is enabled');
    console.log('4. Test with smallest possible order size');
    
    return results;
  }
}

// Run diagnostic
async function main() {
  const diagnostic = new HyperLiquidDiagnostic();
  await diagnostic.runDiagnostic();
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { HyperLiquidDiagnostic, CONFIG };
