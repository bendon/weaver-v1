import { test, expect } from '@playwright/test';

/**
 * E2E Test: Navigation and Links
 * 
 * Tests all navigation links and routes are accessible
 */

test.describe('Navigation and Links', () => {
  const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
  const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword123';

  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await emailInput.fill(TEST_EMAIL);
    await passwordInput.fill(TEST_PASSWORD);
    
    await page.locator('button.login-button').click();
    await page.waitForURL(/\/(dashboard|\/)/, { timeout: 10000 });
  });

  test('Sidebar navigation links work', async ({ page }) => {
    const sidebarLinks = [
      { text: 'Dashboard', url: '/' },
      { text: 'Bookings', url: '/bookings' },
      { text: 'Travelers', url: '/travelers' },
      { text: 'Messages', url: '/messages' },
      { text: 'Flights', url: '/flights' },
      { text: 'AI Assistant', url: '/chat' },
      { text: 'Automation', url: '/automation' },
      { text: 'Settings', url: '/settings' },
    ];

    for (const link of sidebarLinks) {
      // Find sidebar button with the text
      const linkButton = page.locator(`button:has-text("${link.text}"), .sidebar-nav-item:has-text("${link.text}")`).first();
      
      if (await linkButton.isVisible()) {
        await linkButton.click();
        await page.waitForTimeout(1000);
        
        // Verify URL changed
        await expect(page).toHaveURL(new RegExp(link.url.replace('/', '\\/')), { timeout: 5000 });
      }
    }
  });

  test('Dashboard links work', async ({ page }) => {
    await page.goto('/');
    
    // Test "New Booking" button
    const newBookingButton = page.locator('button:has-text("New Booking"), .dashboard-new-booking-btn').first();
    if (await newBookingButton.isVisible()) {
      await newBookingButton.click();
      await page.waitForURL(/\/bookings\/new/, { timeout: 5000 });
      await page.goBack();
    }
  });

  test('Bookings page links work', async ({ page }) => {
    await page.goto('/bookings');
    
    // Test "New Booking" button
    const newBookingButton = page.locator('button:has-text("New Booking")').first();
    if (await newBookingButton.isVisible()) {
      await newBookingButton.click();
      await page.waitForURL(/\/bookings\/new/, { timeout: 5000 });
      await page.goBack();
    }
    
    // If there are bookings, test clicking on one
    const bookingRow = page.locator('tr, .booking-card').first();
    if (await bookingRow.isVisible()) {
      await bookingRow.click();
      await page.waitForURL(/\/bookings\/[^/]+/, { timeout: 5000 });
    }
  });

  test('Booking detail page links work', async ({ page }) => {
    // Navigate to bookings first
    await page.goto('/bookings');
    await page.waitForTimeout(2000);
    
    // Try to find a booking to click
    const bookingLink = page.locator('tr, .booking-card, code.booking-code').first();
    if (await bookingLink.isVisible()) {
      await bookingLink.click();
      await page.waitForURL(/\/bookings\/[^/]+/, { timeout: 5000 });
      
      // Test tabs
      const tabs = ['Overview', 'Itinerary', 'Travelers', 'Flights', 'Messages', 'Activity'];
      
      for (const tab of tabs) {
        const tabButton = page.locator(`button:has-text("${tab}"), .booking-tab:has-text("${tab}")`).first();
        if (await tabButton.isVisible()) {
          await tabButton.click();
          await page.waitForTimeout(500);
        }
      }
      
      // Test action buttons
      const editButton = page.locator('button:has-text("Edit")').first();
      if (await editButton.isVisible()) {
        await editButton.click();
        await page.waitForURL(/\/bookings\/[^/]+\/edit/, { timeout: 5000 });
        await page.goBack();
      }
    }
  });

  test('Travelers page links work', async ({ page }) => {
    await page.goto('/travelers');
    
    // Test "New Traveler" button if exists
    const newTravelerButton = page.locator('button:has-text("New Traveler"), button:has-text("Add Traveler")').first();
    if (await newTravelerButton.isVisible()) {
      await newTravelerButton.click();
      await page.waitForURL(/\/travelers\/new/, { timeout: 5000 });
      await page.goBack();
    }
  });

  test('Mobile navigation works', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/');
    
    // Look for mobile menu toggle
    const menuToggle = page.locator('.sidebar-mobile-toggle, button[aria-label*="menu" i]').first();
    if (await menuToggle.isVisible()) {
      await menuToggle.click();
      await page.waitForTimeout(500);
      
      // Verify sidebar is open
      const sidebar = page.locator('.sidebar.mobile-open, .sidebar');
      await expect(sidebar).toBeVisible();
    }
  });
});

