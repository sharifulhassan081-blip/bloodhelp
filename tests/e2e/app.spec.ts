import { test, expect } from '@playwright/test';

test('search, language, theme and safe sample contacts', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await expect(page.locator('h1')).toContainText('সিলেটে');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await page.getByLabel('Select blood group', { exact: true }).selectOption('A+');
  await page.getByLabel('Select area', { exact: true }).selectOption('Amberkhana');
  await page.getByRole('button', { name: 'Search donors' }).click();
  await expect(page).toHaveURL(/find-donors/);
  await expect(page.getByText('Nusrat J.').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Call', exact: true }).first()).toBeDisabled();
  await page.getByRole('button', { name: 'Profile', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toContainText('fictional demo profile');
});

test('request can be shared with another browser without a backend', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/request-blood');
  await page.getByLabel('Patient name').fill('Test Patient');
  await page.getByLabel('Hospital name').selectOption({ label: 'Mount Adora Hospital' });
  await page.getByLabel('Blood group needed').selectOption('O+');
  await page.getByLabel('Units needed').selectOption('2');
  await page.getByLabel('Contact number').fill('01712345678');
  await page.getByLabel('Area / upazila').selectOption('Akhalia');
  await page.getByLabel(/I understand that sharing/).check();
  await page.getByRole('button', { name: 'Create request' }).click();
  await expect(page.getByText('Your request is ready to share.')).toBeVisible();
  await page.getByRole('button', { name: 'Copy link' }).click();
  const shareUrl = await page.evaluate(() => navigator.clipboard.readText());
  const request = await page.evaluate(() => JSON.parse(localStorage.getItem('bloodhelp-requests-v1') || '[]').find((r: {sample: boolean}) => !r.sample));
  await page.evaluate(() => localStorage.clear());
  await page.goto(shareUrl);
  await expect(page.getByText('A request shared by link is included below.')).toBeVisible();
  await page.locator('article.request-card').filter({ hasText: request.id }).getByRole('button', { name: 'I can donate' }).click();
  await expect(page.getByRole('link', { name: /Call 01712345678/ })).toBeVisible();
});

test('register, toggle status, simulate verification and record a donation', async ({ page }) => {
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Test Donor');
  await page.getByLabel('Phone number').first().fill('01812345678');
  await page.getByLabel('Blood group').first().selectOption('B+');
  await page.getByLabel('Date of birth').fill('1990-05-10');
  await page.getByLabel('Gender').first().selectOption('Other');
  await page.getByLabel('Area / upazila').selectOption('Zindabazar');
  await page.getByLabel('Weight (kg)').fill('60');
  await page.getByLabel('Any diseases or health conditions?').selectOption('no');
  await page.getByLabel(/I agree to share/).check();
  await page.getByRole('button', { name: 'Create donor card' }).click();
  await expect(page.getByText('Donor ID card')).toBeVisible();
  await page.getByRole('link', { name: 'Go to dashboard' }).click();
  await page.getByRole('switch', { name: 'I am available to donate now' }).click();
  await page.reload();
  await expect(page.locator('.availability-card')).toContainText('Not available right now');
  await page.getByRole('button', { name: 'Simulate phone verification' }).click();
  await page.getByLabel('Demo code').fill('123456');
  await page.getByRole('button', { name: 'Complete demo verification' }).click();
  await expect(page.getByText('Demo verification only · no SMS sent')).toBeVisible();
  await page.getByRole('button', { name: 'Add donation' }).click();
  await page.getByLabel('Donation date').fill(new Date().toISOString().slice(0, 10));
  await page.getByLabel('Hospital or location').fill('Test Hospital');
  await page.getByRole('button', { name: 'Save donation' }).click();
  await expect(page.getByText('Test Hospital')).toBeVisible();
  await expect(page.getByRole('switch', { name: 'I am available to donate now' })).toBeDisabled();
});

test('compatibility, camp RSVP and mobile menu', async ({ page }) => {
  await page.goto('/resources');
  await page.getByLabel('Your blood group').selectOption('O-');
  await expect(page.locator('.compatibility-results > div').first().locator('.blood-chips span')).toHaveCount(8);
  await expect(page.locator('.compatibility-results > div').last().locator('.blood-chips span')).toHaveCount(1);
  await page.getByLabel('Your blood group').selectOption('AB+');
  await expect(page.locator('.compatibility-results > div').last().locator('.blood-chips span')).toHaveCount(8);
  await page.getByRole('button', { name: 'Demo RSVP' }).first().click();
  await expect(page.getByRole('button', { name: 'Saved' }).first()).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole('button', { name: 'Open menu' }).click();
  await expect(page.getByRole('navigation', { name: 'Mobile navigation' }).getByRole('link', { name: 'Dashboard' })).toBeVisible();
});

test('all pages fit narrow mobile screens in English and Bangla', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  const routes = ['/', '/find-donors', '/live-requests', '/request-blood', '/register', '/dashboard', '/resources'];
  for (const language of ['en', 'bn']) {
    await page.goto('/');
    if (language === 'bn') await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `${language}: ${route}`).toBe(320);
    }
  }
});
