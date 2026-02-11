import { test, expect } from '@playwright/test';

test.describe('Child Data Page', () => {
  test.beforeEach(async ({ page }) => {
    const testEmail = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
    const testPassword = process.env.TEST_ADMIN_PASSWORD || 'password123';

    await page.goto('/');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/home|\/data/, { timeout: 10000 });
  });

  test('should display child data page when navigating to a child', async ({ page }) => {
    // Navigate to data page first
    await page.goto('/data');
    await page.waitForLoadState('networkidle');

    // Click on first child link if available
    const childLink = page.locator('a[href*="/data/child/"]').first();
    const linkExists = await childLink.isVisible().catch(() => false);

    if (linkExists) {
      await childLink.click();
      await page.waitForURL(/\/data\/child\/[^/]+/, { timeout: 5000 });
      expect(page.url()).toMatch(/\/data\/child\/[^/]+/);
    } else {
      // Skip if no children in test data
      test.skip();
    }
  });

  test('should show upload recording button for admin/teacher', async ({ page }) => {
    await page.goto('/data');
    await page.waitForLoadState('networkidle');

    const childLink = page.locator('a[href*="/data/child/"]').first();
    const linkExists = await childLink.isVisible().catch(() => false);

    if (linkExists) {
      await childLink.click();
      await page.waitForURL(/\/data\/child\/[^/]+/, { timeout: 5000 });

      // Look for Upload button or recording-related UI
      const uploadButton = page.locator('button:has-text("Upload"), button:has-text("Recording")').first();
      const hasUploadUI = await uploadButton.isVisible().catch(() => false)
        || await page.locator('text=/upload|recording/i').first().isVisible().catch(() => false);

      expect(hasUploadUI).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should open upload modal when upload is clicked', async ({ page }) => {
    await page.goto('/data');
    await page.waitForLoadState('networkidle');

    const childLink = page.locator('a[href*="/data/child/"]').first();
    const linkExists = await childLink.isVisible().catch(() => false);

    if (!linkExists) {
      test.skip();
      return;
    }

    await childLink.click();
    await page.waitForURL(/\/data\/child\/[^/]+/, { timeout: 5000 });

    const uploadBtn = page.locator('button:has-text("Upload")').first();
    const btnVisible = await uploadBtn.isVisible().catch(() => false);

    if (btnVisible) {
      await uploadBtn.click();
      await page.waitForSelector('.modal-open, [role="dialog"], .modal-box', { timeout: 3000 });
      await expect(page.locator('input[type="file"]')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should display assessment scores with category colors when present', async ({ page }) => {
    await page.goto('/data');
    await page.waitForLoadState('networkidle');

    const childLink = page.locator('a[href*="/data/child/"]').first();
    const linkExists = await childLink.isVisible().catch(() => false);

    if (!linkExists) {
      test.skip();
      return;
    }

    await childLink.click();
    await page.waitForURL(/\/data\/child\/[^/]+/, { timeout: 5000 });

    // Check for language development / assessment section
    const hasAssessmentSection = await page.locator('text=/science|social|literature|language/i').first().isVisible().catch(() => false);
    expect(hasAssessmentSection).toBeTruthy();
  });
});
