import { test, expect, Page } from '@playwright/test';

// Test data constants
const TEST_CONFIG = {
  AGENT_WALLET: {
    address: '0x1234567890123456789012345678901234567890',
    privateKey: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab'
  },
  MASTER_WALLET: {
    address: '0x0987654321098765432109876543210987654321',
    privateKey: '' // View only
  },
  BASKET_ORDER: {
    name: 'E2E Test Basket Order',
    symbol: 'BTC',
    side: 'buy',
    quantity: 0.001,
    leverage: 10,
    entryPrice: 95000,
    stopLossPrice: 93000,
    takeProfitPrice: 98000,
    limitChaserDistance: 0.01,
    timeframe: '15m'
  }
};

// Page selectors
const SELECTORS = {
  // Account Management
  accountsTab: '[data-testid="accounts-tab"]',
  addAgentButton: '[data-testid="add-agent-button"]',
  agentAddressInput: '[data-testid="agent-address-input"]',
  agentPrivateKeyInput: '[data-testid="agent-private-key-input"]',
  connectAgentButton: '[data-testid="connect-agent-button"]',
  accountStatus: '[data-testid="account-status"]',
  accountBalance: '[data-testid="account-balance"]',
  
  // Trading Controls
  tradingControlsTab: '[data-testid="trading-controls-tab"]',
  basketOrderTab: '[data-testid="basket-order-tab"]',
  createBasketTab: '[data-testid="create-basket-tab"]',
  manageBasketTab: '[data-testid="manage-basket-tab"]',
  
  // Basket Order Form
  basketNameInput: '[data-testid="basket-name-input"]',
  symbolSelect: '[data-testid="symbol-select"]',
  sideSelect: '[data-testid="side-select"]',
  quantityInput: '[data-testid="quantity-input"]',
  leverageInput: '[data-testid="leverage-input"]',
  orderTypeSelect: '[data-testid="order-type-select"]',
  entryPriceInput: '[data-testid="entry-price-input"]',
  
  // Stop Loss Configuration
  stopLossCheckbox: '[data-testid="stop-loss-checkbox"]',
  stopLossPriceInput: '[data-testid="stop-loss-price-input"]',
  stopLossTypeSelect: '[data-testid="stop-loss-type-select"]',
  timeframeSelect: '[data-testid="timeframe-select"]',
  candleCloseCheckbox: '[data-testid="candle-close-checkbox"]',
  
  // Limit Chaser Configuration
  limitChaserCheckbox: '[data-testid="limit-chaser-checkbox"]',
  chaserDistanceInput: '[data-testid="chaser-distance-input"]',
  chaserDistanceTypeSelect: '[data-testid="chaser-distance-type-select"]',
  fillOrCancelCheckbox: '[data-testid="fill-or-cancel-checkbox"]',
  updateIntervalInput: '[data-testid="update-interval-input"]',
  maxChasesInput: '[data-testid="max-chases-input"]',
  
  // Take Profit Configuration
  takeProfitPriceInput: '[data-testid="take-profit-price-input"]',
  takeProfitQuantityInput: '[data-testid="take-profit-quantity-input"]',
  
  // Actions
  createBasketButton: '[data-testid="create-basket-button"]',
  basketsList: '[data-testid="baskets-list"]',
  basketItem: '[data-testid="basket-item"]',
  basketStatus: '[data-testid="basket-status"]',
  cancelBasketButton: '[data-testid="cancel-basket-button"]',
  
  // Console/Logs
  consoleLog: '[data-testid="console-log"]',
  errorMessage: '[data-testid="error-message"]',
  successMessage: '[data-testid="success-message"]'
};

class BasketOrderTestHelper {
  constructor(private page: Page) {}

  async setupTestAccount() {
    // Navigate to accounts management
    await this.page.click(SELECTORS.accountsTab);
    await this.page.waitForSelector(SELECTORS.addAgentButton);

    // Add agent account
    await this.page.click(SELECTORS.addAgentButton);
    await this.page.fill(SELECTORS.agentAddressInput, TEST_CONFIG.AGENT_WALLET.address);
    await this.page.fill(SELECTORS.agentPrivateKeyInput, TEST_CONFIG.AGENT_WALLET.privateKey);
    await this.page.click(SELECTORS.connectAgentButton);

    // Wait for connection
    await this.page.waitForSelector(SELECTORS.accountStatus);
    const status = await this.page.textContent(SELECTORS.accountStatus);
    expect(status).toBe('Connected');
  }

  async navigateToBasketOrders() {
    await this.page.click(SELECTORS.tradingControlsTab);
    await this.page.waitForSelector(SELECTORS.basketOrderTab);
    await this.page.click(SELECTORS.basketOrderTab);
    await this.page.waitForSelector(SELECTORS.createBasketTab);
  }

  async createAdvancedBasketOrder() {
    // Switch to create basket tab
    await this.page.click(SELECTORS.createBasketTab);
    
    // Fill basic order details
    await this.page.fill(SELECTORS.basketNameInput, TEST_CONFIG.BASKET_ORDER.name);
    await this.page.selectOption(SELECTORS.symbolSelect, TEST_CONFIG.BASKET_ORDER.symbol);
    await this.page.selectOption(SELECTORS.sideSelect, TEST_CONFIG.BASKET_ORDER.side);
    await this.page.fill(SELECTORS.quantityInput, TEST_CONFIG.BASKET_ORDER.quantity.toString());
    await this.page.fill(SELECTORS.leverageInput, TEST_CONFIG.BASKET_ORDER.leverage.toString());
    await this.page.selectOption(SELECTORS.orderTypeSelect, 'limit');
    await this.page.fill(SELECTORS.entryPriceInput, TEST_CONFIG.BASKET_ORDER.entryPrice.toString());

    // Configure stop loss with trigger
    await this.page.check(SELECTORS.stopLossCheckbox);
    await this.page.fill(SELECTORS.stopLossPriceInput, TEST_CONFIG.BASKET_ORDER.stopLossPrice.toString());
    await this.page.selectOption(SELECTORS.stopLossTypeSelect, 'limit');
    await this.page.selectOption(SELECTORS.timeframeSelect, TEST_CONFIG.BASKET_ORDER.timeframe);
    await this.page.check(SELECTORS.candleCloseCheckbox);

    // Configure limit chaser
    await this.page.check(SELECTORS.limitChaserCheckbox);
    await this.page.fill(SELECTORS.chaserDistanceInput, TEST_CONFIG.BASKET_ORDER.limitChaserDistance.toString());
    await this.page.selectOption(SELECTORS.chaserDistanceTypeSelect, 'percentage');
    await this.page.check(SELECTORS.fillOrCancelCheckbox);
    await this.page.fill(SELECTORS.updateIntervalInput, '30');
    await this.page.fill(SELECTORS.maxChasesInput, '10');

    // Configure take profit
    await this.page.fill(SELECTORS.takeProfitPriceInput, TEST_CONFIG.BASKET_ORDER.takeProfitPrice.toString());
    await this.page.fill(SELECTORS.takeProfitQuantityInput, '50');

    // Create the basket order
    await this.page.click(SELECTORS.createBasketButton);
  }

  async verifyBasketCreation() {
    // Wait for success message or basket to appear in list
    await this.page.waitForSelector(SELECTORS.successMessage, { timeout: 10000 });
    
    // Switch to manage baskets tab
    await this.page.click(SELECTORS.manageBasketTab);
    await this.page.waitForSelector(SELECTORS.basketsList);

    // Verify basket appears in list
    const basketItems = await this.page.locator(SELECTORS.basketItem);
    expect(await basketItems.count()).toBeGreaterThan(0);

    // Verify basket details
    const firstBasket = basketItems.first();
    const basketName = await firstBasket.locator('[data-testid="basket-name"]').textContent();
    expect(basketName).toContain(TEST_CONFIG.BASKET_ORDER.name);
  }

  async monitorBasketExecution() {
    // Monitor console logs for basket execution events
    const logs: string[] = [];
    
    this.page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🎯') || text.includes('🔥') || text.includes('⚡')) {
        logs.push(text);
      }
    });

    // Wait for specific execution logs
    await this.page.waitForFunction(
      () => {
        const consoleElement = document.querySelector('[data-testid="console-log"]');
        return consoleElement && consoleElement.textContent?.includes('Basket created');
      },
      { timeout: 30000 }
    );

    return logs;
  }

  async simulateStopLossTrigger() {
    // This would typically involve mocking price data or API responses
    // For now, we'll simulate by directly calling JavaScript functions
    await this.page.evaluate(() => {
      // Simulate candle close below stop loss price
      window.basketOrderManager?.simulateStopLossTrigger?.('BTC', 92000);
    });
  }

  async verifyLimitChaserExecution() {
    // Wait for limit chaser logs
    await this.page.waitForFunction(
      () => {
        const consoleElement = document.querySelector('[data-testid="console-log"]');
        return consoleElement && consoleElement.textContent?.includes('Limit chaser');
      },
      { timeout: 60000 }
    );

    // Verify basket status changed to completed
    const basketStatus = await this.page.locator(SELECTORS.basketStatus).first();
    await expect(basketStatus).toHaveText('completed');
  }
}

test.describe('Basket Order End-to-End Tests', () => {
  let helper: BasketOrderTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new BasketOrderTestHelper(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Wait for app to load by checking if a key element is visible
    await page.waitForSelector('[data-testid="accounts-tab"]', { timeout: 10000 });
  });

  test('Complete Basket Order Flow with Trigger Stop Loss and Limit Chaser', async () => {
    test.setTimeout(120000); // 2 minutes timeout for complete flow

    // Step 1: Setup test account
    await test.step('Setup Agent Account', async () => {
      await helper.setupTestAccount();
    });

    // Step 2: Navigate to basket orders
    await test.step('Navigate to Basket Orders', async () => {
      await helper.navigateToBasketOrders();
    });

    // Step 3: Create advanced basket order
    await test.step('Create Advanced Basket Order', async () => {
      await helper.createAdvancedBasketOrder();
    });

    // Step 4: Verify basket creation
    await test.step('Verify Basket Creation', async () => {
      await helper.verifyBasketCreation();
    });

    // Step 5: Monitor initial execution
    await test.step('Monitor Basket Execution', async () => {
      const logs = await helper.monitorBasketExecution();
      expect(logs.some(log => log.includes('Basket created'))).toBeTruthy();
    });

    // Step 6: Simulate stop loss trigger
    await test.step('Simulate Stop Loss Trigger', async () => {
      await helper.simulateStopLossTrigger();
    });

    // Step 7: Verify limit chaser execution
    await test.step('Verify Limit Chaser Execution', async () => {
      await helper.verifyLimitChaserExecution();
    });
  });

  test('Basket Order Creation Validation', async ({ page }) => {
    await helper.setupTestAccount();
    await helper.navigateToBasketOrders();

    // Test form validation
    await test.step('Test Required Fields Validation', async () => {
      await page.click(SELECTORS.createBasketButton);
      
      // Should show validation errors for empty required fields
      await expect(page.locator(SELECTORS.errorMessage)).toBeVisible();
    });

    // Test invalid values
    await test.step('Test Invalid Values Validation', async () => {
      await page.fill(SELECTORS.quantityInput, '-1');
      await page.fill(SELECTORS.leverageInput, '0');
      await page.click(SELECTORS.createBasketButton);
      
      await expect(page.locator(SELECTORS.errorMessage)).toBeVisible();
    });
  });

  test('Basket Order Management Operations', async ({ page }) => {
    await helper.setupTestAccount();
    await helper.navigateToBasketOrders();
    await helper.createAdvancedBasketOrder();
    await helper.verifyBasketCreation();

    // Test basket cancellation
    await test.step('Cancel Basket Order', async () => {
      await page.click(SELECTORS.manageBasketTab);
      await page.click(SELECTORS.cancelBasketButton);
      
      // Confirm cancellation
      await page.click('button:has-text("Confirm")');
      
      // Verify status changed to cancelled
      const basketStatus = await page.locator(SELECTORS.basketStatus).first();
      await expect(basketStatus).toHaveText('cancelled');
    });
  });

  test('Real-time Market Data Integration', async ({ page }) => {
    await helper.setupTestAccount();
    await helper.navigateToBasketOrders();

    // Test that market prices are loading
    await test.step('Verify Market Data Loading', async () => {
      await page.waitForFunction(
        () => {
          const priceElement = document.querySelector('[data-testid="btc-price"]');
          return priceElement && priceElement.textContent !== 'Loading...';
        },
        { timeout: 30000 }
      );
    });

    // Test auto-fill of entry price
    await test.step('Test Auto-fill Entry Price', async () => {
      await page.selectOption(SELECTORS.symbolSelect, 'BTC');
      
      // Entry price should auto-fill with current market price
      const entryPrice = await page.inputValue(SELECTORS.entryPriceInput);
      expect(parseFloat(entryPrice)).toBeGreaterThan(0);
    });
  });

  test('Error Handling and Recovery', async ({ page }) => {
    await helper.setupTestAccount();
    await helper.navigateToBasketOrders();

    // Test network error handling
    await test.step('Test Network Error Handling', async () => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      await helper.createAdvancedBasketOrder();
      
      // Should show error message
      await expect(page.locator(SELECTORS.errorMessage)).toBeVisible();
    });

    // Test recovery after network restoration
    await test.step('Test Recovery After Network Restoration', async () => {
      // Restore network
      await page.unroute('**/api/**');
      
      // Retry operation
      await page.click(SELECTORS.createBasketButton);
      
      // Should succeed now
      await expect(page.locator(SELECTORS.successMessage)).toBeVisible();
    });
  });

  test('Performance and Load Testing', async ({ page }) => {
    await helper.setupTestAccount();
    await helper.navigateToBasketOrders();

    // Test multiple basket creation performance
    await test.step('Test Multiple Basket Creation', async () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 5; i++) {
        await page.fill(SELECTORS.basketNameInput, `Performance Test Basket ${i}`);
        await helper.createAdvancedBasketOrder();
        await page.waitForSelector(SELECTORS.successMessage);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time (adjust as needed)
      expect(duration).toBeLessThan(30000); // 30 seconds
    });
  });

  test('Browser Compatibility Features', async ({ page, browserName }) => {
    await helper.setupTestAccount();
    await helper.navigateToBasketOrders();

    // Test browser-specific functionality
    await test.step(`Test ${browserName} Compatibility`, async () => {
      await helper.createAdvancedBasketOrder();
      
      // Verify all interactive elements work
      await expect(page.locator(SELECTORS.stopLossCheckbox)).toBeChecked();
      await expect(page.locator(SELECTORS.limitChaserCheckbox)).toBeChecked();
      await expect(page.locator(SELECTORS.candleCloseCheckbox)).toBeChecked();
    });

    // Test local storage persistence
    await test.step('Test Local Storage Persistence', async () => {
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Basket should still be visible after reload
      await page.click(SELECTORS.basketOrderTab);
      await page.click(SELECTORS.manageBasketTab);
      
      const basketItems = await page.locator(SELECTORS.basketItem);
      expect(await basketItems.count()).toBeGreaterThan(0);
    });
  });
});

// Utility function for custom test assertions
export function customExpect(page: Page) {
  return {
    async toHaveConsoleLog(expectedText: string, timeout = 30000) {
      await page.waitForFunction(
        (text) => {
          const logs = Array.from(document.querySelectorAll('[data-testid="console-log"] .log-entry'));
          return logs.some(log => log.textContent?.includes(text));
        },
        expectedText,
        { timeout }
      );
    }
  };
}
