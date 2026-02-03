# Playwright Test Suite

This directory contains automated end-to-end (E2E) and API tests for the Bainum Project frontend.

## Test Structure

```
tests/
├── e2e/              # End-to-end browser tests
│   ├── login.spec.js
│   ├── protected-routes.spec.js
│   └── navigation.spec.js
└── api/              # API endpoint tests
    └── auth-api.spec.js
```

## Running Tests

### Install Dependencies
```bash
npm install
npx playwright install
```

### Run All Tests
```bash
npm test
```

### Run E2E Tests Only
```bash
npm run test:e2e
```

### Run Tests in UI Mode
```bash
npm run test:ui
```

### Run Tests in Headed Mode (see browser)
```bash
npm run test:headed
```

## Test Configuration

Tests are configured in `playwright.config.js`. Key settings:

- **Base URL**: `http://localhost:5173` (local) or set via `TEST_URL` env variable
- **Browsers**: Chromium, Firefox, WebKit
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: Taken on failure
- **Videos**: Recorded on failure

## Environment Variables

Set these environment variables for tests that require authentication:

```bash
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=password123
TEST_PARENT_EMAIL=parent@example.com
TEST_PARENT_PASSWORD=password123
TEST_URL=https://bainum-frontend-prod.vercel.app
```

## Test Coverage

### E2E Tests
- ✅ Login flow (success and failure)
- ✅ Protected route access control
- ✅ Navigation between pages
- ✅ Role-based access (admin, teacher, parent)

### API Tests
- ✅ Authentication endpoints
- ✅ Protected endpoint access
- ✅ Token validation

## CI/CD Integration

Tests run automatically in GitHub Actions on:
- Every push to `main` or `develop`
- Every pull request

Test results are uploaded as artifacts and can be viewed in the Actions tab.

## Writing New Tests

Example test structure:

```javascript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // Your test code here
    await expect(page.locator('selector')).toBeVisible();
  });
});
```

## Troubleshooting

### Tests fail locally
- Make sure the dev server is running: `npm run dev`
- Check that test credentials are correct
- Verify API endpoints are accessible

### Tests fail in CI
- Check GitHub Actions logs
- Verify environment variables are set
- Ensure test URLs are correct
