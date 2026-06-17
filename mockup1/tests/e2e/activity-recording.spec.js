import { test, expect } from '@playwright/test';

/**
 * Smoke tests for the parent Home recording flow at /home/recording.
 *
 * These tests are intentionally permissive — they verify the route guards
 * and the presence of the Home recording affordance for parents,
 * without depending on the recording / RevAI / OpenAI pipeline.
 */

test.describe('Home recording – route protection', () => {
    test('/home/recording redirects unauthenticated users back to login', async ({ page }) => {
        await page.goto('/home/recording');

        // ProtectedRoute should bounce us back to the login screen.
        await page.waitForLoadState('networkidle').catch(() => {});
        await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10_000 });
        await expect(page.locator('input[type="password"]')).toBeVisible();
    });
});

test.describe('Home recording – parent view (best-effort)', () => {
    test('parent sees Home recording page', async ({ page }) => {
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
        if (!page.url().includes('/home/recording')) {
            await page.goto('/home/recording');
        }

        await expect(
            page.getByRole('heading', { name: /Home Recording/i })
        ).toBeVisible({ timeout: 10_000 });
    });
});

test.describe('Home recording – admin view (best-effort)', () => {
    test('admin is redirected away from /home/recording', async ({ page }) => {
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

        await page.goto('/home/recording');
        await page.waitForLoadState('networkidle').catch(() => {});

        // Parent-only route — admin should not stay on the recording page.
        await expect(page).not.toHaveURL(/\/home\/recording$/);
    });
});
