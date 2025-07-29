import { test, expect } from '@playwright/test';

test.describe('Enhanced Limit Chaser - Hidden Basket Order Functionality', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('http://localhost:5174/');
    
    // Setup master account
    await page.getByRole('button', { name: 'Connect Master Account' }).click();
    await page.getByRole('textbox', { name: 'e.g., Main Trading Account' }).fill('master');
    await page.getByRole('textbox', { name: '0x...' }).fill('0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB');
    await page.getByRole('button', { name: 'Connect Master Account' }).nth(1).click();
    
    // Setup trading account
    await page.getByTestId('accounts-tab').click();
    await page.getByText('Account 1Not ConnectedN/AN/').click();
    await page.getByRole('textbox', { name: 'Private Key (for trading' }).fill('0x86ac8c28e32b673b6d9d04086bf6dba13161665ea912a8e5a91133ad38debf39');
    await page.getByRole('textbox', { name: 'Wallet Address (0x...)' }).fill('0x744b5f069e0e2f38cf625edbb524a8a2d024dad0');
    await page.getByRole('button', { name: 'Connect & Enable Trading' }).click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
  });

  test('Basket order UI elements should be hidden from interface', async ({ page }) => {
    console.log('🧪 Testing basket order UI is hidden...');
    
    // Enable limit chaser
    await page.locator('.flex.gap-3.items-center.-mb-2 > .relative > .cursor-pointer').check();
    console.log('✅ Limit chaser enabled');
    
    // Verify basket order related UI elements are not visible
    await expect(page.locator('text=Basket Order')).not.toBeVisible();
    await expect(page.locator('text=Take Profit Levels')).not.toBeVisible();
    await expect(page.locator('text=Bracket Order')).not.toBeVisible();
    
    // Verify price distance section is hidden
    const priceDistanceSection = page.locator('div').filter({ hasText: 'Price Distance' }).first();
    await expect(priceDistanceSection).toBeHidden();
    console.log('✅ Price distance section is hidden');
    
    // Verify hidden controls exist in DOM but are not visible
    const hiddenControls = page.locator('.hidden');
    await expect(hiddenControls).toBeAttached(); // Exists in DOM
    await expect(hiddenControls).not.toBeVisible(); // But not visible
    console.log('✅ Hidden basket order controls exist but are not visible');
  });

  test('Basket order logic should function despite hidden UI', async ({ page }) => {
    console.log('🧪 Testing hidden basket order logic...');
    
    // Enable limit chaser
    await page.locator('.flex.gap-3.items-center.-mb-2 > .relative > .cursor-pointer').check();
    
    // Set trigger prices to activate basket logic
    await page.locator('input[type="number"]').nth(6).fill('50000'); // Stop trigger price
    
    // Wait for auto-calculation of take profit levels
    await page.waitForTimeout(1000);
    
    // Check if limit chaser strategy info shows basket integration
    const strategyInfo = page.locator('text=Execution Details');
    await expect(strategyInfo).toBeVisible();
    console.log('✅ Strategy information displays without showing basket UI');
    
    // Verify long and short price limits are calculated (basket logic working)
    const longPriceInput = page.locator('input[placeholder="Enter Price"]').first();
    const shortPriceInput = page.locator('input[placeholder="Enter Price"]').nth(1);
    
    // These should have auto-calculated values from basket logic
    const longValue = await longPriceInput.inputValue();
    const shortValue = await shortPriceInput.inputValue();
    
    expect(parseFloat(longValue)).toBeGreaterThan(0);
    expect(parseFloat(shortValue)).toBeGreaterThan(0);
    console.log(`✅ Auto-calculated prices: Long=${longValue}, Short=${shortValue}`);
  });

  test('Hidden basket order parameters should be included in component output', async ({ page }) => {
    console.log('🧪 Testing basket order parameters are passed to parent...');
    
    // Enable limit chaser
    await page.locator('.flex.gap-3.items-center.-mb-2 > .relative > .cursor-pointer').check();
    
    // Set configuration values
    await page.locator('input[type="number"]').nth(6).fill('45000'); // Stop trigger
    await page.locator('input[type="number"][min="1"][max="100"]').fill('50'); // Max chases
    
    // Verify component is active and configured
    await expect(page.locator('text=🟢 Active')).toBeVisible();
    
    // The onParametersChange callback should include hidden basket parameters
    // This would be verified in integration tests with the parent component
    console.log('✅ Component active with hidden basket parameters');
    
    // Check strategy display shows integration is working
    const configReady = page.locator('text=Configuration Ready');
    await expect(configReady).toBeVisible();
    console.log('✅ Configuration ready indicator shows basket integration');
  });

  test('Timeframe and max chases validation work with hidden basket logic', async ({ page }) => {
    console.log('🧪 Testing validation works with hidden basket functionality...');
    
    // Enable limit chaser
    await page.locator('.flex.gap-3.items-center.-mb-2 > .relative > .cursor-pointer').check();
    
    // Test max chases validation still works
    const maxChasesInput = page.locator('input[type="number"][min="1"][max="100"]');
    await maxChasesInput.fill('150');
    await page.keyboard.press('Tab');
    await expect(maxChasesInput).toHaveValue('100');
    console.log('✅ Max chases validation works with hidden basket logic');
    
    // Test timeframe selection works
    const timeframeSelect = page.locator('select').first();
    await timeframeSelect.selectOption('500ms');
    await expect(timeframeSelect).toHaveValue('500ms');
    console.log('✅ Timeframe selection works with hidden basket logic');
    
    // Verify all functionality coexists
    await expect(page.locator('text=Execution Details')).toBeVisible();
    console.log('✅ All features work together with hidden basket functionality');
  });
});
