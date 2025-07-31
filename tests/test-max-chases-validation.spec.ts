import { test, expect } from '@playwright/test';

test.describe('Enhanced Limit Chaser - Max Chases Validation', () => {
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

  test('Max chases should not exceed 100', async ({ page }) => {
    console.log('🧪 Testing max chases validation...');
    
    // Enable limit chaser
    await page.locator('.flex.gap-3.items-center.-mb-2 > .relative > .cursor-pointer').check();
    console.log('✅ Limit chaser enabled');
    
    // Locate the max chases input field (should be the 6th number input based on pattern)
    const maxChasesInput = page.locator('input[type="number"][min="1"][max="100"]');
    
    // Test exceeding maximum value
    await maxChasesInput.fill('150');
    await page.keyboard.press('Tab'); // Trigger onChange by focusing away
    
    // Verify it caps at 100
    await expect(maxChasesInput).toHaveValue('100');
    console.log('✅ Max chases capped at 100 when entering 150');
    
    // Test negative value
    await maxChasesInput.fill('-5');
    await page.keyboard.press('Tab');
    
    // Verify it sets to minimum 1
    await expect(maxChasesInput).toHaveValue('1');
    console.log('✅ Max chases set to minimum 1 when entering negative value');
    
    // Test valid value within range
    await maxChasesInput.fill('50');
    await page.keyboard.press('Tab');
    
    // Verify it accepts valid value
    await expect(maxChasesInput).toHaveValue('50');
    console.log('✅ Max chases accepts valid value of 50');
    
    // Test zero value
    await maxChasesInput.fill('0');
    await page.keyboard.press('Tab');
    
    // Verify it sets to minimum 1
    await expect(maxChasesInput).toHaveValue('1');
    console.log('✅ Max chases set to minimum 1 when entering 0');
    
    // Test boundary value 100
    await maxChasesInput.fill('100');
    await page.keyboard.press('Tab');
    
    // Verify it accepts maximum value
    await expect(maxChasesInput).toHaveValue('100');
    console.log('✅ Max chases accepts maximum value of 100');
    
    // Verify validation note is visible
    await expect(page.locator('text=Max: 100')).toBeVisible();
    console.log('✅ Validation note "Max: 100" is visible');
  });

  test('Max chases validation preserves other limit chaser settings', async ({ page }) => {
    console.log('🧪 Testing max chases validation with other settings...');
    
    // Enable limit chaser
    await page.locator('.flex.gap-3.items-center.-mb-2 > .relative > .cursor-pointer').check();
    
    // Set other parameters first - update interval input should be the first number input
    const updateIntervalInput = page.locator('input[type="number"]').first();
    await updateIntervalInput.fill('60');
    
    // Set max chases to invalid value
    const maxChasesInput = page.locator('input[type="number"][min="1"][max="100"]');
    await maxChasesInput.fill('200');
    await page.keyboard.press('Tab');
    
    // Verify max chases is capped but other settings preserved
    await expect(maxChasesInput).toHaveValue('100');
    await expect(updateIntervalInput).toHaveValue('60');
    console.log('✅ Max chases validation preserves other settings');
  });
});
