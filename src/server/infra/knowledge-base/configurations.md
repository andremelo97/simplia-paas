# Configurations

Configuration settings in LivoCare are split between two places: the **TQ app** and the **Hub portal**. Each handles different aspects of your clinic's setup. Understanding this split helps you know where to go to change specific settings.

## Who Can Access Configurations

**Only users with the Admin role can see and access configuration settings.** Regular users (doctors, staff without Admin privileges) will not see the Configurations menu in TQ or the settings options in the Hub. If you need to change settings but do not have Admin access, ask your clinic administrator.

## How to Access Configurations

- **TQ Configurations**: Open TQ and look for **Configurations** in the left sidebar menu.
- **Hub Configurations**: Log in to the Hub portal at hub.livocare.ai and navigate to the desired settings section.

## TQ Configurations

TQ configurations focus on how the TQ application behaves for your clinic. Currently, the main TQ configuration is email templates.

### Email Templates

Email templates control the content and appearance of emails sent to patients when you share quotes or prevention documents.

1. Navigate to **Configurations > Email Template** in the TQ sidebar.
2. Select the template type: **Quotes** or **Prevention Documents** (each has its own template).
3. Customize these fields:
   - **Subject line** - What the patient sees as the email subject.
   - **Greeting** - The opening line of the email.
   - **Body text** - The main content explaining what the patient is receiving.
   - **CTA (Call to Action) button text** - The button label that the patient clicks to view their document (e.g., "View Your Quote").
   - **Footer** - Text at the bottom for disclaimers, contact info, or legal notices.
4. Save. All future emails of that type will use this template.

### Tips for Email Templates

- Use a clear subject line that includes your clinic name so patients recognize the email.
- Keep the body text concise. Patients mainly want to click the button and view their document.
- The CTA button text should be action-oriented: "View Your Quote" is better than "Click Here".
- Include your clinic's contact information in the footer so patients know how to reach you with questions.

## Hub Configurations

The Hub is the central management portal for your LivoCare account. Hub configurations affect your entire clinic across all LivoCare applications.

### Branding

Your clinic's visual identity is managed in the Hub and appears across all documents, emails, and landing pages.

1. Navigate to **Hub > Branding**.
2. Configure the following:
   - **Logo** - Upload your clinic logo. This appears on printed documents, email headers, and landing pages shared with patients.
   - **Colors** - Set 3 brand colors (primary, secondary, accent) that are used throughout the interface and on shared documents.
   - **Company Information** - Enter your clinic name, phone number, email address, and physical address. This information appears on official documents.
   - **Social Links** - Add links to your clinic's social media profiles (Instagram, Facebook, etc.). These can appear on shared landing pages.
   - **Background Video** - Upload or configure a background video for your clinic's landing pages and public-facing content.
3. Save your changes. Branding updates propagate to all LivoCare applications.

### Communication (SMTP)

SMTP (Simple Mail Transfer Protocol) is what allows TQ to send emails on your behalf. Think of it as the "outgoing mail" settings for your clinic.

1. Navigate to **Hub > Communication**.
2. LivoCare provides a **default SMTP server** so you can start sending emails immediately without any setup. Emails sent this way come from a LivoCare address.
3. To send emails from your own clinic domain (e.g., info@yourclinic.com):
   - Enter your SMTP server address (e.g., smtp.gmail.com).
   - Enter the port number (typically 587 or 465).
   - Enter your email username and password.
   - Save and test the connection.
4. Custom SMTP means patients see your clinic's email address as the sender, which builds trust and professionalism.

### Transcription Usage

Monitor and manage your AI transcription quota from the Hub.

1. Navigate to **Hub > Transcription Usage**.
2. View your current usage: how many minutes you have used this month vs. your monthly quota.
3. The default quota is **60 minutes per month**.
4. Alerts:
   - At **80% usage** (48 minutes by default), a warning is shown to help you manage remaining minutes.
   - At **100% usage**, new transcriptions are temporarily disabled until the quota resets.
5. The quota resets automatically each month based on your billing cycle.
6. Click **Manage Subscription** to open the Stripe billing portal where you can:
   - Upgrade your plan for more transcription minutes.
   - Change your payment method.
   - View and download past invoices.
   - Update billing details.

### Marketplace

The Marketplace lets you browse and import pre-built templates and landing page designs created by LivoCare and the community.

1. Navigate to **Hub > Marketplace**.
2. Browse available content:
   - **Clinical note templates** - Pre-built templates for common procedures and specialties.
   - **Prevention document templates** - Ready-to-use care plan formats.
   - **Landing page designs** - Professional landing page templates you can use or customize.
3. Click **Import** on any item to add it to your clinic's library.
4. Imported templates appear in TQ alongside your custom-created templates.
5. You can customize imported templates after importing them.

### Tips for the Marketplace

- Check the Marketplace regularly for new templates. LivoCare adds content based on user feedback and industry trends.
- Importing a template does not overwrite your existing templates. It is added as a new item.
- Use marketplace templates as a starting point, then customize them to match your clinic's specific needs.

## Summary: Where to Find What

| Setting | Where | Path |
|---------|-------|------|
| Email templates | TQ | Configurations > Email Template |
| Branding (logo, colors) | Hub | Branding |
| SMTP (email sending) | Hub | Communication |
| Transcription quota | Hub | Transcription Usage |
| Subscription billing | Hub | Transcription Usage > Manage Subscription |
| Templates marketplace | Hub | Marketplace |
| Items catalog | TQ | Documents > Items |

## Troubleshooting

- **Cannot see Configurations in TQ sidebar**: You do not have Admin access. Ask your clinic administrator to grant you the Admin role.
- **Branding changes not showing up**: Save your changes in Hub > Branding and wait a moment. If still not reflecting, try refreshing TQ or clearing your browser cache.
- **SMTP test email failing**: Double-check the server address, port, username, and password. Common issues include incorrect port numbers or needing an app-specific password (especially with Gmail or Office 365).
- **Marketplace is empty**: The marketplace content depends on your region and subscription. Check your internet connection and try refreshing the page.
- **Transcription disabled unexpectedly**: You have reached 100% of your monthly quota. Go to Hub > Transcription Usage to confirm. Upgrade your plan or wait for the monthly reset.
- **Imported template not appearing in TQ**: After importing from the Marketplace, go to the relevant templates section in TQ (clinical notes or prevention). The imported template should appear in the list. Try refreshing TQ if needed.

## Frequently Asked Questions

**Q: Can a non-Admin user change any settings?**
A: No. All configuration settings require the Admin role. Regular users can only view and use the settings that admins have configured.

**Q: Do I need to configure SMTP to start using TQ?**
A: No. LivoCare provides a default SMTP server. You can start sharing documents immediately. Custom SMTP is optional for clinics that want emails to come from their own domain.

**Q: If I change branding, does it update previously shared landing pages?**
A: Previously shared landing pages retain the branding from when they were shared. New shares will use the updated branding.

**Q: Can I export my clinic's configuration?**
A: Configuration settings are managed through the Hub and TQ interfaces. There is no export function, but all settings are saved to your clinic's account and persist across sessions.

**Q: What is the difference between TQ Configurations and Hub Configurations?**
A: TQ Configurations are specific to the TQ application (currently email templates). Hub Configurations are broader clinic-wide settings (branding, email server, billing, marketplace) that affect all LivoCare applications.
