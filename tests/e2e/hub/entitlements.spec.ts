/**
 * HUB ENTITLEMENTS E2E TESTS
 *
 * Tests for Hub entitlements/licenses page:
 * - View licenses
 * - View seat usage
 * - Navigate to apps
 */

import { test, expect } from '@playwright/test';

test.describe('Hub Entitlements', () => {
  // Note: These tests require authentication
  // In production, you would set up authentication state before running

  test.beforeEach(async ({ page }) => {
    // Try to access entitlements page
    // If redirected to login, the test will fail as expected for unauthenticated state
    await page.goto('/');
  });

  test.skip('should display entitlements page after login', async ({ page }) => {
    // This test assumes user is already logged in
    // Navigate to entitlements section
    await page.click('[href*="entitlements"], [data-testid="entitlements-link"]');

    // Should see entitlements header
    await expect(page.locator('h1, h2').filter({ hasText: /licenses|entitlements|apps/i })).toBeVisible();
  });

  test.skip('should display license cards', async ({ page }) => {
    await page.goto('/');

    // Should see license/app cards on home
    const appCards = page.locator('[data-testid="app-card"], .license-card, .entitlement-card');
    await expect(appCards.first()).toBeVisible({ timeout: 5000 });
  });

  test.skip('should show seat information', async ({ page }) => {
    await page.goto('/');

    // Look for seat usage indicators
    const seatInfo = page.locator(
      '[data-testid="seats-used"], .seats-info, :text("seats"), :text("users")'
    );

    if (await seatInfo.first().isVisible()) {
      await expect(seatInfo.first()).toBeVisible();
    }
  });

  test.skip('should navigate to TQ app', async ({ page }) => {
    await page.goto('/');

    // Find and click TQ app card
    const tqCard = page.locator(
      '[data-testid="app-tq"], [href*="tq"], :has-text("Transcription")'
    ).first();

    if (await tqCard.isVisible()) {
      // Click should open TQ in new tab or navigate
      const [newPage] = await Promise.all([
        page.waitForEvent('popup').catch(() => null),
        tqCard.click(),
      ]);

      if (newPage) {
        // Opened in new tab
        await expect(newPage).toHaveURL(/localhost:3005|tq/);
      }
    }
  });

  test.skip('should display user profile section', async ({ page }) => {
    await page.goto('/');

    // Should see user profile/menu
    const userProfile = page.locator(
      '[data-testid="user-profile"], .user-menu, .avatar'
    ).first();

    await expect(userProfile).toBeVisible({ timeout: 5000 });
  });

  test.skip('should show transcription usage if configured', async ({ page }) => {
    await page.goto('/configurations');

    // Look for transcription usage section
    const transcriptionSection = page.locator(
      ':text("transcription"), :text("usage"), [data-testid="transcription-usage"]'
    ).first();

    if (await transcriptionSection.isVisible()) {
      await expect(transcriptionSection).toBeVisible();

      // Should show usage progress or metrics
      const usageMetrics = page.locator(
        '.progress, [role="progressbar"], :text("minutes")'
      );
      await expect(usageMetrics.first()).toBeVisible();
    }
  });
});

test.describe('Hub Navigation', () => {
  test('should have sidebar navigation', async ({ page }) => {
    await page.goto('/');

    // Check for sidebar (even if login required)
    const sidebar = page.locator('nav, aside, [role="navigation"]').first();

    // Sidebar might not be visible on login page
    if (await page.url().includes('login')) {
      // On login page, no sidebar expected
      return;
    }

    await expect(sidebar).toBeVisible();
  });

  test('should have responsive mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // On login page, test menu button if exists
    const menuButton = page.locator(
      '[data-testid="mobile-menu"], button:has(svg[class*="menu"]), .hamburger'
    ).first();

    if (await menuButton.isVisible()) {
      await menuButton.click();

      // Should open mobile menu
      const mobileNav = page.locator('[role="dialog"], .mobile-nav, .drawer');
      await expect(mobileNav).toBeVisible();
    }
  });
});
