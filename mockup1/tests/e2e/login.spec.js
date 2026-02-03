import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message (could be toast notification or inline error)
    // Check for common error indicators
    const errorVisible = await Promise.race([
      page.waitForSelector('text=/invalid|error|incorrect/i', { timeout: 5000 }).then(() => true),
      page.waitForSelector('.toast', { timeout: 5000 }).then(() => true),
    ]).catch(() => false);
    
    expect(errorVisible).toBeTruthy();
  });

  test('should successfully login with valid credentials', async ({ page }) => {
    // Note: This test requires valid test credentials
    // You may need to set up test users or use environment variables
    const testEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'password123';
    
    // Fill in credentials
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for navigation to home page or dashboard
    await page.waitForURL(/\/home|\/data/, { timeout: 10000 });
    
    // Verify we're logged in (check for user-specific content)
    const isLoggedIn = await Promise.race([
      page.waitForSelector('text=/welcome|home|dashboard/i', { timeout: 5000 }).then(() => true),
      page.url().includes('/home').then(() => true),
    ]).catch(() => false);
    
    expect(isLoggedIn).toBeTruthy();
  });

  test('should persist login state on page reload', async ({ page }) => {
    const testEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'password123';
    
    // Login
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/home|\/data/, { timeout: 10000 });
    
    // Reload page
    await page.reload();
    
    // Should still be logged in (not redirected to login)
    expect(page.url()).not.toContain('/');
    expect(page.url()).toMatch(/\/home|\/data/);
  });
});
