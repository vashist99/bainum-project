import { test, expect } from '@playwright/test';

/**
 * Smoke tests for the "Record Activity" flow on /home.
 *
 * These tests are intentionally permissive — they verify the route guards
 * and the presence of the Record Activity affordance for the relevant roles,
 * without depending on the recording / RevAI / OpenAI pipeline.
 */

test.describe('Record Activity – route protection', () => {
    test('/home redirects unauthenticated users back to login', async ({ page }) => {
        await page.goto('/home');

        // ProtectedRoute should bounce us back to the login screen.
        await page.waitForLoadState('networkidle').catch(() => {});
        await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });
});

test.describe('Record Activity – teacher view (best-effort)', () => {
    test('teacher sees the Record Activity card on /home', async ({ page }) => {
        const email = process.env.TEST_TEACHER_EMAIL;
        const password = process.env.TEST_TEACHER_PASSWORD;
        if (!email || !password) {
            test.skip();
            return;
        }

        await page.goto('/');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/home|\/profile/, { timeout: 15_000 });

        if (!page.url().includes('/home')) {
            await page.goto('/home');
        }

        await expect(
            page.getByRole('heading', { name: /Record Activity/i })
        ).toBeVisible({ timeout: 10_000 });
    });
});

test.describe('Record Activity – parent view (best-effort)', () => {
    test('parent lands on /home and sees the Record Activity card', async ({ page }) => {
        const email = process.env.TEST_PARENT_EMAIL;
        const password = process.env.TEST_PARENT_PASSWORD;
        if (!email || !password) {
            test.skip();
            return;
        }

        await page.goto('/');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');

        // Parents now stay on /home (skipParentHomeRedirect).
        await page.waitForURL(/\/home|\/data/, { timeout: 15_000 });
        if (!page.url().includes('/home')) {
            await page.goto('/home');
        }

        await expect(
            page.getByRole('heading', { name: /Record Activity/i })
        ).toBeVisible({ timeout: 10_000 });
    });
});

test.describe('Record Activity – admin view (best-effort)', () => {
    test('admin does NOT see the Record Activity card on /home', async ({ page }) => {
        const email = process.env.TEST_ADMIN_EMAIL;
        const password = process.env.TEST_ADMIN_PASSWORD;
        if (!email || !password) {
            test.skip();
            return;
        }

        await page.goto('/');
        await page.fill('input[type="email"]', email);
        await page.fill('input[type="password"]', password);
        await page.click('button[type="submit"]');
        await page.waitForURL(/\/home|\/data/, { timeout: 15_000 });

        if (!page.url().includes('/home')) {
            await page.goto('/home');
        }

        // Admins should still see the classroom upload card, but NOT Record Activity.
        await expect(
            page.getByRole('heading', { name: /Upload Classroom Recording/i })
        ).toBeVisible({ timeout: 10_000 });

        await expect(
            page.getByRole('heading', { name: /Record Activity/i })
        ).toHaveCount(0);
    });
});
