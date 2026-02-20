# Quotes (Budgets/Estimates)

Quotes are financial documents that estimate the cost of treatments for patients.

## Creating a Quote

1. From a session, click **Create Documents**.
2. Select a template or use AI to generate content from the transcription.
3. The quote editor opens with the generated content.
4. Add or modify line items with prices.
5. Save as draft or mark as sent.

## Quote Items

- Items are products or services with base prices.
- Manage your item catalog in **Documents > Items**.
- When adding items to a quote, the base price is copied and can be adjusted.
- Each item has: name, quantity, base price, discount, and final price.
- The quote total is automatically calculated.

## Quote Status

- **Draft**: Being prepared, not yet shared with patient.
- **Sent**: Shared with the patient via email or landing page.
- **Approved**: Patient accepted the quote.
- **Rejected**: Patient declined the quote.
- **Expired**: Quote validity period has passed.

## Sharing Quotes

- Click the **Share** button on a quote to share it via a landing page.
- Select a landing page template (or use the default one).
- A **password is auto-generated** (8 characters) for protection.
- An **email is automatically sent** to the patient with the landing page link and password.
- The public URL format is `/lp/{accessToken}`.
- You can **revoke** access to a shared quote at any time.
- You can **generate a new password**, which automatically re-sends the email to the patient.
- Track views and engagement on shared quotes.

## Quote Numbers

- Quotes are automatically numbered sequentially (e.g., QUO000001, QUO000002).
- Numbers are unique per tenant.
