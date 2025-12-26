/**
 * TQ LOGIN E2E TESTS
 *
 * Tests for TQ login and SSO flow:
 * - Direct login
 * - SSO from Hub
 */

import { test, expect } from '@playwright/test';

test.describe('TQ Login', () => {
  test.beforeEach(async ({ page }) => {
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
    await expect(
      page.locator('[role="alert"], .error, .toast-error, .Toastify')
    ).toBeVisible({
      timeout: 5000,
    });
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit empty form
    await page.click('button[type="submit"]');

    // Should still be on login page
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('TQ SSO Flow', () => {
  test.skip('should accept SSO token from URL', async ({ page }) => {
    // Simulate SSO flow with mock token
    // In real scenario, this would come from Hub
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInRlbmFudElkIjoxLCJlbWFpbCI6InRlc3RAdGVzdC5jb20iLCJyb2xlIjoiYWRtaW4ifQ.mock';
    const tenantId = '1';

    await page.goto(`/login?token=${encodeURIComponent(mockToken)}&tenantId=${tenantId}`);

    // Should redirect to home after SSO login
    // Note: This would fail with mock token in real implementation
    await expect(page).toHaveURL(/\/(home)?$/, { timeout: 10000 });
  });

  test('should redirect to login without SSO params', async ({ page }) => {
    // Access protected route without auth
    await page.goto('/patients');

    // Should be redirected to login
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('TQ Authentication State', () => {
  test.skip('should persist login across page refresh', async ({ page }) => {
    // First login
    await page.goto('/login');

    const testEmail = process.env.TEST_USER_EMAIL || 'test@test.com';
    const testPassword = process.env.TEST_USER_PASSWORD || 'password';

    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for successful login
    await expect(page).toHaveURL(/\/(home)?$/, { timeout: 10000 });

    // Refresh page
    await page.reload();

    // Should still be logged in (not redirected to login)
    await expect(page).not.toHaveURL(/login/);
  });

  test.skip('should logout successfully', async ({ page }) => {
    // Assume already logged in
    await page.goto('/');

    // Find and click logout button
    const logoutButton = page.locator(
      '[data-testid="logout"], button:has-text("Logout"), button:has-text("Sair")'
    ).first();

    if (await logoutButton.isVisible()) {
      await logoutButton.click();

      // Should be redirected to login
      await expect(page).toHaveURL(/login/, { timeout: 5000 });
    }
  });
});
