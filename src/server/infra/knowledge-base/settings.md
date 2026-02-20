# Settings & Configuration

TQ has several configuration areas that let you customize how your clinic uses the system. Most settings are managed by administrators, but understanding them helps all staff members know what is possible. **Only users with the Admin role can see and access the Configurations menu.**

## Email Templates

Email templates control how the emails look when you share quotes or prevention documents with patients.

### How to Configure

1. Navigate to **Configurations > Email Template** in the TQ sidebar.
2. Select whether you want to edit the template for **Quotes** or **Prevention Documents** (they have separate templates).
3. Customize the email content (subject, greeting, body) and visual settings (see below).
4. Use the **live preview** on the right side to see exactly how the email will look.
5. Save your changes. All future emails of that type will use the updated template.
6. Use **Reset to Default** if you want to revert all changes back to the original template.

### Email Template Variables

The email template supports variables that are automatically replaced with real data when the email is sent. Wrap variable names in dollar signs.

Available variables:

- `$patientName$` — The patient's full name.
- `$quoteNumber$` — The quote document number (available in Quote templates).
- `$preventionNumber$` — The prevention document number (available in Prevention templates).
- `$clinicName$` — Your clinic's name.
- `$PUBLIC_LINK$` — The public link to the landing page where the patient views their document. **REQUIRED** — this variable must be included in the template, otherwise the patient will not receive the link.
- `$PASSWORD_BLOCK$` — The password block that displays the access password for protected links. **REQUIRED** — this variable must be included so the patient can access password-protected documents.

Example usage in the email body:

```
Hello $patientName$,

Your quote #$quoteNumber$ from $clinicName$ is ready.

$PUBLIC_LINK$

$PASSWORD_BLOCK$
```

### Visual Settings

In addition to the text content, you can customize the visual appearance of the email:

- **Show Logo**: Toggle to show or hide your clinic logo in the email header. When hidden, a text header with your clinic name is shown instead.
- **Header Color**: Choose from 8 color options including solid colors and gradients for the email header background.
- **Button Color**: The background color of the CTA (Call to Action) button.
- **Button Text Color**: The text color on the CTA button (light or dark, depending on your button color).
- **CTA Button Text**: The label on the action button (e.g., "View Your Quote", "See Your Care Plan").

### Footer Settings

The email footer automatically pulls contact information from your clinic's branding settings (configured in Hub > Branding). You can toggle which information to display:

- **Email**: Show your clinic's email address.
- **Phone**: Show your clinic's phone number.
- **Address**: Show your clinic's physical address.
- **Social Links**: Show links to your clinic's social media profiles.

If a field is not configured in Hub > Branding, it will not appear in the footer even if toggled on.

### Tips for Email Templates

- Keep the subject line short and clear so patients open the email.
- Include your clinic name in the subject so patients recognize the sender.
- Make the CTA button text action-oriented (e.g., "View Your Quote" rather than "Click Here").
- Always keep `$PUBLIC_LINK$` and `$PASSWORD_BLOCK$` in the template — removing them means patients cannot access their documents.
- Use the live preview to check your changes before saving.
- Footer contact info comes from Hub > Branding. Update it there if the info is missing or wrong.

## Communication Settings (SMTP)

SMTP stands for Simple Mail Transfer Protocol. In simple terms, it is the system that sends emails. TQ needs SMTP settings to send emails on your clinic's behalf when you share documents with patients.

### What SMTP Does

When you share a quote or prevention document, TQ sends an email to the patient with the link and password. SMTP settings determine which email server sends that message and what email address it comes from. Without SMTP configured, TQ cannot send emails.

### How to Configure SMTP

1. Go to **Hub > Communication** (this is in the Hub portal, not TQ).
2. Enter your SMTP server details:
   - **SMTP Server** (host): The address of your email server (e.g., smtp.gmail.com, smtp.office365.com).
   - **Port**: The port number for the SMTP server (common values: 587 for TLS, 465 for SSL).
   - **Username**: Usually your email address or account username.
   - **Password**: Your email account password or an app-specific password.
3. Save and test the configuration.

### Default SMTP

LivoCare provides a default SMTP server so you can start sending emails immediately. However, emails sent through the default server come from a LivoCare address. To have emails come from your own clinic domain (e.g., info@yourclinic.com), configure your own SMTP settings.

## Transcription Quota

TQ uses AI-powered transcription to convert your session recordings into text. This service has a monthly usage limit based on your subscription plan.

### How the Quota Works

- **Default quota**: 60 minutes of transcription per month.
- **Tracking**: Your current usage is displayed in **Hub > Transcription Usage**.
- **Warning at 80%**: When you reach 80% of your monthly quota (48 minutes by default), TQ shows a warning alert. This gives you time to manage your remaining minutes.
- **Disabled at 100%**: When you reach 100% of your quota, new transcriptions are temporarily disabled until the next billing cycle.
- **Monthly reset**: Your quota resets automatically every month based on your billing cycle start date.

### Managing Your Subscription

1. Go to **Hub > Transcription Usage**.
2. Click **Manage Subscription** to open the Stripe billing portal.
3. From the Stripe portal, you can:
   - Upgrade your plan for more transcription minutes.
   - Change your payment method.
   - View past invoices.
   - Update billing information.

### Tips for Managing Your Quota

- Check your usage periodically in the Hub to avoid running out mid-month.
- If you consistently hit the limit, consider upgrading your plan.
- Longer sessions use more transcription minutes. For very long consultations, consider pausing and resuming recording to capture only the relevant portions.
- The 80% warning is your signal to be mindful of remaining minutes for the rest of the month.

## Items Catalog

The items catalog is your list of products and services that you include in patient quotes. Managing this catalog well ensures your quotes are consistent and accurate.

### How to Manage Items

1. Navigate to **Documents > Items** in the TQ sidebar.
2. Here you can:
   - **Add a new item**: Click the create button and enter the item name, description, and base price.
   - **Edit an item**: Click on an existing item to update its name, description, or price.
   - **Deactivate an item**: Toggle an item to inactive. Deactivated items will not appear when creating new quotes but remain on existing quotes.
   - **Reactivate an item**: Toggle a deactivated item back to active to make it available again.

### Item Fields

- **Name**: The product or service name (e.g., "Botox - Forehead", "Hyaluronic Acid Filler").
- **Description**: Optional details about the item.
- **Base Price**: The default price for this item. You can adjust the price per quote when adding it to a specific quote.

### Tips for the Items Catalog

- Use clear, descriptive names so any staff member can find the right item.
- Set accurate base prices to speed up quote creation. You can always adjust per patient.
- Deactivate items you no longer offer rather than deleting them, so existing quotes remain intact.
- Review your catalog periodically to keep prices up to date.

## Branding

Your clinic's visual identity is configured in the Hub and appears on documents, emails, and landing pages.

### How to Configure Branding

1. Go to **Hub > Branding**.
2. Configure the following:
   - **Logo**: Upload your clinic logo. It appears on printed documents, emails, and landing pages.
   - **Colors**: Set 3 colors (primary, secondary, accent) to match your brand.
   - **Company Info**: Enter your clinic name, phone number, email, and address.
   - **Social Links**: Add links to your social media profiles.
3. Save your changes. Branding updates are reflected across TQ.

## Troubleshooting

- **Emails are not being sent**: Check your SMTP configuration in Hub > Communication. If using your own SMTP, verify the server, port, username, and password are correct. Try the default LivoCare SMTP to confirm the issue is with your custom settings.
- **Transcription stopped working**: You have likely reached your monthly quota. Check Hub > Transcription Usage. If at 100%, wait for the monthly reset or upgrade your plan.
- **Items not showing in quotes**: Make sure the item is active in the Items catalog. Deactivated items do not appear when creating new quotes.
- **Branding not appearing on documents**: Ensure your logo and company info are saved in Hub > Branding. Changes may take a moment to propagate.
- **Cannot access Configurations menu**: Only Admin users can see and access Configurations. Ask your clinic administrator to make changes or to grant you Admin access.

## Frequently Asked Questions

**Q: Can I have different email templates for different doctors?**
A: No, email templates are configured at the clinic level. All staff use the same quote template and the same prevention document template.

**Q: What happens if I change SMTP settings?**
A: New emails will be sent using the updated SMTP settings. Previously sent emails are not affected.

**Q: Can I increase my transcription quota without upgrading?**
A: The quota is tied to your subscription plan. Contact LivoCare support if you need a custom arrangement.

**Q: Do deactivated items disappear from existing quotes?**
A: No. Deactivated items remain on quotes where they were already added. They simply stop appearing as options when creating new quotes.
