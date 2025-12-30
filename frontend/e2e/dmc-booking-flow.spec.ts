import { test, expect } from '@playwright/test';

/**
 * E2E Test: Complete DMC Booking Flow for Travelers
 * 
 * This test covers the full flow from login to booking creation:
 * 1. Login to the application
 * 2. Navigate to create new booking
 * 3. Fill trip details
 * 4. Add travelers (create new or select existing)
 * 5. Optionally add flights
 * 6. Review and create booking
 * 7. Verify booking was created and view booking detail
 */

test.describe('DMC Booking Flow', () => {
  // Test credentials - these should be set in environment variables or test data
  const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
  const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';
  const TEST_ORG_NAME = process.env.TEST_ORG_NAME || 'Test Organization';

  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Wait for login form to be visible
    await expect(page.locator('form.login-form')).toBeVisible();
  });

  test('Complete DMC booking flow - new traveler', async ({ page }) => {
    // Step 1: Login
    test.step('Login to application', async () => {
      // Check if we need to register first (if user doesn't exist)
      // For this test, we'll try to login first, and register if needed
      const emailInput = page.locator('input[type="email"]');
      const passwordInput = page.locator('input[type="password"]');
      
      await emailInput.fill(TEST_EMAIL);
      await passwordInput.fill(TEST_PASSWORD);
      
      // Try to login
      await page.locator('button.login-button').click();
      
      // Wait for either dashboard or error message
      await page.waitForTimeout(2000);
      
      // If login fails, register instead
      if (page.url().includes('/login')) {
        // Check if there's an error message
        const errorMessage = page.locator('.error-message');
        if (await errorMessage.isVisible()) {
          // Switch to register mode
          await page.locator('button.link-button').first().click();
          
          // Fill registration form
          const nameInput = page.locator('input[placeholder*="John Doe"]');
          const orgInput = page.locator('input[placeholder*="Safari Dreams"]');
          
          if (await nameInput.isVisible()) {
            await nameInput.fill('Test User');
          }
          if (await orgInput.isVisible()) {
            await orgInput.fill(TEST_ORG_NAME);
          }
          
          // Submit registration
          await page.locator('button.login-button').click();
        }
      }
      
      // Wait for redirect to dashboard
      await page.waitForURL(/\/(dashboard|\/)/, { timeout: 10000 });
      
      // Verify we're on the dashboard
      await expect(page.locator('h1, .dashboard-title')).toBeVisible({ timeout: 10000 });
    });

    // Step 2: Navigate to create booking
    test.step('Navigate to create new booking', async () => {
      // Click "New Booking" button (could be in header or dashboard)
      const newBookingButton = page.locator('button:has-text("New Booking"), .dashboard-new-booking-btn, .btn-primary:has-text("New Booking")').first();
      
      if (await newBookingButton.isVisible()) {
        await newBookingButton.click();
      } else {
        // Navigate directly
        await page.goto('/bookings/new');
      }
      
      // Wait for booking creation page
      await page.waitForURL('/bookings/new', { timeout: 10000 });
      
      // Verify we're on the booking creation page
      await expect(page.locator('h1, h2:has-text("Create New Booking"), .new-booking-page')).toBeVisible();
    });

    // Step 3: Fill trip details
    test.step('Fill trip details form', async () => {
      // Wait for the form to be visible
      await expect(page.locator('.booking-content, .step-content')).toBeVisible();
      
      // Fill trip title
      const titleInput = page.locator('input[placeholder*="Kenya Safari"], input[type="text"]').first();
      await titleInput.fill('Test Safari Adventure');
      
      // Fill start date (7 days from now)
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const startDateInput = page.locator('input[type="date"]').first();
      await startDateInput.fill(startDateStr);
      
      // Fill end date (14 days from now)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14);
      const endDateStr = endDate.toISOString().split('T')[0];
      
      const endDateInput = page.locator('input[type="date"]').nth(1);
      if (await endDateInput.isVisible()) {
        await endDateInput.fill(endDateStr);
      }
      
      // Number of travelers (default is usually 1)
      const travelersInput = page.locator('input[type="number"]');
      if (await travelersInput.isVisible()) {
        await travelersInput.fill('2');
      }
      
      // Click Next button
      const nextButton = page.locator('button:has-text("Next"), .btn-primary:has-text("Next")').first();
      await nextButton.click();
      
      // Wait for travelers step
      await expect(page.locator('h2:has-text("Select Travelers"), .step-content')).toBeVisible({ timeout: 5000 });
    });

    // Step 4: Add new traveler
    test.step('Add new traveler', async () => {
      // Fill new traveler form
      const firstNameInput = page.locator('input[placeholder*="First Name"], input[type="text"]').first();
      await firstNameInput.fill('John');
      
      const lastNameInput = page.locator('input[placeholder*="Last Name"], input[type="text"]').nth(1);
      if (await lastNameInput.isVisible()) {
        await lastNameInput.fill('Doe');
      }
      
      const phoneInput = page.locator('input[type="tel"], input[placeholder*="Phone"]').first();
      if (await phoneInput.isVisible()) {
        await phoneInput.fill('+1234567890');
      }
      
      const emailInput = page.locator('input[type="email"]').first();
      if (await emailInput.isVisible()) {
        await emailInput.fill('john.doe@example.com');
      }
      
      // Click "Add Traveler" button
      const addTravelerButton = page.locator('button:has-text("Add Traveler"), .btn-secondary:has-text("Add Traveler")').first();
      await addTravelerButton.click();
      
      // Wait for traveler to be added (toast or list update)
      await page.waitForTimeout(2000);
      
      // Verify traveler is selected (checkbox should be checked)
      const travelerCheckbox = page.locator('input[type="checkbox"]').first();
      if (await travelerCheckbox.isVisible()) {
        const isChecked = await travelerCheckbox.isChecked();
        if (!isChecked) {
          await travelerCheckbox.click();
        }
      }
      
      // Click Next to go to flights step
      const nextButton = page.locator('button:has-text("Next"), .btn-primary:has-text("Next")').first();
      await nextButton.click();
      
      // Wait for flights step
      await expect(page.locator('h2:has-text("Add Flights"), .step-content')).toBeVisible({ timeout: 5000 });
    });

    // Step 5: Skip flights (optional step)
    test.step('Skip flights step', async () => {
      // Verify we're on flights step
      await expect(page.locator('h2:has-text("Add Flights"), .no-flight-selected')).toBeVisible();
      
      // Click Next to skip flights (or there might be a skip button)
      const nextButton = page.locator('button:has-text("Next"), .btn-primary:has-text("Next")').first();
      await nextButton.click();
      
      // Wait for review step
      await expect(page.locator('h2:has-text("Review"), .step-content')).toBeVisible({ timeout: 5000 });
    });

    // Step 6: Review and create booking
    test.step('Review and create booking', async () => {
      // Verify review content is visible
      await expect(page.locator('.review-section, .step-content')).toBeVisible();
      
      // Verify trip details are shown
      await expect(page.locator('text=Test Safari Adventure')).toBeVisible();
      
      // Click "Create Booking" button
      const createButton = page.locator('button:has-text("Create Booking"), .btn-primary:has-text("Create Booking")').first();
      await createButton.click();
      
      // Wait for success message or redirect
      await page.waitForTimeout(3000);
      
      // Should redirect to booking detail page
      await page.waitForURL(/\/bookings\/[^/]+/, { timeout: 10000 });
    });

    // Step 7: Verify booking was created
    test.step('Verify booking detail page', async () => {
      // Verify we're on booking detail page
      await expect(page.locator('.booking-detail, .booking-detail-header')).toBeVisible({ timeout: 10000 });
      
      // Verify booking title is displayed
      await expect(page.locator('text=Test Safari Adventure')).toBeVisible();
      
      // Verify booking code is displayed
      await expect(page.locator('.booking-code, code')).toBeVisible();
      
      // Verify tabs are visible
      await expect(page.locator('.booking-detail-tabs, .booking-tab')).toBeVisible();
      
      // Check travelers tab
      const travelersTab = page.locator('button:has-text("Travelers"), .booking-tab:has-text("Travelers")').first();
      if (await travelersTab.isVisible()) {
        await travelersTab.click();
        
        // Verify traveler is listed
        await expect(page.locator('text=John, text=Doe')).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test('Complete DMC booking flow - select existing traveler', async ({ page }) => {
    // This test assumes a traveler already exists
    // Similar to above but selects existing traveler instead of creating new
    
    // Step 1: Login (same as above)
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    await page.locator('button.login-button').click();
    
    await page.waitForURL(/\/(dashboard|\/)/, { timeout: 10000 });
    
    // Step 2: Navigate to create booking
    await page.goto('/bookings/new');
    await expect(page.locator('.new-booking-page, h2:has-text("Create New Booking")')).toBeVisible();
    
    // Step 3: Fill trip details
    const titleInput = page.locator('input[type="text"]').first();
    await titleInput.fill('Quick Test Booking');
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 10);
    const startDateInput = page.locator('input[type="date"]').first();
    await startDateInput.fill(startDate.toISOString().split('T')[0]);
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 17);
    const endDateInput = page.locator('input[type="date"]').nth(1);
    if (await endDateInput.isVisible()) {
      await endDateInput.fill(endDate.toISOString().split('T')[0]);
    }
    
    await page.locator('button:has-text("Next")').first().click();
    
    // Step 4: Select existing traveler
    await page.waitForTimeout(2000);
    
    // Look for existing travelers list
    const existingTravelerCheckbox = page.locator('input[type="checkbox"]').first();
    if (await existingTravelerCheckbox.isVisible()) {
      await existingTravelerCheckbox.click();
    }
    
    await page.locator('button:has-text("Next")').first().click();
    
    // Step 5: Skip flights
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Next")').first().click();
    
    // Step 6: Review and create
    await page.waitForTimeout(2000);
    await page.locator('button:has-text("Create Booking")').first().click();
    
    // Step 7: Verify booking
    await page.waitForURL(/\/bookings\/[^/]+/, { timeout: 10000 });
    await expect(page.locator('.booking-detail')).toBeVisible();
  });

  test('Login with invalid credentials', async ({ page }) => {
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

  test('Navigate through all main routes', async ({ page }) => {
    // Login first
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    await page.locator('button.login-button').click();
    
    await page.waitForURL(/\/(dashboard|\/)/, { timeout: 10000 });
    
    // Test navigation to each main route
    const routes = [
      { path: '/bookings', name: 'Bookings' },
      { path: '/travelers', name: 'Travelers' },
      { path: '/messages', name: 'Messages' },
      { path: '/flights', name: 'Flights' },
      { path: '/chat', name: 'AI Assistant' },
      { path: '/automation', name: 'Automation' },
      { path: '/settings', name: 'Settings' },
    ];
    
    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForTimeout(1000);
      
      // Verify page loaded (check for common elements)
      const hasContent = await page.locator('body').textContent();
      expect(hasContent).toBeTruthy();
    }
  });
});

