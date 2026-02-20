# Landing Pages

Landing pages are customizable public pages for sharing **quotes and prevention documents** with patients.

## How It Works

1. Create a landing page template using the visual drag-and-drop editor (Puck).
2. When sharing a quote or prevention document, select a template.
3. A unique public URL is generated in the format `{TQ_ORIGIN}/lp/{accessToken}`.
4. A **password is auto-generated** (8 characters) and an **email is automatically sent** to the patient with the link and password.
5. Patients can view the page by entering the password, without logging in.

## Landing Page Editor (Puck)

The visual editor lets you design landing pages with these components:

- **Grid / Flex**: Layout containers for organizing content.
- **Heading / Text**: Typography elements.
- **Button**: Call-to-action buttons.
- **QuoteTotal**: Displays the quote total amount.
- **ItemsTable**: Shows a table of quoted items with prices.
- **Header / Footer**: Page header and footer sections.

## Landing Page Templates

- Create reusable templates from **Landing Pages > Templates**.
- One template can be marked as the **default** for new shares.
- Templates store the full Puck editor configuration as JSON.

## Sharing

- From a quote or prevention document, click the **Share** button.
- Choose a landing page template (or use the default).
- A password is auto-generated and the email is auto-sent to the patient.
- The patient receives the link and password via email.

## Managing Shared Links

- **Revoke access**: Disable the shared link so the patient can no longer view it.
- **Generate new password**: Creates a new password and automatically re-sends the email to the patient.

## Tracking

- View count is tracked for each shared page.
- See when the page was last viewed.
- Active/inactive toggle to control access.
