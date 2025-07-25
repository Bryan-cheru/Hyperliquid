import { test } from '@playwright/test';

test('test', async ({ page }) => {
  test.setTimeout(240000); // 4 minutes timeout
  await page.goto('http://localhost:5174/');
  await page.getByRole('button', { name: 'Connect Master Account' }).click();
  await page.getByRole('textbox', { name: 'e.g., Main Trading Account' }).click();
  await page.getByRole('textbox', { name: 'e.g., Main Trading Account' }).fill('master');
  await page.getByRole('textbox', { name: '0x...' }).click();
  await page.getByRole('textbox', { name: '0x...' }).click();
  await page.getByRole('textbox', { name: '0x...' }).fill('0x9B7692dBb4b5524353ABE6826CE894Bcc235b7fB');
  await page.getByRole('button', { name: 'Connect Master Account' }).nth(1).click();
  await page.getByTestId('accounts-tab').click();
  await page.getByText('Account 1Not ConnectedN/AN/').click();
  await page.getByRole('textbox', { name: 'Wallet Address (0x...)' }).click();
  await page.getByRole('textbox', { name: 'Private Key (for trading' }).click();
  await page.getByRole('textbox', { name: 'Private Key (for trading' }).fill(' 0x86ac8c28e32b673b6d9d04086bf6dba13161665ea912a8e5a91133ad38debf39');
  await page.getByRole('textbox', { name: 'Wallet Address (0x...)' }).click();
  await page.getByRole('textbox', { name: 'Wallet Address (0x...)' }).fill('0x744b5f069e0e2f38cf625edbb524a8a2d024dad0');
  await page.getByRole('button', { name: 'Connect & Enable Trading' }).click();
  await page.getByRole('article').filter({ hasText: 'Account 1ConnectedBTC-' }).getByLabel('', { exact: true }).check();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.locator('.bg-\\[\\#E5E5E5\\]').first().click();
  await page.getByPlaceholder('Enter price', { exact: true }).click();
  await page.getByPlaceholder('Enter price', { exact: true }).fill('110000');
  await page.locator('.flex.justify-between > .relative.flex').click();
  await page.locator('.relative.flex.w-full.items-center.h-5').click();
  // Skip trigger price and stop price for now - create basic limit order
  // await page.locator('div').filter({ hasText: /^Trigger Price$/ }).getByPlaceholder('Enter Price').click();
  // await page.locator('div').filter({ hasText: /^Trigger Price$/ }).getByPlaceholder('Enter Price').fill('110000');
  // await page.locator('div').filter({ hasText: /^Stop Price$/ }).getByPlaceholder('Enter Price').click();
  // await page.locator('div').filter({ hasText: /^Stop Price$/ }).getByPlaceholder('Enter Price').fill('105000');
  await page.getByRole('button', { name: 'LONG' }).click();
  await page.getByRole('button', { name: 'SHORT' }).click();
});