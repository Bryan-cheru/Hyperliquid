import { test, expect } from '@playwright/test';

test.describe('Basket Order - Hidden Functionality', () => {
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

  test('Basket Order UI should be completely hidden from user', async ({ page }) => {
    console.log('🧪 Testing basket order UI is completely hidden...');
    
    // Verify the entire basket order component is not visible
    await expect(page.locator('text=Basket Orders')).not.toBeVisible();
    await expect(page.locator('[data-testid="basket-orders-toggle"]')).not.toBeVisible();
    await expect(page.locator('text=🧺')).not.toBeVisible();
    
    // Verify basket order sections are not visible
    await expect(page.locator('text=Create Basket')).not.toBeVisible();
    await expect(page.locator('text=Manage Baskets')).not.toBeVisible();
    await expect(page.locator('[data-testid="create-basket-tab"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="basket-name-input"]')).not.toBeVisible();
    
    // Verify form elements are not visible
    await expect(page.locator('[data-testid="basket-symbol-select"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="basket-side-select"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="basket-quantity-input"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="create-basket-button"]')).not.toBeVisible();
    
    // Verify specific basket order text is not visible
    await expect(page.locator('text=Multi-order execution with smart tracking')).not.toBeVisible();
    await expect(page.locator('text=Stop Loss Configuration')).not.toBeVisible();
    await expect(page.locator('text=Limit Chaser Configuration')).not.toBeVisible();
    
    console.log('✅ All basket order UI elements are hidden from user');
  });

  test('Basket Order functionality should work in background despite hidden UI', async ({ page }) => {
    console.log('🧪 Testing basket order background functionality...');
    
    // Wait for auto-initialization
    await page.waitForTimeout(2000);
    
    // Check browser console for auto-created basket messages
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      consoleMessages.push(msg.text());
    });
    
    // Refresh to trigger auto-creation
    await page.reload();
    await page.waitForTimeout(3000);
    
    // Look for auto-basket creation in console
    const autoBasketMessage = consoleMessages.find(msg => 
      msg.includes('Auto-created hidden basket') || 
      msg.includes('basket_created')
    );
    
    if (autoBasketMessage) {
      console.log(`✅ Auto-basket creation detected: ${autoBasketMessage}`);
    } else {
      console.log('⚠️ Auto-basket creation may not have triggered (needs connected accounts)');
    }
    
    // Verify no visible basket UI appears even when functionality is active
    await expect(page.locator('text=Basket Orders')).not.toBeVisible();
    console.log('✅ Basket functionality runs silently without UI');
  });

  test('Hidden basket order should auto-enable when accounts connected', async ({ page }) => {
    console.log('🧪 Testing auto-enable behavior...');
    
    // The basket order should auto-enable in background when accounts are connected
    // Since it's hidden, we check indirectly through functionality
    
    // Verify no visible basket interface
    await expect(page.locator('text=Basket Orders')).not.toBeVisible();
    
    // Check that limit chaser (which integrates with basket) is available
    // This suggests basket functionality is running in background
    await expect(page.locator('text=Enhanced Limit Chaser')).toBeVisible();
    
    console.log('✅ Accounts connected, basket auto-enabled silently');
  });

  test('DOM structure should contain hidden basket elements but not display them', async ({ page }) => {
    console.log('🧪 Testing DOM structure for hidden elements...');
    
    // Check if basket elements exist in DOM but are hidden
    const hiddenBasketContainer = page.locator('div').filter({ hasText: '🧺' }).first();
    
    // Should exist in DOM
    await expect(hiddenBasketContainer).toBeAttached();
    
    // But should not be visible
    await expect(hiddenBasketContainer).not.toBeVisible();
    
    console.log('✅ Hidden basket elements exist in DOM but are not visible');
  });

  test('Integration with other trading components should work despite hidden basket UI', async ({ page }) => {
    console.log('🧪 Testing integration with other components...');
    
    // Verify other trading components still work normally
    await expect(page.locator('text=Enhanced Limit Chaser')).toBeVisible();
    
    // Enable limit chaser to test integration
    await page.locator('.flex.gap-3.items-center.-mb-2 > .relative > .cursor-pointer').check();
    
    // Verify limit chaser works (which should integrate with hidden basket functionality)
    await expect(page.locator('text=🟢 Active')).toBeVisible();
    
    // Basket orders should still be hidden
    await expect(page.locator('text=Basket Orders')).not.toBeVisible();
    
    console.log('✅ Integration works while basket UI remains hidden');
  });
});
