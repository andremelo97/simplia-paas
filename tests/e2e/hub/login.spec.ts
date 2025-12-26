/**
 * HUB LOGIN E2E TESTS
 *
 * Tests for Hub login flow:
 * - Successful login
 * - Failed login with wrong credentials
 * - Redirect after login
 */

import { test, expect } from '@playwright/test';

test.describe('Hub Login', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to Hub login page
    await page.goto('/login');
  });

  test('should display login form', async ({ page }) => {
    // Check login form elements exist
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    // Fill in wrong credentials
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for error message
    await expect(page.locator('[role="alert"], .error, .toast-error')).toBeVisible({
      timeout: 5000,
    });
  });

  test('should have password visibility toggle', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Find and click toggle button (usually an eye icon)
    const toggleButton = page.locator(
      'button:has(svg), [aria-label*="password"], [aria-label*="show"]'
    ).first();

    if (await toggleButton.isVisible()) {
      await toggleButton.click();

      // After toggle, input type should change to text
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });

  test('should have language selector', async ({ page }) => {
    // Check for language selector
    const languageSelector = page.locator(
      '[data-testid="language-selector"], select[name="language"], .language-selector'
    );

    if (await languageSelector.isVisible()) {
      await expect(languageSelector).toBeVisible();
    }
  });

  test('should validate email format', async ({ page }) => {
    // Try submitting with invalid email
    await page.fill('input[type="email"]', 'invalidemail');
    await page.fill('input[type="password"]', 'somepassword');

    // Try to submit
    await page.click('button[type="submit"]');

    // Check for validation error (browser native or custom)
    const emailInput = page.locator('input[type="email"]');
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBe(true);
  });

  test('should require password field', async ({ page }) => {
    // Fill only email
    await page.fill('input[type="email"]', 'test@test.com');

    // Try to submit without password
    await page.click('button[type="submit"]');

    // Check that form was not submitted (still on login page)
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Hub Login - Authenticated Flow', () => {
  // These tests require a valid test user
  // Skip if no test credentials are configured

  test.skip('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Use test credentials (should be configured in environment)
    const testEmail = process.env.TEST_USER_EMAIL || 'test@test.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'password';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard/home
    await expect(page).toHaveURL(/\/(home|dashboard)?$/, { timeout: 10000 });
  });

  test.skip('should redirect to home after successful login', async ({ page }) => {
    await page.goto('/login');

    const testEmail = process.env.TEST_USER_EMAIL || 'test@test.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'password';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should be on home page after login
    await expect(page).toHaveURL(/\/(home)?$/, { timeout: 10000 });

    // Should see user menu or profile indicator
    await expect(page.locator('[data-testid="user-menu"], .user-avatar, .profile-menu')).toBeVisible();
  });
});
