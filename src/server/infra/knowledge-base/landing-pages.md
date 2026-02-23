# Landing Pages

Landing pages are the public-facing pages where your patients view their quotes and prevention documents. When you share a quote or prevention document, the patient receives a link to a landing page that displays their information in a professional, branded layout. You control the design using a visual drag-and-drop editor.

## What Landing Pages Are

A landing page is a standalone web page that exists at a unique URL. It is not part of the TQ app itself; it is a public page that your patients can access without logging in. They only need the link and a password.

Typical use cases:
- Sharing a treatment quote with a patient so they can review pricing at home.
- Sending a prevention care plan for the patient to reference.
- Presenting a professional, branded document that reflects your clinic's identity.

## How Sharing Works - Complete Flow

1. Open a quote or prevention document in TQ.
2. Click the **Share** button.
3. Select a landing page template to determine the visual layout. If you have not created any templates, a **default template is automatically created** for you.
4. TQ generates a unique public URL in the format: `your-domain/lp/{accessToken}`.
5. An **8-character password** is auto-generated for security.
6. An **email is automatically sent** to the patient with the link and password.
7. The patient clicks the link, enters the password, and views their document.
8. TQ tracks when and how often the patient views the page.

## The Puck Visual Editor

TQ uses a built-in visual editor called Puck that lets you design landing page templates with drag-and-drop. No coding is required.

### Available Components

- **Header** - A page header section, typically containing your clinic logo and name.
- **Footer** - A page footer section for contact information, disclaimers, or branding.
- **Grid** - A layout container that arranges items in a grid pattern. Use it to create multi-column layouts.
- **Flex** - A flexible layout container for arranging items in rows or columns with control over spacing and alignment.
- **Heading** - Large text for section titles (e.g., "Your Treatment Quote", "Care Plan").
- **Text** - Regular paragraph text for descriptions, instructions, or notes.
- **Button** - A call-to-action button (e.g., "Contact Us", "Schedule Appointment").
- **QuoteTotal** - A special component that automatically displays the total amount of a quote. It pulls the calculated total directly from the quote data.
- **ItemsTable** - A table component that automatically lists all items from a quote with their names, quantities, and prices. It populates from the quote data.

### Designing a Template

1. Go to **Landing Pages** in the TQ sidebar, then open **Templates**.
2. Click **Create Template** to start a new design, or edit an existing template.
3. The Puck editor opens with a blank canvas (or your existing design).
4. Drag components from the left panel onto the canvas.
5. Click on any component to configure its properties (text content, colors, spacing, etc.).
6. Arrange components by dragging them to reorder.
7. Save when you are satisfied with the design.

## Landing Page Templates

- Templates are reusable designs. Create one template and use it for all your shares, or create different templates for different purposes.
- You can mark one template as the **default**. This template is automatically selected when you share a document.
- If you have never created a template, TQ provides a **default template** that is auto-created the first time you share something. You can customize it later.
- Templates store the complete layout configuration, so changes to a template do not affect previously shared pages.
- The template JSON configuration is saved automatically, preserving your exact layout.

## Password Protection

- Every shared landing page is protected with an auto-generated 8-character password.
- The patient must enter this password to view the content.
- This ensures sensitive medical and financial information is not publicly accessible.
- Only the patient (who receives the email) has the password.

## Managing Shared Links

Once a document has been shared, you have full control over access:

- **Revoke access**: Click the revoke option to disable the shared link immediately. The patient will no longer be able to view the page, even with the correct password. The page will show an "access revoked" message.
- **Generate a new password**: If a patient loses their password or you want to reset it for security reasons, generate a new password. This automatically re-sends the email to the patient with the updated password. The old password stops working immediately.
- **Track views**: See how many times the patient has viewed the page and when they last accessed it.
- **Active/inactive toggle**: Control whether a shared page is active. Inactive pages cannot be accessed.

## Tips and Best Practices

- **Design your template once, use it everywhere**: A well-designed template with your logo, colors, and contact info creates a consistent, professional experience for all patients.
- **Keep it simple**: Landing pages work best when they are clean and easy to read. Use the Header, ItemsTable (or document content), QuoteTotal, and Footer for a straightforward layout.
- **Include contact information**: Add your clinic phone number or email in the Footer so patients can easily reach you with questions.
- **Use the default template to start**: The auto-created default template works well out of the box. You can customize it later once you are familiar with the editor.
- **Test before sharing**: Preview your landing page template by sharing a test quote to yourself to make sure it looks correct.

## Troubleshooting

- **Shared link is not working**: Check if the access has been revoked. Go to the quote or prevention document and look at the sharing status. If revoked, the link will not work. You can re-share the document to generate a new link.
- **Patient forgot their password**: Go to the shared document and click "Generate new password." This creates a fresh password and automatically re-sends the email.
- **Patient says the page looks broken**: Ensure your landing page template is properly configured. Open the template in the Puck editor, check that all components are placed correctly, and save again.
- **Email was not sent to the patient**: Verify the patient has a valid email address in their profile. Also check that your SMTP settings are configured in Hub > Configurations > Communication.
- **Landing page shows old information**: Landing pages display the data as it was at the time of sharing. If you updated a quote after sharing, you may need to re-share it with the updated content.
- **Cannot find templates**: Landing page templates are under **Landing Pages > Templates** in the TQ sidebar. Only Admin users can create and edit templates.

## Frequently Asked Questions

**Q: Can I use different templates for quotes and prevention documents?**
A: Yes. When sharing, you can choose any template. You might create one template optimized for quotes (with ItemsTable and QuoteTotal) and another for prevention documents (focused on text content).

**Q: Do patients need an account to view landing pages?**
A: No. Patients only need the link and the password. No login or account is required.

**Q: What happens if I edit a template after sharing a document?**
A: Previously shared pages are not affected. They keep the design that was used when they were shared. Only new shares will use the updated template.

**Q: Can patients download or print the landing page?**
A: Patients can use their browser's print function to print or save the page as a PDF.

**Q: How long do shared links remain active?**
A: Shared links remain active indefinitely unless you revoke them or toggle them to inactive.
