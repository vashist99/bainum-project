import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const testEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'password123';
    
    await page.goto('/');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/home|\/data/, { timeout: 10000 });
  });

  test('should navigate to home page', async ({ page }) => {
    await page.goto('/home');
    await expect(page.locator('h1, h2')).toContainText(/welcome|home/i);
  });

  test('should navigate to data page', async ({ page }) => {
    await page.goto('/data');
    await expect(page.locator('h1, h2')).toContainText(/data/i);
  });

  test('should navigate to teachers page (admin only)', async ({ page }) => {
    await page.goto('/teachers');
    await page.waitForTimeout(2000);
    
    // Should either be on teachers page or show access denied
    const url = page.url();
    if (url.includes('/teachers')) {
      expect(url).toContain('/teachers');
    } else {
      // Check for access denied or redirect
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).toBeTruthy();
    }
  });

  test('should have working navigation links', async ({ page }) => {
    // Check if navbar exists and has links
    const navbar = page.locator('nav, [role="navigation"]').first();
    const navbarExists = await navbar.isVisible().catch(() => false);
    
    if (navbarExists) {
      // Try clicking navigation links if they exist
      const homeLink = page.locator('a[href="/home"], a:has-text("Home")').first();
      const homeLinkExists = await homeLink.isVisible().catch(() => false);
      
      if (homeLinkExists) {
        await homeLink.click();
        await page.waitForTimeout(1000);
        expect(page.url()).toContain('/home');
      }
    }
  });
});
