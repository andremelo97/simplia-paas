# Landing Page Editor (Puck)

TQ uses a visual drag-and-drop editor called Puck to design landing page templates. These templates define how your shared quotes and prevention documents look when patients open them via a link. You can build professional, branded pages without writing any code.

## How to Access the Editor

1. Click **Landing Pages** in the TQ sidebar (it is a top-level menu item, separate from Documents).
2. Open the **Templates** tab (the other tab is Links, which shows shared links).
3. Click **Create Template** to create a new landing page template, or click on an existing template and then click the **Design** button to open the visual editor.
4. The Puck editor opens with a sidebar of components on the left and a live preview on the right.
5. Drag components from the sidebar into the canvas to build your page.
6. Click on any component in the canvas to edit its settings in the right panel.
7. Save your template when done.

## Component Categories

The editor organizes components into categories. Here is what each one does.

### Layout

These components control how content is arranged on the page.

- **Grid**: Creates a multi-column grid layout. You set the number of columns (1-12), the gap between items, padding, and background color. Use this to place content side by side. On mobile, columns automatically stack.
- **Flex**: A flexible container where you control direction (row or column), alignment (start, center, end), gap, and whether items wrap. Good for arranging buttons, icons, or small groups of elements in a line.
- **Space**: Adds empty vertical or horizontal space between components. You choose the size (8px to 160px) and direction (vertical, horizontal, or both). Use this to create breathing room between sections.
- **Divider**: A horizontal line to visually separate sections. You can customize the color, thickness (1-10px), and spacing above/below.

### Typography

These components display text.

- **Title**: Displays a heading (H1 through H6). You can set the font, size, alignment (left/center/right), color, max width, and padding. Use this for section headings and page titles.
- **Text**: Displays body text. Similar options to Title but also supports linking — you can turn the text into a clickable link by providing a URL. Options include font, size, alignment, color, max width, link URL, and whether the link opens in a new tab.

### Actions

- **Button**: A clickable button. You configure the label text, style (Primary, Secondary, Tertiary, or Outline), size (Small, Medium, Large), alignment, text color, and font. For the action, you choose from: None (decorative only), Approve Quote (patient clicks to approve), Link (opens a URL), or Open Widget (opens an iframe modal). The button colors come from your clinic's branding settings.

### Document Info

These are special components that automatically display data from the shared document (quote or prevention document).

- **DocumentNumber**: Shows the document's sequential number (e.g., QUO000001). You can add a custom label like "Quote #" and choose whether to display the number. Configurable font and size.
- **DocumentTotal**: Shows the total value of the quote. Displays a label (e.g., "Total") and the formatted currency value. You can change the label, font, and the color of the total value.
- **DocumentItems**: Shows the list of items in the quote as a table. On desktop, it renders as a full table with columns for item name, quantity, price, discount, and total. On mobile, it switches to a card layout for readability. You can toggle visibility of the price and discount columns and customize all column labels.
- **DocumentContent**: Renders the full HTML content of the document (used for prevention documents that contain rich text). No configuration needed — it simply displays the document body.

### Media

- **Image**: Displays a single image. You can upload an image or provide a URL, set the aspect ratio (16:9, 4:3, 1:1, etc.), object fit (cover, contain, fill), border radius, max width, alignment, padding, and optionally wrap it in a link.
- **Video**: Embeds a video player. Supports YouTube, Vimeo, and direct video URLs — the editor automatically converts YouTube/Vimeo links to embeddable format. Options include aspect ratio, border radius, max width, alignment, autoplay, loop, muted, and show/hide controls.
- **ImageCarousel**: An automatic slideshow of up to 10 images. You configure images per slide (1-3 side by side), gap between images, transition speed (3-15 seconds), auto-play toggle, height (200-500px), border radius, max width, and alignment. Navigation arrows and dot indicators appear automatically.
- **VideoRows**: Organizes multiple videos in rows. Each row can have 1 or 2 videos side by side. You add rows and configure each with a title and video URL. Options include title font/size/color, video dimensions, gap between rows and videos, background color, and padding.

### Header & Footer

- **Header**: A fixed navigation bar at the top of the page. Shows your clinic logo (from branding settings) and optionally a button. Logo options: show/hide, mobile behavior (normal, smaller, hidden). Button options: label, font, style (Primary/Secondary/Tertiary/Outline), text color, and action (None, Approve Quote, Link, Open Widget). You can set the background color (White, Primary, Secondary, Tertiary) and height (64/80/96px).
- **Footer**: The bottom section of the page with up to 3 columns: Social Links, Quick Links, and Contact. You can choose to pull data from your branding settings automatically (recommended) or enter custom data. Social links support Facebook, Instagram, X, LinkedIn, WhatsApp, YouTube, Pinterest, TikTok, and Website. Contact shows email, phone, and address. You can also add quick links (Privacy Policy, Terms, etc.) and a copyright notice. Background color options: White, Primary, Secondary, Tertiary, or Dark.

### Other (Sections)

These are pre-built section components for building full landing pages quickly.

- **CardContainer**: A bordered card with optional title and description at the top, plus a content slot where you can drop other components inside. Useful for grouping related content visually.
- **CardWithIcon**: A card that displays an icon (from Lucide icon library or custom SVG), a title, and a description. Available in two modes: "card" (bordered box) or "inline" (flat layout). The icon library includes hundreds of icons like Heart, Star, Shield, Check, Phone, Mail, Clock, etc.
- **Hero**: A large banner section for the top of the page. Supports a title, description, and up to 3 action buttons. Background options: solid color, image, or video. You can add a dark overlay for readability, and choose to show inline media (image or video) beside the text. Extensive customization for fonts, sizes, colors, and opacity.
- **Logos**: A row of logo images (e.g., partner logos, certifications). Each logo is an image with alt text. The component automatically arranges logos responsively.
- **Stats**: A statistics section showing numbers with labels (e.g., "500+ Patients", "10 Years Experience"). You set items per row (2-4), and each stat has a value, title, and description with customizable colors.
- **TextColumns**: Organizes content in 2-4 columns, each with a title and text. Alignment, font sizes, gap, and colors are configurable. Columns stack on mobile.
- **TextRows**: Similar to TextColumns but stacked vertically. Each row has a title and text. Useful for structured content like features or benefits lists.
- **Testimonials**: Displays patient or client testimonials in cards. Each card has a quote, author name, role/title, photo, and star rating (0-5). You set the number of columns (1-3) and customize colors for the card, text, and stars.
- **FAQ**: An accordion-style frequently asked questions section. Each item has a question and answer — clicking a question reveals the answer with a smooth animation. Options include allowing multiple items open at once, default open state, title level (H2/H3/H4), max width, and colors.
- **PricingTable**: Displays pricing plans in columns. Each plan has a name, price, period, description, feature list, button, and optional highlight label (e.g., "Most Popular"). Highlighted plans get a colored border to stand out.
- **TeamSection**: Shows team member profiles. Each member has a name, role, photo, bio, LinkedIn, and email. Display modes: "card" (boxed) or "minimal" (clean). Photo sizes: small/medium/large. Configurable columns (2-4).
- **IconList**: A list of items, each with a Lucide icon and label. Can be displayed in "row" (horizontal) or "column" (vertical) layout. Useful for feature lists, contact info, or bullet points with icons.

## Color System

All components use your clinic's branding colors from Hub > Configurations > Branding:

- **Primary**: Your main brand color.
- **Secondary**: Your secondary brand color.
- **Tertiary**: Your third brand color.
- **Default/Black/White**: Standard neutral colors.

When you set a button or background to "Primary", it automatically uses the color you configured in your branding. This keeps your landing pages consistent with your brand.

## Font System

Typography components and buttons support custom Google Fonts. Available fonts include popular choices like Playfair Display, Lora, Montserrat, Raleway, Poppins, Open Sans, and many more. The fonts are loaded automatically when you select them.

## Tips for the Editor

- Start with a **Header** at the top and **Footer** at the bottom for a professional page structure.
- Use **Grid** or **Flex** to arrange components side by side.
- Use **Space** between sections for visual breathing room.
- **DocumentItems** and **DocumentTotal** are essential for quote landing pages — they show the actual quote data.
- **DocumentContent** is essential for prevention document landing pages — it renders the document body.
- Test your page on mobile by resizing the browser window. All components are responsive.
- Use the Marketplace (accessible from the Hub sidebar) to import pre-designed templates instead of building from scratch.

## Troubleshooting

- **Component not showing content**: Make sure the template is linked to a quote or prevention document. Document-specific components (DocumentItems, DocumentTotal, DocumentContent, DocumentNumber) only display data when a real document is connected.
- **Colors look different from branding**: Verify your branding colors in Hub > Configurations > Branding. The editor uses those values directly.
- **Video not playing**: Check that the URL is a valid YouTube, Vimeo, or direct video link. The editor converts standard YouTube/Vimeo URLs to embeddable format automatically.
- **Image not loading**: Ensure the image URL is publicly accessible. Private or local file paths will not work.
- **Page looks different on mobile**: This is normal. The editor components are responsive and automatically adapt layouts for smaller screens (e.g., Grid columns stack, tables become cards).
