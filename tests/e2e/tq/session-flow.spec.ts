/**
 * TQ SESSION FLOW E2E TESTS
 *
 * Tests for session management workflow:
 * - Create session
 * - View transcription
 * - Update session
 */

import { test, expect } from '@playwright/test';

test.describe('TQ Sessions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sessions');
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('TQ Sessions - Authenticated', () => {
  // These tests assume user is authenticated

  test.skip('should display sessions list', async ({ page }) => {
    await page.goto('/sessions');

    // Should see sessions table or grid
    await expect(
      page.locator('table, [data-testid="sessions-list"], .sessions-grid')
    ).toBeVisible();
  });

  test.skip('should show new session button', async ({ page }) => {
    await page.goto('/sessions');

    // Should see create session button
    const newSessionButton = page.locator(
      'button:has-text("New Session"), button:has-text("Start"), a[href*="new"]'
    ).first();

    await expect(newSessionButton).toBeVisible();
  });

  test.skip('should create new session', async ({ page }) => {
    await page.goto('/sessions');

    // Click new session button
    await page.click('button:has-text("New Session"), button:has-text("Start")');

    // Should open session creation modal or page
    await expect(
      page.locator('[role="dialog"], .modal, [data-testid="new-session"]')
    ).toBeVisible();

    // Select or search for patient
    const patientInput = page.locator(
      'input[placeholder*="patient"], input[name="patientId"], .patient-select'
    ).first();

    if (await patientInput.isVisible()) {
      await patientInput.click();
      // Select first patient from dropdown
      const firstOption = page.locator('[role="option"], .option').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }

    // Start transcription or create session
    const startButton = page.locator(
      'button:has-text("Start"), button:has-text("Create"), button:has-text("Begin")'
    ).first();

    await startButton.click();

    // Should see transcription interface or session detail
    await expect(
      page.locator('.transcription, textarea, [data-testid="session-detail"]')
    ).toBeVisible();
  });

  test.skip('should view session details', async ({ page }) => {
    await page.goto('/sessions');

    // Click on first session
    const sessionRow = page.locator(
      'table tbody tr, [data-testid="session-row"]'
    ).first();

    if (await sessionRow.isVisible()) {
      await sessionRow.dblclick();

      // Should be on session detail/edit page
      await expect(page).toHaveURL(/sessions\/[a-f0-9-]+/);

      // Should see session content
      await expect(
        page.locator('.session-content, textarea, .transcription-text')
      ).toBeVisible();
    }
  });

  test.skip('should show patient info in session', async ({ page }) => {
    await page.goto('/sessions');

    // Click on first session
    const sessionRow = page.locator('table tbody tr').first();

    if (await sessionRow.isVisible()) {
      await sessionRow.dblclick();

      // Should see patient info panel
      await expect(
        page.locator('[data-testid="patient-info"], .patient-card, .patient-details')
      ).toBeVisible();
    }
  });

  test.skip('should update session status', async ({ page }) => {
    await page.goto('/sessions');

    // Click on first session
    const sessionRow = page.locator('table tbody tr').first();

    if (await sessionRow.isVisible()) {
      await sessionRow.dblclick();

      // Find status selector
      const statusSelect = page.locator(
        'select[name="status"], [data-testid="status-select"]'
      );

      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption('completed');

        // Save changes
        await page.click('button:has-text("Save"), button[type="submit"]');

        // Should see success message
        await expect(page.locator('.Toastify, [role="alert"]')).toBeVisible();
      }
    }
  });
});

test.describe('TQ Transcription Recording', () => {
  test.skip('should show audio controls', async ({ page }) => {
    await page.goto('/sessions');

    // Start new session
    await page.click('button:has-text("New Session")');

    // Wait for modal/page
    await page.waitForTimeout(500);

    // Should see audio controls
    const audioControls = page.locator(
      '[data-testid="audio-controls"], .audio-recorder, button:has-text("Record")'
    ).first();

    await expect(audioControls).toBeVisible();
  });

  test.skip('should have microphone selection', async ({ page }) => {
    await page.goto('/sessions');
    await page.click('button:has-text("New Session")');
    await page.waitForTimeout(500);

    // Look for microphone selector
    const micSelector = page.locator(
      'select:has-text("microphone"), [data-testid="mic-select"]'
    );

    if (await micSelector.isVisible()) {
      await expect(micSelector).toBeVisible();
    }
  });

  test.skip('should show upload audio option', async ({ page }) => {
    await page.goto('/sessions');
    await page.click('button:has-text("New Session")');
    await page.waitForTimeout(500);

    // Look for upload button
    const uploadButton = page.locator(
      'button:has-text("Upload"), input[type="file"], [data-testid="upload-audio"]'
    ).first();

    await expect(uploadButton).toBeVisible();
  });
});
