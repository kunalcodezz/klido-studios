# Klido Studio — Editor & Administrator Handbook

Welcome to **Klido Studio**, the visual CMS and website operations console for `klido.in`.

---

## 1. Roles & Permissions

| Role | What You Can Do |
| :--- | :--- |
| **VIEWER** | View pages, live previews, content collections, media library, and activity logs. Cannot modify content. |
| **EDITOR** | Edit page drafts in the Visual Builder, upload media, edit Services, Projects, Brands, Testimonials, and Navigation, and share expiring preview links. |
| **SUPER_ADMIN** | Everything an `EDITOR` can do, plus **Publish** revisions live, **Restore** historical revisions, **Delete** unused media assets, edit global **Design System** tokens, and manage **Users & Roles**. |

---

## 2. Managing & Creating Pages

1. Go to **Pages** in the sidebar.
2. Click **+ New Page** to create a landing or standard page (choose a clean slug such as `/growth-sprint`).
3. Click **Open Visual Builder** on any page row to launch the full-screen 3-panel editor, or click **SEO & Settings** to configure title, meta description, OpenGraph card image, canonical URL, and search indexing flags.

---

## 3. Using the Three-Panel Visual Page Builder

### Left Panel — Layers & Block Library
- Inspect every section and nested block (`container`, `columns`, `grid`) in hierarchy order.
- Drag blocks up/down to reorder sections, toggle **Visibility** (Eye icon) to temporarily hide a section without deleting it, or toggle **Lock** to prevent accidental edits.
- Switch to the **Add Block** tab to insert Hero, Text, Media, Pricing Plans, Brands Showcase, Case Studies, Process Steps, Interactive Scopes, Testimonials, FAQ, Contact Forms, or CTA blocks.

### Center Panel — Responsive Live Canvas
- Use the toolbar viewport toggles (**Desktop**, **Tablet**, **Mobile**) to preview and tune layout spacing per screen size.
- Click any block directly on the canvas to select and inspect it.
- Use **Undo (`Ctrl/Cmd + Z`)** and **Redo (`Ctrl/Cmd + Shift + Z`)** freely — the builder preserves up to 50 history steps.
- Draft changes autosave automatically after 1.5 seconds of inactivity (you can also click **Save Draft** at any time).

### Right Panel — Property & Style Inspector
- **Content**: Edit headlines, labels, buttons, lists, and formatted **Tiptap Rich Text** (headings, bold/italic, links, lists). Images are selected via the **Media Picker** modal so alt text and asset tracking remain intact.
- **Styles**: Customize padding, margins, background colors, typography sizes, and per-breakpoint overrides (`base`, `tablet`, `mobile`).

---

## 4. Drafts, Shareable Previews, Publishing & Revisions

- **Draft Safety**: Saving a draft never changes the live `klido.in` website.
- **Share Preview**: Click **Share Preview** in the Builder toolbar to create a time-limited preview URL (1 hour, 24 hours, or 7 days). Anyone with that link can view the unpublished draft securely; search engines are blocked from indexing previews (`noindex, nofollow`).
- **Publishing (`SUPER_ADMIN`)**: Click **Publish**, review the automatic structural diff summary (added, modified, reordered, removed sections), add a short release note, and confirm.
- **Revisions & Rollback**: Visit **Revisions** in the sidebar to inspect historical versions of any page and click **Restore** to roll back cleanly.

---

## 5. Content Collections, Media & Global Settings

- **Services, Projects, Brands, Testimonials**: Changes saved in these managers automatically update dynamic showcase blocks across your site without touching page layouts.
- **Media Library**:
  - Accepts PNG, JPG, WebP, AVIF, GIF, and MP4/WebM up to **10 MB** per file (SVG uploads are disabled for security).
  - Always add descriptive **Alt Text** for accessibility and SEO.
  - Before deleting an asset (`SUPER_ADMIN` only), Klido Studio automatically checks whether any page or collection item still references it.
- **Navigation, Footer & Redirects**: Update header/footer links in **Navigation**, company contact details in **Website Settings**, and URL redirects (`301`/`302`) when retiring old paths.
- **SEO & Sitemap**: Configure global site metadata, `robots.txt`, check per-page SEO completeness, and download/copy a clean `sitemap.xml` free of hash URLs.
