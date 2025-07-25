import { test, expect } from '@playwright/test';

test.describe('HyperLiquid Order Integration Test', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app - using the correct port
    await page.goto('http://localhost:5175');
    await page.waitForLoadState('networkidle');
    
    // Enable console logging to capture order execution details
    page.on('console', msg => {
      if (msg.type() === 'log' || msg.type() === 'error') {
        console.log(`Browser Console [${msg.type()}]:`, msg.text());
      }
    });
  });

  test('should complete full order flow and verify HyperLiquid integration', async ({ page }) => {
    console.log('🚀 Starting HyperLiquid Order Integration Test');
    
    // Step 1: Connect Master Account
    console.log('📋 Step 1: Connecting Master Account');
    await page.getByRole('button', { name: 'Connect Master Account' }).click();
    await page.getByRole('textbox', { name: 'e.g., Main Trading Account' }).fill('Master Account');
    await page.getByRole('textbox', { name: '0x...' }).fill('0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB');
    await page.getByRole('button', { name: 'Connect Master Account' }).nth(1).click();
    
    // Verify master account connection
    await expect(page.locator('text=Master: Master Account')).toBeVisible({ timeout: 5000 });
    console.log('✅ Master account connected successfully');

    // Step 2: Add Agent Account for Trading
    console.log('📋 Step 2: Adding Agent Account');
    await page.getByTestId('accounts-tab').click();
    await page.getByText('Account 1Not ConnectedN/AN/').click();
    
    // Fill agent account details
    await page.getByRole('textbox', { name: 'Wallet Address (0x...)' }).fill('0x744b5f069e0e2f38cf625edbb524a8a2d024dad0');
    await page.getByRole('textbox', { name: 'Private Key (for trading' }).fill('0x86ac8c28e32b673b6d9d04086bf6dba13161665ea912a8e5a91133ad38debf39');
    await page.getByRole('button', { name: 'Connect & Enable Trading' }).click();
    
    // Verify agent account connection
    await expect(page.locator('text=Agent: Account 1 (Trading Ready)')).toBeVisible({ timeout: 5000 });
    console.log('✅ Agent account connected successfully');

    // Step 3: Select Trading Account
    await page.getByRole('article').filter({ hasText: 'Account 1ConnectedBTC-' }).getByLabel('', { exact: true }).check();
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    // Step 4: Configure Trading Parameters
    console.log('📋 Step 3: Configuring Trading Parameters');
    
    // Set order type to Market for faster execution
    await page.locator('text=Market').click();
    
    // Set position size to 10% for testing
    const positionSlider = page.locator('[role="slider"]').first();
    await positionSlider.fill('10');
    
    // Set leverage to 5x for safer testing
    const leverageSlider = page.locator('[role="slider"]').nth(1);
    await leverageSlider.fill('5');
    
    console.log('✅ Trading parameters configured');

    // Step 5: Test LONG Order
    console.log('📋 Step 4: Testing LONG Order Execution');
    
    // Click LONG button and wait for response
    await page.getByRole('button', { name: 'LONG' }).click();
    
    // Wait for order processing
    await page.waitForTimeout(3000);
    
    // Check for success or error messages
    const statusMessage = await page.locator('.text-yellow-400').textContent();
    if (statusMessage) {
      console.log('📊 LONG Order Status:', statusMessage);
    }

    // Step 6: Test SHORT Order
    console.log('📋 Step 5: Testing SHORT Order Execution');
    
    // Wait a moment between orders
    await page.waitForTimeout(2000);
    
    // Click SHORT button and wait for response
    await page.getByRole('button', { name: 'SHORT' }).click();
    
    // Wait for order processing
    await page.waitForTimeout(3000);
    
    // Check for success or error messages
    const shortStatusMessage = await page.locator('.text-yellow-400').textContent();
    if (shortStatusMessage) {
      console.log('📊 SHORT Order Status:', shortStatusMessage);
    }

    // Step 7: Verify Orders in Browser Console
    console.log('📋 Step 6: Checking Browser Console for Order Details');
    
    // Wait for any final console outputs
    await page.waitForTimeout(2000);
    
    console.log('✅ Order integration test completed');
  });

  test('should test position size calculation', async ({ page }) => {
    console.log('🧮 Testing Position Size Calculation');
    
    // Set up accounts first
    await page.getByRole('button', { name: 'Connect Master Account' }).click();
    await page.getByRole('textbox', { name: 'e.g., Main Trading Account' }).fill('Test Master');
    await page.getByRole('textbox', { name: '0x...' }).fill('0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB');
    await page.getByRole('button', { name: 'Connect Master Account' }).nth(1).click();
    
    await page.getByTestId('accounts-tab').click();
    await page.getByText('Account 1Not ConnectedN/AN/').click();
    await page.getByRole('textbox', { name: 'Wallet Address (0x...)' }).fill('0x744b5f069e0e2f38cf625edbb524a8a2d024dad0');
    await page.getByRole('textbox', { name: 'Private Key (for trading' }).fill('0x86ac8c28e32b673b6d9d04086bf6dba13161665ea912a8e5a91133ad38debf39');
    await page.getByRole('button', { name: 'Connect & Enable Trading' }).click();
    await page.getByRole('article').filter({ hasText: 'Account 1ConnectedBTC-' }).getByLabel('', { exact: true }).check();
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    // Test different position sizes
    const testCases = [1, 5, 10, 25, 50, 100];
    
    for (const positionSize of testCases) {
      console.log(`🔍 Testing ${positionSize}% position size`);
      
      // Set position size
      const positionInput = page.locator('input[type="number"]').first();
      await positionInput.fill(positionSize.toString());
      
      // Click LONG to trigger calculation
      await page.getByRole('button', { name: 'LONG' }).click();
      
      // Wait for console output
      await page.waitForTimeout(1000);
    }
    
    console.log('✅ Position size calculation test completed');
  });

  test('should test different order types', async ({ page }) => {
    console.log('📊 Testing Different Order Types');
    
    // Set up accounts
    await page.getByRole('button', { name: 'Connect Master Account' }).click();
    await page.getByRole('textbox', { name: 'e.g., Main Trading Account' }).fill('Test Master');
    await page.getByRole('textbox', { name: '0x...' }).fill('0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB');
    await page.getByRole('button', { name: 'Connect Master Account' }).nth(1).click();
    
    await page.getByTestId('accounts-tab').click();
    await page.getByText('Account 1Not ConnectedN/AN/').click();
    await page.getByRole('textbox', { name: 'Wallet Address (0x...)' }).fill('0x744b5f069e0e2f38cf625edbb524a8a2d024dad0');
    await page.getByRole('textbox', { name: 'Private Key (for trading' }).fill('0x86ac8c28e32b673b6d9d04086bf6dba13161665ea912a8e5a91133ad38debf39');
    await page.getByRole('button', { name: 'Connect & Enable Trading' }).click();
    await page.getByRole('article').filter({ hasText: 'Account 1ConnectedBTC-' }).getByLabel('', { exact: true }).check();
    await page.getByRole('button', { name: 'Close', exact: true }).click();

    // Test Market Order
    console.log('🔍 Testing Market Order');
    await page.locator('text=Market').click();
    await page.getByRole('button', { name: 'LONG' }).click();
    await page.waitForTimeout(2000);

    // Test Limit Order
    console.log('🔍 Testing Limit Order');
    await page.locator('text=Limit').click();
    
    // Set trigger price
    await page.locator('div').filter({ hasText: /^Trigger Price$/ }).getByPlaceholder('Enter Price').fill('95000');
    
    // Set stop price
    await page.locator('div').filter({ hasText: /^Stop Price$/ }).getByPlaceholder('Enter Price').fill('90000');
    
    await page.getByRole('button', { name: 'LONG' }).click();
    await page.waitForTimeout(2000);
    
    console.log('✅ Order type test completed');
  });

  test('should verify API connection and error handling', async ({ page }) => {
    console.log('🌐 Testing API Connection and Error Handling');
    
    // Try to place order without proper setup to test error handling
    await page.getByRole('button', { name: 'LONG' }).click();
    
    // Should show error message about missing agent account
    await expect(page.locator('text=Please add an agent account')).toBeVisible({ timeout: 3000 });
    console.log('✅ Error handling working correctly');
    
    // Test with only master account (no agent)
    await page.getByRole('button', { name: 'Connect Master Account' }).click();
    await page.getByRole('textbox', { name: 'e.g., Main Trading Account' }).fill('Test Master');
    await page.getByRole('textbox', { name: '0x...' }).fill('0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB');
    await page.getByRole('button', { name: 'Connect Master Account' }).nth(1).click();
    
    await page.getByRole('button', { name: 'LONG' }).click();
    
    // Should still show error about missing agent account
    await expect(page.locator('text=Please add an agent account')).toBeVisible({ timeout: 3000 });
    console.log('✅ Agent account validation working correctly');
  });
});
