import { test, expect } from '@playwright/test';

/**
 * E2E tests for parent invitation flow.
 * 
 * Parent Registration Without Login:
 * - Creates an invitation via API (admin auth), then registers as parent in a clean browser
 *   context with NO prior login. Verifies the fix for the "invalid invitation" bug when
 *   parents open the link without being logged in.
 * 
 * Self-Invite:
 * - Admin/teacher sends invitation to their own email, then completes parent registration.
 *   When email fails (common in dev/CI), the link is shown in a dialog - we capture it
 *   and complete registration. When email succeeds, we verify the invite was sent.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const API_BASE = BASE_URL; // Frontend proxies /api to backend
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@example.com';
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'password123';
const TEST_PARENT_NAME = process.env.TEST_PARENT_NAME || 'Test Parent E2E';
const TEST_PARENT_USERNAME = process.env.TEST_PARENT_USERNAME || 'testparent_e2e';

/**
 * Helper: Create a parent invitation via API and return the invitation link.
 * Requires backend running with test DB. When email is not configured (common in dev/CI),
 * the backend returns invitationLink in the response.
 */
async function createInvitationAndGetLink() {
  const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_ADMIN_EMAIL, password: TEST_ADMIN_PASSWORD }),
  });
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginRes.status} - ${await loginRes.text()}`);
  }
  const loginData = await loginRes.json();
  const token = loginData.user || loginData.token; // Backend returns { user: jwt }

  const childrenRes = await fetch(`${API_BASE}/api/children`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!childrenRes.ok) {
    throw new Error(`Fetch children failed: ${childrenRes.status}`);
  }
  const { children } = await childrenRes.json();
  const child = Array.isArray(children) && children.length > 0 ? children[0] : null;
  if (!child) {
    throw new Error('No children in test database');
  }

  const childId = child._id || child.id;
  const inviteEmail = `parent-e2e-${Date.now()}@example.com`;

  const inviteRes = await fetch(`${API_BASE}/api/invitations/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email: inviteEmail, childId }),
  });

  const inviteData = await inviteRes.json();
  const link = inviteData.invitation?.invitationLink || inviteData.invitationLink;
  return { link, inviteEmail, childName: child.name };
}

test.describe('Parent Invitation Flow', () => {
  test('parent registration without login - verify invitation and complete registration', async ({ browser }) => {
    let link;
    let inviteEmail;
    try {
      const result = await createInvitationAndGetLink();
      link = result.link;
      inviteEmail = result.inviteEmail;
    } catch (err) {
      test.skip(true, `Setup failed (backend may not be running or no test data): ${err.message}`);
      return;
    }

    if (!link || !link.includes('token=')) {
      test.skip(true, 'Invitation link not returned (email may have been sent successfully - run with email unconfigured for E2E)');
      return;
    }

    // Use a fresh context with NO authentication - simulates parent opening link in incognito
    const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await context.newPage();

    try {
      await page.goto(link);
      await page.waitForLoadState('networkidle');

      // Should see the registration form, NOT "Invalid Invitation"
      await expect(page.locator('text=Create Parent Account')).toBeVisible({ timeout: 8000 });
      await expect(page.locator('text=Invalid Invitation')).not.toBeVisible();

      // Email should be pre-filled and disabled
      const emailInput = page.locator('input[name="email"]');
      await expect(emailInput).toHaveValue(inviteEmail);

      // Fill the form
      await page.fill('input[name="name"]', TEST_PARENT_NAME);
      await page.fill('input[name="username"]', TEST_PARENT_USERNAME);
      await page.fill('input[name="password"]', 'testpass123');
      await page.fill('input[name="confirmPassword"]', 'testpass123');

      await page.click('button[type="submit"]');

      // Should navigate to child data page or home after successful registration
      await page.waitForURL(/\/(data\/child\/|home)/, { timeout: 10000 });
      expect(page.url()).toMatch(/\/(data\/child\/[^/]+|home)/);
    } finally {
      await context.close();
    }
  });

  test('self-invite: admin sends invitation to own email and completes parent registration', async ({ page, browser }) => {
    // Login as admin
    await page.goto('/');
    await page.fill('input[type="email"]', TEST_ADMIN_EMAIL);
    await page.fill('input[type="password"]', TEST_ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/home|\/data/, { timeout: 10000 });

    // Go to Data page
    await page.goto('/data');
    await page.waitForLoadState('networkidle');

    // Admin needs to select a teacher first if "All teachers" shows no children
    const teacherSelect = page.locator('select').first();
    if (await teacherSelect.isVisible()) {
      const options = await teacherSelect.locator('option').allTextContents();
      const firstTeacher = options.find((o) => o && !o.includes('Loading') && o !== 'All teachers');
      if (firstTeacher) {
        await teacherSelect.selectOption({ label: firstTeacher });
        await page.waitForLoadState('networkidle');
      }
    }

    const inviteButton = page.locator('button:has-text("Invite")').first();
    const inviteVisible = await inviteButton.isVisible().catch(() => false);
    if (!inviteVisible) {
      test.skip(true, 'No children with Invite button (add test data with children)');
      return;
    }

    await inviteButton.click();
    await expect(page.locator('text=Send Parent Invitation')).toBeVisible({ timeout: 3000 });

    // Enter admin's own email (self-invite)
    await page.fill('input[placeholder="parent@example.com"]', TEST_ADMIN_EMAIL);
    await page.click('button:has-text("Send Invitation")');

    let invitationLink = null;

    // When email fails, a dialog appears with the link (after toast). When email succeeds, we get a success toast.
    const dialogPromise = page.waitForEvent('dialog', { timeout: 12000 }).catch(() => null);
    const toastSuccess = page.waitForSelector('text=/Invitation sent successfully/i', { timeout: 6000 }).catch(() => null);
    const result = await Promise.race([
      dialogPromise.then((d) => (d ? { type: 'dialog', dialog: d } : null)),
      toastSuccess.then(() => ({ type: 'toast_success' })),
    ]);

    if (result?.type === 'dialog' && result.dialog) {
      const message = result.dialog.message();
      const match = message.match(/https?:\/\/[^\s]+\/parent\/register\?token=[^\s\n]+/);
      if (match) {
        invitationLink = match[0].trim();
      }
      await result.dialog.accept();
    }

    if (invitationLink) {
      // Complete registration in a fresh context (no admin auth)
      const context = await browser.newContext({ storageState: { cookies: [], origins: [] } });
      const regPage = await context.newPage();

      try {
        await regPage.goto(invitationLink);
        await regPage.waitForLoadState('networkidle');

        await expect(regPage.locator('text=Create Parent Account')).toBeVisible({ timeout: 8000 });
        await expect(regPage.locator('text=Invalid Invitation')).not.toBeVisible();

        // Use unique username to avoid conflicts
        const uniqueUsername = `admin_parent_${Date.now()}`;
        await regPage.fill('input[name="name"]', 'Admin As Parent');
        await regPage.fill('input[name="username"]', uniqueUsername);
        await regPage.fill('input[name="password"]', 'testpass123');
        await regPage.fill('input[name="confirmPassword"]', 'testpass123');

        await regPage.click('button[type="submit"]');
        await regPage.waitForURL(/\/(data\/child\/|home)/, { timeout: 10000 });
        expect(regPage.url()).toMatch(/\/(data\/child\/[^/]+|home)/);
      } finally {
        await context.close();
      }
    } else {
      // Email succeeded - verify we got success feedback
      await expect(page.locator('text=/Invitation sent successfully/i')).toBeVisible({ timeout: 3000 });
    }
  });
});
