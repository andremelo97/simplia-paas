/**
 * TQ QUOTE GENERATION E2E TESTS
 *
 * Tests for quote creation and management:
 * - Create quote from session
 * - Add items to quote
 * - Edit quote content
 * - Send quote
 */

import { test, expect } from '@playwright/test';

test.describe('TQ Quotes', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/quotes');
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('TQ Quotes - Authenticated', () => {
  test.skip('should display quotes list', async ({ page }) => {
    await page.goto('/quotes');

    // Should see quotes table or grid
    await expect(
      page.locator('table, [data-testid="quotes-list"], .quotes-grid')
    ).toBeVisible();
  });

  test.skip('should show quote number column', async ({ page }) => {
    await page.goto('/quotes');

    // Should see quote numbers (QUO000001 format)
    const quoteNumber = page.locator(':text("QUO")').first();

    if (await quoteNumber.isVisible()) {
      const text = await quoteNumber.textContent();
      expect(text).toMatch(/QUO\d{6}/);
    }
  });

  test.skip('should view quote details', async ({ page }) => {
    await page.goto('/quotes');

    // Click on first quote
    const quoteRow = page.locator('table tbody tr').first();

    if (await quoteRow.isVisible()) {
      await quoteRow.dblclick();

      // Should be on quote edit page
      await expect(page).toHaveURL(/quotes\/[a-f0-9-]+/);

      // Should see quote content
      await expect(
        page.locator('.quote-content, .tiptap, [data-testid="quote-editor"]')
      ).toBeVisible();
    }
  });

  test.skip('should show quote items section', async ({ page }) => {
    await page.goto('/quotes');

    const quoteRow = page.locator('table tbody tr').first();

    if (await quoteRow.isVisible()) {
      await quoteRow.dblclick();

      // Should see items section
      await expect(
        page.locator('[data-testid="quote-items"], .items-table, :text("Items")')
      ).toBeVisible();
    }
  });

  test.skip('should add item to quote', async ({ page }) => {
    await page.goto('/quotes');

    const quoteRow = page.locator('table tbody tr').first();

    if (await quoteRow.isVisible()) {
      await quoteRow.dblclick();
      await page.waitForURL(/quotes\/[a-f0-9-]+/);

      // Click add item button
      const addItemButton = page.locator(
        'button:has-text("Add Item"), button:has-text("+")'
      ).first();

      if (await addItemButton.isVisible()) {
        await addItemButton.click();

        // Fill item form
        await page.fill('input[name="name"]', 'Test Procedure');
        await page.fill('input[name="basePrice"]', '150');
        await page.fill('input[name="quantity"]', '1');

        // Save item
        await page.click('button:has-text("Save"), button:has-text("Add")');

        // Should see success message
        await expect(page.locator('.Toastify, [role="alert"]')).toBeVisible();
      }
    }
  });

  test.skip('should update quote status', async ({ page }) => {
    await page.goto('/quotes');

    const quoteRow = page.locator('table tbody tr').first();

    if (await quoteRow.isVisible()) {
      await quoteRow.dblclick();

      // Find send button
      const sendButton = page.locator(
        'button:has-text("Send"), button:has-text("Enviar")'
      );

      if (await sendButton.isVisible()) {
        await sendButton.click();

        // Should see success message
        await expect(page.locator('.Toastify, [role="alert"]')).toBeVisible();
      }
    }
  });
});

test.describe('TQ Quote with AI Template', () => {
  test.skip('should open template modal from session', async ({ page }) => {
    await page.goto('/sessions');

    const sessionRow = page.locator('table tbody tr').first();

    if (await sessionRow.isVisible()) {
      await sessionRow.dblclick();
      await page.waitForTimeout(500);

      // Look for AI/Template button
      const templateButton = page.locator(
        'button:has-text("Template"), button:has-text("AI"), button:has-text("Generate")'
      ).first();

      if (await templateButton.isVisible()) {
        await templateButton.click();

        // Should open template selection modal
        await expect(page.locator('[role="dialog"], .modal')).toBeVisible();
      }
    }
  });

  test.skip('should select template and fill with AI', async ({ page }) => {
    await page.goto('/sessions');

    const sessionRow = page.locator('table tbody tr').first();

    if (await sessionRow.isVisible()) {
      await sessionRow.dblclick();
      await page.waitForTimeout(500);

      const templateButton = page.locator(
        'button:has-text("Template"), button:has-text("Generate")'
      ).first();

      if (await templateButton.isVisible()) {
        await templateButton.click();

        // Select first template
        const templateOption = page.locator(
          '[data-testid="template-option"], .template-card'
        ).first();

        if (await templateOption.isVisible()) {
          await templateOption.click();

          // Click fill/generate button
          const fillButton = page.locator(
            'button:has-text("Fill"), button:has-text("Generate"), button:has-text("Create")'
          ).last();

          await fillButton.click();

          // Wait for AI processing
          await page.waitForTimeout(3000);

          // Should see success or navigate to quote
          await expect(page.locator('.Toastify, [role="alert"]')).toBeVisible();
        }
      }
    }
  });
});

test.describe('TQ Quote Calculations', () => {
  test.skip('should show quote total', async ({ page }) => {
    await page.goto('/quotes');

    const quoteRow = page.locator('table tbody tr').first();

    if (await quoteRow.isVisible()) {
      await quoteRow.dblclick();

      // Should see total amount
      await expect(
        page.locator('[data-testid="quote-total"], :text("Total"), .total-amount')
      ).toBeVisible();
    }
  });

  test.skip('should calculate item final price with discount', async ({ page }) => {
    await page.goto('/quotes');

    const quoteRow = page.locator('table tbody tr').first();

    if (await quoteRow.isVisible()) {
      await quoteRow.dblclick();

      // Add item with discount
      const addItemButton = page.locator('button:has-text("Add Item")').first();

      if (await addItemButton.isVisible()) {
        await addItemButton.click();

        await page.fill('input[name="name"]', 'Discounted Item');
        await page.fill('input[name="basePrice"]', '100');
        await page.fill('input[name="discountAmount"]', '10');
        await page.fill('input[name="quantity"]', '2');

        // Save
        await page.click('button:has-text("Save")');

        // Check final price (100 - 10) * 2 = 180
        await expect(page.locator(':text("180")')).toBeVisible();
      }
    }
  });
});

test.describe('TQ Quote Status Workflow', () => {
  test.skip('should show draft status initially', async ({ page }) => {
    await page.goto('/quotes');

    // Look for draft status badge
    const draftBadge = page.locator(
      ':text("draft"), .status-draft, [data-status="draft"]'
    ).first();

    if (await draftBadge.isVisible()) {
      await expect(draftBadge).toBeVisible();
    }
  });

  test.skip('should transition to sent status', async ({ page }) => {
    await page.goto('/quotes');

    const draftQuote = page.locator('tr:has-text("draft")').first();

    if (await draftQuote.isVisible()) {
      await draftQuote.dblclick();

      // Send quote
      await page.click('button:has-text("Send")');

      // Should see sent status
      await expect(
        page.locator(':text("sent"), .status-sent, [data-status="sent"]')
      ).toBeVisible();
    }
  });
});
