// Test utilities for basket order end-to-end testing
import { Page, expect } from '@playwright/test';

export interface MockApiResponse {
  endpoint: string;
  method: string;
  response: any;
  delay?: number;
}

export class MockApiHelper {
  constructor(private page: Page) {}

  async mockHyperLiquidAPI() {
    // Mock market data API
    await this.page.route('**/info', async (route) => {
      const url = new URL(route.request().url());
      const requestBody = await route.request().postDataJSON();

      if (requestBody?.type === 'allMids') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            BTC: '55000.0',
            ETH: '3200.0',
            SOL: '145.0'
          })
        });
      } else if (requestBody?.type === 'openOrders') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      } else if (requestBody?.type === 'userState') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            assetPositions: [],
            crossMaintenanceMarginUsed: '0',
            crossMarginSummary: {
              accountValue: '10000.0',
              totalNtlPos: '0',
              totalRawUsd: '10000.0'
            }
          })
        });
      } else {
        await route.continue();
      }
    });

    // Mock exchange API for orders
    await this.page.route('**/exchange', async (route) => {
      const requestBody = await route.request().postDataJSON();
      
      if (requestBody?.action?.type === 'order') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            response: {
              type: 'order',
              data: {
                statuses: [{
                  filled: { totalSz: '0', avgPx: null },
                  order: {
                    order: {
                      asset: 0,
                      isBuy: true,
                      limitPx: '95000',
                      origSz: '0.001',
                      reduceOnly: false,
                      timestamp: Date.now()
                    },
                    orderType: 'Limit'
                  },
                  status: 'open',
                  statusTimestamp: Date.now()
                }]
              }
            }
          })
        });
      } else {
        await route.continue();
      }
    });
  }

  async simulateMarketPriceChange(symbol: string, newPrice: number) {
    await this.page.route('**/info', async (route) => {
      const requestBody = await route.request().postDataJSON();
      
      if (requestBody?.type === 'allMids') {
        const mockData: Record<string, string> = {
          BTC: '95000.0',
          ETH: '3200.0',
          SOL: '145.0'
        };
        mockData[symbol] = newPrice.toString();
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockData)
        });
      } else {
        await route.continue();
      }
    });
  }

  async simulateCandleData(symbol: string, timeframe: string, closePrice: number) {
    await this.page.route('**/info', async (route) => {
      const requestBody = await route.request().postDataJSON();
      
      if (requestBody?.type === 'candleSnapshot') {
        const currentTime = Date.now();
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              T: currentTime - 900000, // 15 minutes ago
              c: closePrice.toString(),
              h: (closePrice + 100).toString(),
              l: (closePrice - 100).toString(),
              n: 1000,
              o: (closePrice + 50).toString(),
              t: currentTime - 900000,
              v: '1000.0'
            }
          ])
        });
      } else {
        await route.continue();
      }
    });
  }
}

export class TestDataHelper {
  static generateRandomWallet() {
    const randomHex = () => Math.floor(Math.random() * 16).toString(16);
    const address = '0x' + Array(40).fill(0).map(() => randomHex()).join('');
    const privateKey = '0x' + Array(64).fill(0).map(() => randomHex()).join('');
    
    return { address, privateKey };
  }

  static generateBasketOrderConfig(overrides?: Partial<any>) {
    return {
      name: `Test Basket ${Date.now()}`,
      symbol: 'BTC',
      side: 'buy',
      quantity: 0.001,
      leverage: 10,
      entryPrice: 95000,
      stopLossPrice: 93000,
      takeProfitPrice: 98000,
      limitChaserDistance: 0.01,
      timeframe: '15m',
      ...overrides
    };
  }
}

export class ConsoleLogHelper {
  private logs: string[] = [];

  constructor(private page: Page) {
    this.page.on('console', msg => {
      this.logs.push(`${msg.type()}: ${msg.text()}`);
    });
  }

  async waitForLog(expectedText: string, timeout = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (this.logs.some(log => log.includes(expectedText))) {
        return true;
      }
      await this.page.waitForTimeout(100);
    }
    
    return false;
  }

  getLogsContaining(text: string): string[] {
    return this.logs.filter(log => log.includes(text));
  }

  getAllLogs(): string[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export class PerformanceHelper {
  private metrics: Record<string, number> = {};

  startTimer(name: string): void {
    this.metrics[`${name}_start`] = Date.now();
  }

  endTimer(name: string): number {
    const startTime = this.metrics[`${name}_start`];
    if (!startTime) {
      throw new Error(`Timer '${name}' was not started`);
    }
    
    const duration = Date.now() - startTime;
    this.metrics[`${name}_duration`] = duration;
    return duration;
  }

  getDuration(name: string): number {
    return this.metrics[`${name}_duration`] || 0;
  }

  getAllMetrics(): Record<string, number> {
    return { ...this.metrics };
  }
}

export async function waitForElement(page: Page, selector: string, timeout = 30000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch {
    return false;
  }
}

export async function fillFormField(page: Page, selector: string, value: string) {
  await page.waitForSelector(selector);
  await page.fill(selector, value);
}

export async function selectOption(page: Page, selector: string, value: string) {
  await page.waitForSelector(selector);
  await page.selectOption(selector, value);
}

export async function checkCheckbox(page: Page, selector: string, checked = true) {
  await page.waitForSelector(selector);
  if (checked) {
    await page.check(selector);
  } else {
    await page.uncheck(selector);
  }
}

export async function takeScreenshotOnFailure(page: Page, testName: string) {
  const screenshot = await page.screenshot({ fullPage: true });
  const filename = `test-failure-${testName}-${Date.now()}.png`;
  // In a real implementation, you would save this to a screenshots directory
  console.log(`Screenshot taken: ${filename}`);
  return screenshot;
}
