# Quotes (Budgets/Estimates)

Quotes are financial documents that estimate the cost of treatments and procedures for patients. You can create quotes from a consultation session, add items from your catalog, set prices, and share a secure link with the patient so they can review and approve.

## Complete Workflow: Creating and Sharing a Quote

1. **Start from a session**: Open a completed session and click **Create Documents**.
2. **Select a quote template**: Choose a template or let the AI generate content from the transcription. The AI can suggest relevant items based on what was discussed during the consultation.
3. **Add items from your catalog**: In the quote editor, add products or services from your item catalog. Each item has a name, quantity, base price, optional discount, and final price.
4. **Adjust prices**: Modify quantities, apply discounts, or override base prices as needed. The total is calculated automatically.
5. **Save the quote**: Save it as a Draft while you are still working on it.
6. **Share with the patient**: Click the **Share** button to generate a secure landing page link. Select a landing page template (or use the default). A password is auto-generated and an email is sent to the patient with the link and password.
7. **Track engagement**: Monitor whether the patient opened the link and viewed the quote.

## Quote Items and Catalog

- Manage your item catalog in **Documents > Items**. This is where you define the products and services your clinic offers, along with their base prices.
- When adding items to a quote, the base price is copied from the catalog and can be adjusted for that specific quote without changing the catalog price.
- Each item on a quote has: name, quantity, base price, discount percentage, and final price.
- The quote total is automatically calculated from all line items.
- You can add items manually (without using the catalog) by typing the item details directly.

## Quote Status Lifecycle

Quotes follow a specific lifecycle:

1. **Draft**: The quote is being prepared. It has not been shared with the patient yet. You can freely edit all details.
2. **Sent**: The quote has been shared with the patient via the landing page link. The patient can view it using the password provided by email.
3. **Approved**: The patient has accepted the quote. This indicates they agree with the proposed treatments and prices.
4. **Rejected**: The patient has declined the quote.
5. **Expired**: The quote's validity period has passed without a response from the patient.

You can manually change the status of a quote (for example, marking it as Approved after the patient confirms by phone).

## Sharing Quotes via Landing Page

- Click the **Share** button on any quote to create a shareable landing page.
- Select a landing page template. You can design custom templates in the Landing Pages section using the visual drag-and-drop editor, or use the default template.
- An **8-character password** is automatically generated to protect the page.
- An **email is automatically sent** to the patient with the landing page link and the password.
- The public URL follows the format `/lp/{accessToken}` — this is the link the patient uses to view the quote.

**Important**: The landing page is different from the quote itself. The quote is the financial document inside TQ. The landing page is the public-facing, password-protected webpage that the patient sees when they open the shared link. The landing page can include branding, images, and a visual presentation of the quote.

## Managing Shared Access

- **Revoke access**: You can revoke access to a shared quote at any time. Once revoked, the landing page link stops working and the patient can no longer view it.
- **Regenerate password**: If the patient lost the password or you want to refresh security, you can generate a new password. This automatically triggers a new email to the patient with the updated password.
- **Track views and engagement**: TQ tracks when the patient opens the landing page. You can see view counts and engagement data to know whether the patient has reviewed the quote.

## Quote Numbers

- Quotes are automatically numbered sequentially (e.g., QUO000001, QUO000002).
- Numbers are unique within your clinic and cannot be changed.
- Use the quote number to quickly search for a specific quote.

## Troubleshooting

- **Cannot add items to a quote**: Make sure you have items in your catalog. Go to Documents > Items to create your product and service catalog first.
- **Patient says they did not receive the email**: Check that the patient's email address is correct in their profile. Also ask them to check their spam/junk folder. You can regenerate the password to trigger a new email.
- **Landing page link is not working**: The link may have been revoked. Check the quote's sharing status in TQ. If it was revoked, share it again to generate a new link.
- **Quote shows wrong total**: Verify the quantity, base price, and discount for each item. The total is calculated automatically. If an item has the wrong base price, you can edit it directly on the quote.
- **Cannot delete a quote**: If the quote is linked to a session, check if there are dependencies. Try changing the status to Cancelled instead.
- **Patient cannot open the landing page**: Ensure the patient is entering the correct password (it is case-sensitive). If needed, regenerate the password and resend the email.

## Tips

- Create your item catalog before your first consultation. This saves time when building quotes later.
- Use templates for quotes you create frequently. This ensures consistent pricing and descriptions.
- Review the quote carefully before sharing. Once sent, the patient receives it immediately.
- You can create multiple quotes from the same session (e.g., different treatment options for the patient to compare).

## Frequently Asked Questions

- **Can the patient approve or reject the quote from the landing page?** The landing page shows the quote details, but approval or rejection is typically communicated to the clinic and then updated manually in TQ.
- **Can I edit a quote after sharing it?** You can edit the quote content, but consider that the patient may have already seen the previous version. If you make significant changes, share the updated version again.
- **What happens when a quote expires?** The status changes to Expired. You can create a new quote if the patient is still interested.
- **Is the landing page secure?** Yes. It is password-protected and uses a unique access token. You can revoke access at any time.
