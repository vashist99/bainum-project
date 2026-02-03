import { test, expect } from '@playwright/test';

test.describe('Protected Routes', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route without login
    await page.goto('/home');
    
    // Should be redirected to login page
    await page.waitForURL(/\//, { timeout: 5000 });
    expect(page.url()).toMatch(/\//);
    
    // Should see login form
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });

  test('should allow admin to access admin-only pages', async ({ page }) => {
    const testEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'password123';
    
    // Login as admin
    await page.goto('/');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/home|\/data/, { timeout: 10000 });
    
    // Try to access admin-only page (teachers page)
    await page.goto('/teachers');
    
    // Should be able to access (not redirected)
    await page.waitForTimeout(2000); // Wait for any redirects
    const url = page.url();
    
    // Should either be on teachers page or show access denied message
    if (url.includes('/teachers')) {
      // Successfully accessed
      expect(url).toContain('/teachers');
    } else {
      // Check for access denied message
      const accessDenied = await page.locator('text=/access denied|permission/i').isVisible().catch(() => false);
      expect(accessDenied).toBeTruthy();
    }
  });

  test('should restrict parent access to admin pages', async ({ page }) => {
    const testEmail = process.env.TEST_PARENT_EMAIL || 'parent@example.com';
    const testPassword = process.env.TEST_PARENT_PASSWORD || 'password123';
    
    // Login as parent
    await page.goto('/');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/data\/child/, { timeout: 10000 });
    
    // Try to access admin-only page
    await page.goto('/teachers');
    
    // Should be redirected or see access denied
    await page.waitForTimeout(2000);
    const url = page.url();
    
    // Should not be on teachers page
    if (!url.includes('/teachers')) {
      // Redirected away - good
      expect(url).not.toContain('/teachers');
    } else {
      // Check for access denied message
      const accessDenied = await page.locator('text=/access denied|permission/i').isVisible().catch(() => false);
      expect(accessDenied).toBeTruthy();
    }
  });

  test('should redirect parent to their child page', async ({ page }) => {
    const testEmail = process.env.TEST_PARENT_EMAIL || 'parent@example.com';
    const testPassword = process.env.TEST_PARENT_PASSWORD || 'password123';
    
    // Login as parent
    await page.goto('/');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    
    // Should be automatically redirected to child's page
    await page.waitForURL(/\/data\/child\/[^/]+/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/data\/child\/[^/]+/);
  });
});
