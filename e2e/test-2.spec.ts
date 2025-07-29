import { test, expect } from '@playwright/test';

test.describe('Three-Tier Exit Strategy Test', () => {
  
  test('should test refined exit strategy with stop trigger, candle close, and stop price scenarios', async ({ page }) => {
    // Set longer timeout for this test - 5 minutes
    test.setTimeout(300000);
    
    await page.goto('http://localhost:5174/');
  
  // Add a small delay for video recording
  await page.waitForTimeout(1000);
  
  await page.getByRole('button', { name: 'Connect Master Account' }).click();
  await page.waitForTimeout(500);
  
  await page.getByRole('textbox', { name: 'e.g., Main Trading Account' }).click();
  await page.waitForTimeout(300);
  
  await page.getByRole('textbox', { name: 'e.g., Main Trading Account' }).fill('master');
  await page.waitForTimeout(300);
  
  await page.getByRole('textbox', { name: '0x...' }).click();
  await page.waitForTimeout(300);
  
  await page.getByRole('textbox', { name: '0x...' }).fill('0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB');
  await page.waitForTimeout(300);
  
  await page.getByRole('button', { name: 'Connect Master Account' }).nth(1).click();
  await page.waitForTimeout(1000);
  
  await page.getByTestId('accounts-tab').click();
  await page.waitForTimeout(500);
  
  await page.getByRole('heading', { name: 'Account 1', exact: true }).click();
  await page.waitForTimeout(500);
  await page.getByRole('textbox', { name: 'Wallet Address (0x...)' }).click();
  await page.waitForTimeout(300);
  
  await page.getByRole('textbox', { name: 'Wallet Address (0x...)' }).click();
  await page.waitForTimeout(300);
  
  await page.getByRole('textbox', { name: 'Wallet Address (0x...)' }).fill('0xfa65c3158866506f62c43c27ce6316e97e34257d');
  await page.waitForTimeout(300);
  
  await page.getByRole('textbox', { name: 'Wallet Address (0x...)' }).click();
  await page.waitForTimeout(300);
  
  await page.getByRole('textbox', { name: 'Wallet Address (0x...)' }).click();
  await page.waitForTimeout(300);
  
  await page.getByRole('textbox', { name: 'Wallet Address (0x...)' }).click();
  await page.waitForTimeout(300);
  
  await page.getByText('Account 2Not Connected').click();
  await page.waitForTimeout(500);
  
  await page.getByRole('textbox', { name: 'Wallet Address (0x...)' }).click();
  await page.waitForTimeout(300);
  
  await page.getByText('Account 1Not ConnectedN/AN/').click();
  await page.waitForTimeout(500);
  
  await page.getByRole('textbox', { name: 'Private Key (for trading' }).click();
  await page.waitForTimeout(300);
  
  await page.getByRole('textbox', { name: 'Private Key (for trading' }).fill('0x8f782c2fe26d9a3bee74e065eadc7fb90bbcd0b4826af35eebc3500f82ee1fc9');
  await page.waitForTimeout(500);
  
  await page.getByRole('button', { name: 'Connect & Enable Trading' }).click();
  await page.waitForTimeout(1000);
  
  await page.getByRole('article').filter({ hasText: 'Account 1ConnectedBTC-' }).getByLabel('', { exact: true }).check();
  await page.waitForTimeout(500);
  await page.getByText('Account 2Not Connected').click();
  await page.getByRole('article').filter({ hasText: 'Account 2Not ConnectedN/AN/' }).getByPlaceholder('Wallet Address (0x...)').click();
  await page.getByRole('article').filter({ hasText: 'Account 2Not ConnectedN/AN/' }).getByPlaceholder('Wallet Address (0x...)').click();
  await page.getByRole('article').filter({ hasText: 'Account 2Not ConnectedN/AN/' }).getByPlaceholder('Wallet Address (0x...)').fill('0x744b5f069e0e2f38cf625edbb524a8a2d024dad0');
  await page.getByRole('article').filter({ hasText: 'Account 2Not ConnectedN/AN/' }).getByPlaceholder('Private Key (for trading').click();
  await page.getByRole('article').filter({ hasText: 'Account 2Not ConnectedN/AN/' }).getByPlaceholder('Private Key (for trading').fill('0x86ac8c28e32b673b6d9d04086bf6dba13161665ea912a8e5a91133ad38debf39');
  await page.getByRole('button', { name: 'Connect & Enable Trading' }).click();
  await page.getByRole('article').filter({ hasText: 'Account 2ConnectedBTC-' }).getByLabel('', { exact: true }).check();
  await page.getByTestId('account-name-input').click();
  await page.getByTestId('account-name-input').fill('julinozo');
  await page.getByTestId('add-agent-button').click();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByTestId('accounts-tab').click();
  await page.getByRole('article').filter({ hasText: 'Account 1ACTIVEBTC-USDNo' }).getByLabel('', { exact: true }).check();
  await page.locator('div').filter({ hasText: /^ACTIVE$/ }).nth(2).click();
  await page.getByRole('article').filter({ hasText: 'Account 2ACTIVEBTC-USDNo' }).getByLabel('', { exact: true }).check();
  await page.getByRole('article').filter({ hasText: 'Account 2ACTIVEBTC-USDNo' }).getByLabel('', { exact: true }).uncheck();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.locator('.relative.flex').first().click();
  await page.locator('.placeholder\\:text-\\[rgba\\(255\\,255\\,255\\,0\\.60\\)\\]').first().click();
  await page.locator('.placeholder\\:text-\\[rgba\\(255\\,255\\,255\\,0\\.60\\)\\]').first().fill('10');
  await page.locator('.flex-grow.placeholder\\:text-\\[rgba\\(255\\,255\\,255\\,0\\.60\\)\\]').first().click();
  await page.locator('.flex-grow.placeholder\\:text-\\[rgba\\(255\\,255\\,255\\,0\\.60\\)\\]').first().fill('43');
  await page.locator('.inputLeft').first().click();
  await page.locator('.inputLeft > .relative > .cursor-pointer').first().check();
  await page.getByPlaceholder('Enter price', { exact: true }).click();
  await page.getByPlaceholder('Enter price', { exact: true }).fill('112045');
  await page.locator('.flex.justify-between > .relative.flex').click();
  await page.locator('.relative.flex.w-full.items-center.h-5').click();
  await page.locator('div').filter({ hasText: /^Trigger Price$/ }).getByPlaceholder('Enter Price').click();
  await page.locator('div').filter({ hasText: /^Trigger Price$/ }).getByPlaceholder('Enter Price').fill('46000');
  await page.locator('div').filter({ hasText: /^Stop Price$/ }).getByPlaceholder('Enter Price').click();
  await page.locator('div').filter({ hasText: /^Trigger Price$/ }).getByPlaceholder('Enter Price').click();
  await page.locator('div').filter({ hasText: /^Trigger Price$/ }).getByPlaceholder('Enter Price').fill('12000');
  await page.locator('div').filter({ hasText: /^Stop Price$/ }).getByPlaceholder('Enter Price').click();
  await page.locator('div').filter({ hasText: /^Stop Price$/ }).getByPlaceholder('Enter Price').fill('1000');
  await page.locator('div').filter({ hasText: /^Order Split$/ }).getByLabel('').check();
  await page.locator('div:nth-child(11) > .relative.flex > .bg-\\[\\#E5E5E5\\]').click();
  await page.locator('.flex.gap-3.items-center.-mb-2 > .relative > .cursor-pointer').first().check();
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  await page.getByRole('combobox').selectOption('250ms');
  // await page.getByPlaceholder('Update Interval').selectOption('250ms');
  await page.getByRole('combobox').click();
  await page.getByRole('combobox').selectOption('1000ms');
  // await page.getByPlaceholder('Update Interval').selectOption('1000ms');
  await page.getByPlaceholder('Update Interval').click();
  await page.getByPlaceholder('Update Interval').fill('');
  await page.getByPlaceholder('Max Chases').click();
  await page.getByPlaceholder('Max Chases').fill('102');
  await page.locator('div').filter({ hasText: /^Candle Close Trigger$/ }).click();
  await page.locator('div').filter({ hasText: /^Candle Close Trigger$/ }).getByRole('checkbox').uncheck();
  await page.locator('div').filter({ hasText: /^Candle Close Trigger$/ }).getByRole('checkbox').check();
  await page.locator('div').filter({ hasText: /^Long Price Limit$/ }).getByPlaceholder('Enter Price').click();
  await page.locator('div').filter({ hasText: /^Long Price Limit$/ }).getByPlaceholder('Enter Price').fill('116348.77');
  await page.locator('div').filter({ hasText: /^Short Price Limit$/ }).getByPlaceholder('Enter Price').click();
  await page.locator('div').filter({ hasText: /^Short Price Limit$/ }).getByPlaceholder('Enter Price').fill('113297.23');
  await page.locator('.flex-1 > .relative.flex > .bg-\\[\\#E5E5E5\\]').click();
  await page.locator('div:nth-child(14) > .flex.flex-col > .flex.gap-3 > .relative > .cursor-pointer').check();
  await page.locator('div').filter({ hasText: /^Position Size \(%\)$/ }).getByRole('spinbutton').click();
  await page.locator('div').filter({ hasText: /^Position Size \(%\)$/ }).getByRole('spinbutton').fill('5');
  await page.locator('div').filter({ hasText: /^Position Size Slider10%50%100%$/ }).getByRole('slider').fill('0.5');
  await page.locator('div').filter({ hasText: /^Max Position Size \(USD\)$/ }).getByRole('spinbutton').click();
  await page.locator('div').filter({ hasText: /^Max Position Size \(USD\)$/ }).getByRole('spinbutton').fill('10200');
  await page.getByRole('button', { name: 'SHORT' }).click();
});