import { test, expect } from '@playwright/test';

test.describe('Enhanced Limit Chaser - Timeframe Milliseconds', () => {
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

  test('Timeframe options should be in milliseconds', async ({ page }) => {
    console.log('🧪 Testing timeframe millisecond options...');
    
    // Enable limit chaser
    await page.locator('.flex.gap-3.items-center.-mb-2 > .relative > .cursor-pointer').check();
    console.log('✅ Limit chaser enabled');
    
    // Locate the timeframe dropdown
    const timeframeSelect = page.locator('select').first(); // Should be the timeframe select
    
    // Verify default value is 1000ms
    await expect(timeframeSelect).toHaveValue('1000ms');
    console.log('✅ Default timeframe is 1000ms (1 second)');
    
    // Test changing to different millisecond values
    await timeframeSelect.selectOption('250ms');
    await expect(timeframeSelect).toHaveValue('250ms');
    console.log('✅ Can select 250ms timeframe');
    
    await timeframeSelect.selectOption('5000ms');
    await expect(timeframeSelect).toHaveValue('5000ms');
    console.log('✅ Can select 5000ms (5 seconds) timeframe');
    
    await timeframeSelect.selectOption('100ms');
    await expect(timeframeSelect).toHaveValue('100ms');
    console.log('✅ Can select 100ms timeframe');
    
    // Verify all millisecond options are available
    const options = await timeframeSelect.locator('option').allTextContents();
    const expectedOptions = [
      '100 Milliseconds',
      '250 Milliseconds', 
      '500 Milliseconds',
      '1 Second (1000ms)',
      '2 Seconds (2000ms)',
      '5 Seconds (5000ms)',
      '10 Seconds (10000ms)'
    ];
    
    for (const expectedOption of expectedOptions) {
      expect(options).toContain(expectedOption);
    }
    console.log('✅ All millisecond timeframe options are available');
    
    // Verify label shows milliseconds
    await expect(page.locator('text=Trigger Timeframe (Milliseconds)')).toBeVisible();
    console.log('✅ Label correctly indicates milliseconds');
  });

  test('Timeframe millisecond values integrate with limit chaser parameters', async ({ page }) => {
    console.log('🧪 Testing timeframe integration with other parameters...');
    
    // Enable limit chaser
    await page.locator('.flex.gap-3.items-center.-mb-2 > .relative > .cursor-pointer').check();
    
    // Set a specific timeframe
    const timeframeSelect = page.locator('select').first();
    await timeframeSelect.selectOption('500ms');
    
    // Set other parameters
    const maxChasesInput = page.locator('input[type="number"][min="1"][max="100"]');
    await maxChasesInput.fill('25');
    
    const updateIntervalInput = page.locator('input[type="number"]').first();
    await updateIntervalInput.fill('45');
    
    // Verify all settings are preserved
    await expect(timeframeSelect).toHaveValue('500ms');
    await expect(maxChasesInput).toHaveValue('25');
    await expect(updateIntervalInput).toHaveValue('45');
    
    console.log('✅ Timeframe millisecond settings integrate properly with other parameters');
  });
});
