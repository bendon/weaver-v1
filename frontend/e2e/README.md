# E2E Testing with Playwright

This directory contains end-to-end tests for the TravelWeaver frontend application using Playwright.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Configuration

Tests are configured in `playwright.config.ts`. The default base URL is `http://localhost:3000`.

You can override the base URL with an environment variable:
```bash
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000 npm run test:e2e
```

## Test Credentials

Set test credentials in environment variables or `.env.local`:
```bash
TEST_EMAIL=test@example.com
TEST_PASSWORD=testpassword123
TEST_ORG_NAME=Test Organization
```

## Running Tests

### Run all tests
```bash
npm run test:e2e
```

### Run tests in UI mode (interactive)
```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:e2e:headed
```

### Run tests in debug mode
```bash
npm run test:e2e:debug
```

### View test report
```bash
npm run test:e2e:report
```

### Run specific test file
```bash
npx playwright test e2e/dmc-booking-flow.spec.ts
```

### Run tests in specific browser
```bash
npx playwright test --project=chromium
```

## Test Files

- **`dmc-booking-flow.spec.ts`** - Complete DMC booking flow from login to booking creation
- **`auth-flow.spec.ts`** - Authentication tests (login, register, session)
- **`navigation.spec.ts`** - Navigation and link tests

## Test Structure

Each test file uses Playwright's test framework with:
- `test.describe()` - Test suite grouping
- `test.beforeEach()` - Setup before each test
- `test.step()` - Test step organization
- `expect()` - Assertions

## Writing New Tests

1. Create a new `.spec.ts` file in the `e2e/` directory
2. Import Playwright test utilities:
```typescript
import { test, expect } from '@playwright/test';
```

3. Write your test:
```typescript
test.describe('Feature Name', () => {
  test('test description', async ({ page }) => {
    await page.goto('/');
    // Your test code here
  });
});
```

## Best Practices

1. **Use test steps** - Break complex tests into steps using `test.step()`
2. **Wait for elements** - Always wait for elements to be visible before interacting
3. **Use data-testid** - Consider adding `data-testid` attributes to key elements for more reliable selectors
4. **Clean up** - Tests should clean up after themselves (delete test data, etc.)
5. **Isolate tests** - Each test should be independent and not rely on other tests

## Debugging

### View test execution
```bash
npm run test:e2e:headed
```

### Pause execution
Add `await page.pause()` in your test code

### Screenshots and videos
Failed tests automatically capture screenshots and videos (configured in `playwright.config.ts`)

### Trace viewer
```bash
npx playwright show-trace trace.zip
```

## CI/CD Integration

Tests can be run in CI/CD pipelines. The config includes:
- Retry logic for flaky tests
- HTML report generation
- JSON results output

## Known Issues

- Tests require the backend API to be running
- Some tests may need test data to be set up first
- Mobile tests may need adjustment based on actual mobile UI

