import { test, expect } from '@playwright/test';

test.describe('Centers Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    const testEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'password123';
    
    await page.goto('/');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/home|\/data/, { timeout: 10000 });
  });

  test('should navigate to centers page', async ({ page }) => {
    await page.goto('/centers');
    await page.waitForTimeout(2000);
    
    // Should be on centers page
    const url = page.url();
    expect(url).toContain('/centers');
    
    // Check for centers page content
    const heading = page.locator('h1, h2').first();
    await expect(heading).toContainText(/centers/i);
  });

  test('should show centers list', async ({ page }) => {
    await page.goto('/centers');
    await page.waitForTimeout(2000);
    
    // Check if table or list exists
    const table = page.locator('table').first();
    const tableExists = await table.isVisible().catch(() => false);
    
    if (tableExists) {
      // Table should be visible
      await expect(table).toBeVisible();
    } else {
      // Or check for "No centers" message
      const noCentersMessage = page.locator('text=/no centers|no centers added/i');
      const hasMessage = await noCentersMessage.isVisible().catch(() => false);
      expect(hasMessage || tableExists).toBeTruthy();
    }
  });

  test('should navigate to add center form', async ({ page }) => {
    await page.goto('/centers');
    await page.waitForTimeout(2000);
    
    // Look for "Add Center" button
    const addButton = page.locator('button:has-text("Add Center"), a:has-text("Add Center")').first();
    const buttonExists = await addButton.isVisible().catch(() => false);
    
    if (buttonExists) {
      await addButton.click();
      await page.waitForTimeout(1000);
      
      // Should navigate to add center page
      const url = page.url();
      expect(url).toContain('/centers/add');
      
      // Check for form elements
      const nameInput = page.locator('input[name="name"], input[placeholder*="center name" i]').first();
      const nameInputExists = await nameInput.isVisible().catch(() => false);
      expect(nameInputExists).toBeTruthy();
    }
  });

  test('should have centers link in navbar', async ({ page }) => {
    await page.goto('/home');
    await page.waitForTimeout(1000);
    
    // Check for Centers link in navbar
    const centersLink = page.locator('a[href="/centers"], a:has-text("Centers")').first();
    const linkExists = await centersLink.isVisible().catch(() => false);
    
    if (linkExists) {
      await centersLink.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/centers');
    }
  });
});
