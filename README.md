# Visual Builder Pro

A cPanel-friendly website builder written in PHP, MySQL, and vanilla JavaScript.

It includes:

- a professional visual editor with nested drag-drop canvas
- page and template editing
- responsive viewport modes
- undo/redo history
- JSON layout storage
- theme builder slots for headers and footers
- media uploads to `/uploads/YYYY/MM`
- menu management
- dynamic widgets backed by posts/settings/menus
- page-level SEO and custom CSS/JS
- JSON export/import for template bundles

## Requirements

- PHP 8.0 or newer
- PDO MySQL enabled
- MySQL 5.7+ or MariaDB compatible
- Apache with `mod_rewrite`
- writable `uploads/` directory

## Main folders

- `admin/` - protected builder UI
- `api/admin/` - authenticated JSON APIs for the editor
- `api/form-submit.php` - public form submission endpoint
- `assets/css/` - builder and frontend styles
- `assets/js/` - builder and frontend scripts
- `includes/` - bootstrap, repositories, helpers, renderer
- `templates/` - reserved for template-related assets/exports
- `uploads/` - uploaded media files organized by year/month

## cPanel setup

1. Upload the full `app/` directory into your cPanel web root or a subfolder.
2. Create a MySQL database and user in cPanel.
3. Assign the user to the database with full privileges.
4. Edit [`config.php`](C:\Gaurav Main Code Website\app\config.php):
   - `db.host`
   - `db.port`
   - `db.database`
   - `db.username`
   - `db.password`
   - `auth.username`
   - `auth.password`
   - `app.base_url`
   - `mail.to` if you want form submissions emailed
5. Import [`database.sql`](C:\Gaurav Main Code Website\app\database.sql) using phpMyAdmin.
6. Ensure the `uploads/` directory is writable by PHP.
   - start with `755`
   - use `775` if your host requires group write
7. Visit the public site:
   - `https://example.com/your-folder/`
   - `https://example.com/your-folder/page/home`
8. Visit the builder:
   - `https://example.com/your-folder/admin/login.php`

## Builder workflow

### Pages and templates

- Use the document type selector in the top toolbar to switch between `page` and `template`.
- Templates support `header`, `footer`, `single-post`, `archive`, and `404` types.
- Pages can assign header/footer templates by slug from the document settings panel.

### Widget library

The left sidebar groups widgets into categories:

- Basic
- Media
- Layout
- Forms
- Dynamic
- Advanced
- Examples

Drag widgets from the library onto the canvas. Containers and layout widgets support nested drop zones.
Layout widgets now ship with default container modes so you can start building immediately:

- `section` defaults to `flex-column`
- `container` defaults to `flex-column`
- `inner-section` defaults to `flex-column`
- `columns` defaults to `flex-row`
- `column` defaults to `flex-column`

In the `Content` tab, layout widgets can switch between:

- `flex-column`
- `flex-row`
- `grid`

When `grid` is selected, use the `Grid columns` field to define the track template, for example:

- `repeat(2, minmax(0, 1fr))`
- `repeat(3, minmax(0, 1fr))`
- `240px 1fr`

Empty layout widgets expose an inner drop surface with a visible placeholder so you can drag widgets directly into sections, containers, inner sections, popups, and individual columns.

### Starter examples

The `Examples` group in the widget library includes ready-made presets you can drag straight into the canvas:

- `Hero section`
- `Feature section`
- `2-column grid`
- `3-column grid`
- `Complete form`

These are real layout trees, not screenshots or placeholders, so once dropped you can edit every nested heading, paragraph, button, container, and form field from the normal inspector.

#### Grid examples

The grid presets use `container` widgets with:

- `layoutMode = grid`
- `gridColumns = repeat(2, minmax(0, 1fr))` for the 2-column example
- `gridColumns = repeat(3, minmax(0, 1fr))` for the 3-column example

They are meant as starter patterns for:

- feature cards
- services lists
- portfolio tiles
- pricing summaries

#### Section examples

The section presets include:

- a hero section with heading, paragraph, and CTA row
- a feature section with intro copy and a nested card grid

They are useful when you want a fast starting point for common landing-page structures without assembling every block manually.

#### Form example

The `Complete form` example includes all supported field types in one preset:

- text
- email
- number
- date
- select
- checkbox group
- radio group
- file upload
- textarea

The public form endpoint accepts normal field values and multipart file uploads, stores submissions in the database, and saves uploaded files into the media library path under `/uploads/YYYY/MM`.

### Inspector

The right sidebar has three tabs:

- `Content`
- `Style`
- `Advanced`

The style tab edits the currently active responsive breakpoint:

- Desktop
- Tablet
- Mobile

### Toolbar

The top toolbar includes:

- document selector
- new / duplicate / delete
- set homepage
- icon-based undo / redo controls with tooltips
- icon-based device switcher with desktop / tablet / mobile preview widths
- editable page title
- light / dark theme toggle
- grid toggle
- left / right sidebar collapse
- fullscreen toggle
- preview
- import / export bundle
- save draft to console
- publish to the CMS

Keyboard shortcuts:

- `Ctrl+S` save
- `Ctrl+Z` undo
- `Ctrl+Y` redo
- `Ctrl+D` duplicate selected element
- `Ctrl+C` copy selected element
- `Ctrl+V` paste copied element
- `Delete` remove selected element

### Canvas shell

The builder now uses an Elementor-style editor shell with:

- left widget panel
- centered canvas with device widths for desktop, tablet (`768px`), and mobile (`375px`)
- right property panel with `Content`, `Style`, and `Advanced` tabs
- footer bar with zoom slider, navigator summary, and status text
- custom right-click context menu on widgets for duplicate, delete, copy, paste, and save-as-template logging

## Data model

The SQL schema creates:

- `pages`
- `templates`
- `menus`
- `media`
- `settings`
- `posts`
- `form_submissions`

### Page JSON

Each page/template stores:

- `layout`
- `settings`
- `template_assignment`

Every node in the layout tree contains:

- `id`
- `type`
- `content`
- `styles.desktop`
- `styles.tablet`
- `styles.mobile`
- `advanced`
- optional `children`

## Media library

Uploads are handled by [`api/admin/media-upload.php`](C:\Gaurav Main Code Website\app\api\admin\media-upload.php).

Files are stored in:

- `/uploads/YYYY/MM/filename.ext`

The builder stores media metadata in the `media` table, including:

- original filename
- file type
- mime type
- file size
- alt
- title
- caption
- URL

## Menus

Menus are stored as JSON in the `menus` table and can be attached to the `menu` widget. The starter SQL includes a default primary menu for the header template.

## Theme builder

The frontend renderer in [`index.php`](C:\Gaurav Main Code Website\app\index.php) automatically loads:

- the assigned header template
- the page content
- the assigned footer template

If a page does not define a specific header/footer slug, the renderer falls back to the latest published template for that slot.

## Frontend rendering

The renderer uses:

- [`includes/render.php`](C:\Gaurav Main Code Website\app\includes\render.php) for widget output
- [`assets/js/frontend.js`](C:\Gaurav Main Code Website\app\assets\js\frontend.js) for tabs, accordion, popups, counters, countdowns, forms, and menu toggles
- [`assets/css/public.css`](C:\Gaurav Main Code Website\app\assets\css\public.css) for frontend baseline styling

Custom CSS and JS are injected from:

- global settings
- page settings
- code widgets inside the layout tree

## Import / export bundles

Use the toolbar buttons to:

- export all pages/templates/menus/settings as JSON
- import a JSON bundle back into the system

The import endpoint is:

- [`api/admin/import-bundle.php`](C:\Gaurav Main Code Website\app\api\admin\import-bundle.php)

The export endpoint is:

- [`api/admin/export-bundle.php`](C:\Gaurav Main Code Website\app\api\admin\export-bundle.php)

## Security notes

- admin routes are session-protected
- state-changing admin APIs require a CSRF token
- `config.php`, `includes/`, and `storage/` are protected by `.htaccess`
- uploaded HTML/JS widgets are intended for trusted admins only

## Extending the builder

To add a new widget:

1. Register it in [`assets/js/builder.js`](C:\Gaurav Main Code Website\app\assets\js\builder.js)
2. Add frontend rendering in [`includes/render.php`](C:\Gaurav Main Code Website\app\includes\render.php)
3. Add any frontend behavior in [`assets/js/frontend.js`](C:\Gaurav Main Code Website\app\assets\js\frontend.js)
4. Optionally add CSS in [`assets/css/public.css`](C:\Gaurav Main Code Website\app\assets\css\public.css)

## Important note

This is a deployable builder foundation designed for standard cPanel hosting and professional custom sites. It supports a wide builder surface area, but if you want enterprise-grade workflows like granular roles, revisions, scheduled publishing, visual diffing, or full media transformations, the next step is to keep this architecture and expand the admin/data model further.
