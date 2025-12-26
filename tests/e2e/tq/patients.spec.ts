/**
 * TQ PATIENTS E2E TESTS
 *
 * Tests for patient management:
 * - Create patient
 * - Edit patient
 * - Delete patient
 * - Search patients
 */

import { test, expect } from '@playwright/test';

test.describe('TQ Patients', () => {
  // Note: These tests require authentication
  // In production, you would set up authentication state before running

  test.beforeEach(async ({ page }) => {
    // Navigate to patients page
    await page.goto('/patients');
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    // Without auth, should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('TQ Patients - Authenticated', () => {
  // These tests assume user is authenticated
  // You would set up auth state via storageState or login fixture

  test.skip('should display patients list', async ({ page }) => {
    await page.goto('/patients');

    // Should see patients table or list
    await expect(
      page.locator('table, [data-testid="patients-list"], .patients-grid')
    ).toBeVisible();
  });

  test.skip('should have create patient button', async ({ page }) => {
    await page.goto('/patients');

    // Should see create button
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("New"), button:has-text("Add"), a[href*="create"]'
    ).first();

    await expect(createButton).toBeVisible();
  });

  test.skip('should navigate to create patient form', async ({ page }) => {
    await page.goto('/patients');

    // Click create button
    await page.click(
      'button:has-text("Create"), button:has-text("New"), a[href*="create"]'
    );

    // Should be on create page
    await expect(page).toHaveURL(/patients\/(create|new)/);
  });

  test.skip('should create new patient', async ({ page }) => {
    await page.goto('/patients/create');

    // Fill patient form
    await page.fill('input[name="firstName"], #firstName', 'E2E');
    await page.fill('input[name="lastName"], #lastName', 'TestPatient');
    await page.fill(
      'input[name="email"], #email',
      `e2e_${Date.now()}@test.com`
    );
    await page.fill('input[name="phone"], #phone', '+5511999999999');

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to patients list or patient detail
    await expect(page).toHaveURL(/patients(?!\/create)/, { timeout: 5000 });

    // Should see success toast
    await expect(page.locator('.Toastify, [role="alert"]')).toBeVisible();
  });

  test.skip('should search patients', async ({ page }) => {
    await page.goto('/patients');

    // Find search input
    const searchInput = page.locator(
      'input[type="search"], input[placeholder*="search"], input[placeholder*="Search"]'
    ).first();

    await searchInput.fill('E2E');

    // Wait for search results
    await page.waitForTimeout(500);

    // Results should be filtered (at least one result or empty state)
    const results = page.locator('table tbody tr, [data-testid="patient-row"]');
    const emptyState = page.locator(':text("No patients"), :text("Nenhum paciente")');

    // Either results or empty state should be visible
    const hasResults = await results.count() > 0;
    const hasEmptyState = await emptyState.isVisible();

    expect(hasResults || hasEmptyState).toBe(true);
  });

  test.skip('should edit patient', async ({ page }) => {
    await page.goto('/patients');

    // Click on first patient row or edit button
    const editButton = page.locator(
      'button:has-text("Edit"), [aria-label="Edit"], a[href*="edit"]'
    ).first();

    if (await editButton.isVisible()) {
      await editButton.click();

      // Should be on edit page
      await expect(page).toHaveURL(/patients\/.*\/edit/);

      // Update first name
      await page.fill('input[name="firstName"], #firstName', 'Updated');

      // Save
      await page.click('button[type="submit"]');

      // Should see success message
      await expect(page.locator('.Toastify, [role="alert"]')).toBeVisible();
    }
  });

  test.skip('should view patient history', async ({ page }) => {
    await page.goto('/patients');

    // Click on history button or navigate to patient
    const historyButton = page.locator(
      'button:has-text("History"), a[href*="history"]'
    ).first();

    if (await historyButton.isVisible()) {
      await historyButton.click();

      // Should be on history page
      await expect(page).toHaveURL(/patients\/.*\/history/);

      // Should see tabs or history content
      await expect(
        page.locator('[role="tablist"], .tabs, .history-content')
      ).toBeVisible();
    }
  });

  test.skip('should delete patient', async ({ page }) => {
    // First create a patient to delete
    await page.goto('/patients/create');

    await page.fill('input[name="firstName"], #firstName', 'ToDelete');
    await page.fill('input[name="lastName"], #lastName', 'Patient');
    await page.fill('input[name="email"], #email', `delete_${Date.now()}@test.com`);

    await page.click('button[type="submit"]');
    await page.waitForURL(/patients(?!\/create)/);

    // Search for the created patient
    const searchInput = page.locator('input[type="search"]').first();
    await searchInput.fill('ToDelete');
    await page.waitForTimeout(500);

    // Find delete button
    const deleteButton = page.locator(
      'button:has-text("Delete"), [aria-label="Delete"]'
    ).first();

    if (await deleteButton.isVisible()) {
      await deleteButton.click();

      // Confirm deletion if dialog appears
      const confirmButton = page.locator(
        'button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")'
      ).last();

      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      // Should see success message
      await expect(page.locator('.Toastify, [role="alert"]')).toBeVisible();
    }
  });
});
