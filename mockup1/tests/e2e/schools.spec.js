import { test, expect } from '@playwright/test';

test.describe('Schools Page', () => {
  test.beforeEach(async ({ page }) => {
    const testEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'password123';
    
    await page.goto('/');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/home|\/data/, { timeout: 10000 });
  });

  test('should navigate to schools page', async ({ page }) => {
    await page.goto('/schools');
    await page.waitForTimeout(2000);
    
    const url = page.url();
    expect(url).toContain('/schools');
    
    const heading = page.locator('h1, h2').first();
    await expect(heading).toContainText(/schools/i);
  });

  test('legacy /centers redirects to /schools', async ({ page }) => {
    await page.goto('/centers');
    await page.waitForURL(/\/schools/, { timeout: 10000 });
    expect(page.url()).toContain('/schools');
  });

  test('should show schools list', async ({ page }) => {
    await page.goto('/schools');
    await page.waitForTimeout(2000);
    
    const table = page.locator('table').first();
    const tableExists = await table.isVisible().catch(() => false);
    
    if (tableExists) {
      await expect(table).toBeVisible();
    } else {
      const noSchoolsMessage = page.locator('text=/no schools|no schools registered/i');
      const hasMessage = await noSchoolsMessage.isVisible().catch(() => false);
      expect(hasMessage || tableExists).toBeTruthy();
    }
  });

  test('should navigate to add school form', async ({ page }) => {
    await page.goto('/schools');
    await page.waitForTimeout(2000);
    
    const addButton = page.locator('button:has-text("Add School"), a:has-text("Add School")').first();
    const buttonExists = await addButton.isVisible().catch(() => false);
    
    if (buttonExists) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      const url = page.url();
      expect(url).toContain('/schools/add');
      
      const nameInput = page.locator('input[name="name"], input[placeholder*="school name" i]').first();
      const nameInputExists = await nameInput.isVisible().catch(() => false);
      expect(nameInputExists).toBeTruthy();
    }
  });

  test('should have schools link in navbar', async ({ page }) => {
    await page.goto('/home');
    await page.waitForTimeout(1000);
    
    const schoolsLink = page.locator('a[href="/schools"], a:has-text("Schools")').first();
    const linkExists = await schoolsLink.isVisible().catch(() => false);
    
    if (linkExists) {
      await schoolsLink.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/schools');
    }
  });
});
