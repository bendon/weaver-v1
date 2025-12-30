import { test, expect } from '@playwright/test';

/**
 * E2E Test: Authentication Flow
 * 
 * Tests login, registration, and session management
 */

test.describe('Authentication Flow', () => {
  const TEST_EMAIL = process.env.TEST_EMAIL || `test-${Date.now()}@example.com`;
  const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';
  const TEST_NAME = 'Test User';
  const TEST_ORG = 'Test Organization';

  test('Login page loads correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Check for login form elements
    await expect(page.locator('form.login-form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button.login-button')).toBeVisible();
    
    // Check for login/register toggle
    await expect(page.locator('button.link-button')).toBeVisible();
  });

  test('Register new account', async ({ page }) => {
    await page.goto('/login');
    
    // Switch to register mode
    const registerButton = page.locator('button.link-button').first();
    await registerButton.click();
    
    // Fill registration form
    const nameInput = page.locator('input[placeholder*="John Doe"], input[type="text"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill(TEST_NAME);
    }
    
    const orgInput = page.locator('input[placeholder*="Safari Dreams"], input[type="text"]').nth(1);
    if (await orgInput.isVisible()) {
      await orgInput.fill(TEST_ORG);
    }
    
    const emailInput = page.locator('input[type="email"]');
    await emailInput.fill(TEST_EMAIL);
    
    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(TEST_PASSWORD);
    
    // Submit registration
    await page.locator('button.login-button').click();
    
    // Should redirect to dashboard
    await page.waitForURL(/\/(dashboard|\/)/, { timeout: 10000 });
    
    // Verify we're logged in
    await expect(page.locator('.dashboard-title, h1')).toBeVisible({ timeout: 10000 });
  });

  test('Login with valid credentials', async ({ page }) => {
    // First register (if not already registered)
    await page.goto('/login');
    
    // Try to login first
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    
    await page.locator('button.login-button').click();
    
    // Should redirect to dashboard
    await page.waitForURL(/\/(dashboard|\/)/, { timeout: 10000 });
    
    // Verify we're logged in
    await expect(page.locator('.dashboard-title, h1')).toBeVisible({ timeout: 10000 });
  });

  test('Login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login');
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await emailInput.fill('invalid@example.com');
    await passwordInput.fill('wrongpassword');
    
    await page.locator('button.login-button').click();
    
    // Should show error message
    await expect(page.locator('.error-message')).toBeVisible({ timeout: 5000 });
    
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('Unauthenticated user redirected to login', async ({ page }) => {
    // Clear any existing auth
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
    });
    
    // Try to access protected route
    await page.goto('/bookings');
    
    // Should redirect to login
    await page.waitForURL(/\/login/, { timeout: 5000 });
  });

  test('Session persists after page reload', async ({ page }) => {
    // Login first
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    
    await page.locator('button.login-button').click();
    await page.waitForURL(/\/(dashboard|\/)/, { timeout: 10000 });
    
    // Reload page
    await page.reload();
    
    // Should still be logged in
    await expect(page.locator('.dashboard-title, h1')).toBeVisible({ timeout: 10000 });
    await expect(page).not.toHaveURL(/\/login/);
  });
});

