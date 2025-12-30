# Frontend Testing Guide

## Overview

This document provides information about testing the TravelWeaver frontend application.

## Test Types

### 1. End-to-End (E2E) Tests

E2E tests are located in the `e2e/` directory and use Playwright.

**Test Coverage:**
- ✅ Authentication flow (login, register, session)
- ✅ DMC booking flow (complete flow from login to booking creation)
- ✅ Navigation and links
- ✅ Form validation
- ✅ User interactions

**Run E2E tests:**
```bash
npm run test:e2e
```

### 2. Component Tests (Planned)

Component tests using React Testing Library (to be implemented).

### 3. Unit Tests (Planned)

Unit tests for utilities and helpers (to be implemented).

## Running Tests

### Prerequisites

1. **Backend API must be running** - Tests interact with the real API
2. **Test credentials** - Set in environment variables:
   ```bash
   TEST_EMAIL=test@example.com
   TEST_PASSWORD=testpassword123
   TEST_ORG_NAME=Test Organization
   ```

### E2E Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## Test Structure

```
frontend/
├── e2e/
│   ├── dmc-booking-flow.spec.ts    # Complete booking flow
│   ├── auth-flow.spec.ts           # Authentication tests
│   ├── navigation.spec.ts          # Navigation tests
│   └── README.md                    # E2E test documentation
├── playwright.config.ts            # Playwright configuration
└── TESTING.md                      # This file
```

## Test Scenarios

### DMC Booking Flow

The primary test scenario covers:
1. Login to application
2. Navigate to create booking
3. Fill trip details (title, dates, travelers)
4. Add travelers (create new or select existing)
5. Optionally add flights (can skip)
6. Review booking details
7. Create booking
8. Verify booking was created
9. View booking detail page

### Authentication Flow

Tests cover:
- Login with valid credentials
- Login with invalid credentials
- Register new account
- Session persistence
- Unauthenticated access protection

### Navigation Flow

Tests verify:
- All sidebar links work
- Dashboard links work
- Booking detail page tabs
- Mobile navigation
- Breadcrumb navigation

## Writing New Tests

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Login or navigate
    await page.goto('/login');
    // ... login code
  });

  test('test description', async ({ page }) => {
    test.step('Step 1: Do something', async () => {
      await page.goto('/some-page');
      await expect(page.locator('h1')).toBeVisible();
    });

    test.step('Step 2: Do something else', async () => {
      await page.click('button');
      await expect(page).toHaveURL(/\/expected-url/);
    });
  });
});
```

## Best Practices

1. **Use test steps** - Break complex tests into logical steps
2. **Wait for elements** - Always wait for elements before interacting
3. **Use data-testid** - Add `data-testid` attributes for reliable selectors
4. **Clean up** - Delete test data after tests
5. **Isolate tests** - Each test should be independent
6. **Use meaningful names** - Test and step names should be descriptive

## Debugging Tests

### View test execution
```bash
npm run test:e2e:headed
```

### Pause execution
Add `await page.pause()` in test code

### Screenshots and videos
Failed tests automatically capture screenshots and videos

### Trace viewer
```bash
npx playwright show-trace trace.zip
```

## CI/CD Integration

Tests are configured for CI/CD:
- Automatic retries on failure
- HTML report generation
- JSON results output
- Screenshot/video on failure

## Test Data Management

- Tests should use unique test data (e.g., timestamps in emails)
- Clean up test data after tests complete
- Use environment variables for test credentials

## Known Limitations

1. **Backend dependency** - Tests require backend API to be running
2. **Test data** - Some tests may need pre-existing test data
3. **Timing** - Some tests may need adjustment for slower networks
4. **Mobile tests** - Mobile viewport tests may need UI adjustments

## Future Improvements

- [ ] Add component tests with React Testing Library
- [ ] Add unit tests for utilities
- [ ] Add visual regression tests
- [ ] Add accessibility tests
- [ ] Add performance tests
- [ ] Add API mocking for faster tests

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [React Testing Library](https://testing-library.com/react)
- [E2E Test README](./e2e/README.md)

