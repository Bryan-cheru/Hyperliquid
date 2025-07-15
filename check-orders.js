// Check orders for different wallets
console.log('🔍 CHECKING ORDERS FOR DIFFERENT WALLETS');
console.log('======================================');

const TEST_WALLET = '0x99b7988987bb31208804ad2334faa155249010bf';  // Test script wallet
const MAIN_WALLET = '0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB';   // Main account wallet  
const APP_WALLET = '0x137427826a08c51fee6efb635b1eff3e04429934';    // Current app wallet

async function checkOrders(walletAddress, label) {
  try {
    console.log(`\n📊 Checking orders for ${label}:`);
    console.log(`   Wallet: ${walletAddress}`);
    
    const response = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type: "openOrders",
        user: walletAddress
      })
    });
    
    const orders = await response.json();
    console.log(`   📋 Open Orders: ${orders.length}`);
    
    if (orders.length > 0) {
      console.log('   📑 Order Details:');
      orders.forEach((order, i) => {
        console.log(`      ${i + 1}. Asset: ${order.coin}, Side: ${order.side}, Size: ${order.sz}, Price: ${order.limitPx}`);
        console.log(`         Order ID: ${order.oid}, Status: ${order.isPositionTpsl ? 'TP/SL' : 'Regular'}`);
      });
    } else {
      console.log('   ℹ️ No open orders found');
    }
    
    // Also check account info
    const accountResponse = await fetch('https://api.hyperliquid.xyz/info', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        type: "clearinghouseState",
        user: walletAddress
      })
    });
    
    const accountData = await accountResponse.json();
    if (accountData.marginSummary) {
      console.log(`   💰 Account Value: $${accountData.marginSummary.accountValue}`);
      console.log(`   💳 Withdrawable: $${accountData.withdrawable}`);
    }
    
  } catch (error) {
    console.error(`❌ Error checking ${label}:`, error.message);
  }
}

async function main() {
  await checkOrders(TEST_WALLET, 'TEST SCRIPT WALLET');
  await checkOrders(MAIN_WALLET, 'MAIN ACCOUNT WALLET');
  await checkOrders(APP_WALLET, 'CURRENT APP WALLET');
  
  console.log('\n💡 SOLUTION:');
  console.log('To see orders in HyperLiquid web interface:');
  console.log('1. Connect with: ' + APP_WALLET + ' (current app wallet)');
  console.log('2. OR connect with: ' + MAIN_WALLET + ' (main account)');
  console.log('3. The app is now using a different wallet than the test scripts');
}

main().catch(console.error);
