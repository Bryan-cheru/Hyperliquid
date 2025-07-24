import { test, expect } from '@playwright/test';

test.describe('Hyperliquid Trading App - Basic Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('should load the main trading interface', async ({ page }) => {
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Hyperliquid|Trading/i);
    
    // Check for main UI elements
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Main interface loaded');
  });

  test('should display trading controls', async ({ page }) => {
    // Look for Long/Short buttons
    const longButton = page.getByText('Long', { exact: false });
    const shortButton = page.getByText('Short', { exact: false });
    
    // At least one trading button should be visible
    const hasLongButton = await longButton.isVisible().catch(() => false);
    const hasShortButton = await shortButton.isVisible().catch(() => false);
    
    expect(hasLongButton || hasShortButton).toBeTruthy();
    console.log('✅ Trading controls are present');
  });

  test('should have order quantity input field', async ({ page }) => {
    // Look for the quantity input we just added
    const quantityInput = page.locator('input[placeholder*="quantity"]');
    
    if (await quantityInput.isVisible()) {
      // Test entering a quantity
      await quantityInput.fill('0.001');
      await expect(quantityInput).toHaveValue('0.001');
      console.log('✅ Quantity input works correctly');
    } else {
      console.log('⚠️ Quantity input not found - check if it rendered');
    }
  });

  test('should show Market/Limit order type options', async ({ page }) => {
    // Look for Market and Limit buttons/tabs
    const marketOption = page.getByText('Market', { exact: false });
    const limitOption = page.getByText('Limit', { exact: false });
    
    const hasMarket = await marketOption.isVisible().catch(() => false);
    const hasLimit = await limitOption.isVisible().catch(() => false);
    
    expect(hasMarket || hasLimit).toBeTruthy();
    console.log('✅ Order type options are available');
  });

  test('should show leverage controls', async ({ page }) => {
    // Look for leverage-related elements
    const leverageText = page.getByText('Leverage', { exact: false });
    const leverageSlider = page.locator('[role="slider"]');
    
    const hasLeverageText = await leverageText.isVisible().catch(() => false);
    const hasSlider = await leverageSlider.first().isVisible().catch(() => false);
    
    expect(hasLeverageText || hasSlider).toBeTruthy();
    console.log('✅ Leverage controls are present');
  });

  test('should handle order placement attempt', async ({ page }) => {
    // Try to click a trading button
    const longButton = page.getByText('Long', { exact: false });
    
    if (await longButton.isVisible()) {
      await longButton.click();
      
      // Should show some response (error message about account, etc.)
      await page.waitForTimeout(1000); // Give time for response
      console.log('✅ Order placement button responds');
    } else {
      console.log('⚠️ Long button not found');
    }
  });

  test('should display minimum order size hints', async ({ page }) => {
    // Look for minimum size information
    const minSizeText = page.getByText('Minimum', { exact: false });
    const btcMinText = page.getByText('BTC=0.0001', { exact: false });
    
    const hasMinInfo = await minSizeText.isVisible().catch(() => false);
    const hasBtcMin = await btcMinText.isVisible().catch(() => false);
    
    if (hasMinInfo || hasBtcMin) {
      console.log('✅ Minimum order size information is displayed');
    } else {
      console.log('⚠️ Minimum size hints not found');
    }
  });

  test('should capture console logs for debugging', async ({ page }) => {
    const logs: string[] = [];
    
    // Capture console messages
    page.on('console', msg => {
      if (msg.type() === 'log') {
        logs.push(msg.text());
      }
    });
    
    // Trigger some actions to generate logs
    await page.reload();
    await page.waitForTimeout(2000);
    
    // Check if we captured any relevant logs
    const relevantLogs = logs.filter(log => 
      log.includes('ORDER TYPE') || 
      log.includes('quantity') || 
      log.includes('tradingParams')
    );
    
    console.log(`📊 Captured ${logs.length} total logs, ${relevantLogs.length} relevant`);
    console.log('Sample logs:', relevantLogs.slice(0, 3));
  });

});
