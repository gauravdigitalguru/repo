CREATE TABLE IF NOT EXISTS pages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(150) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    is_homepage TINYINT(1) NOT NULL DEFAULT 0,
    content_json LONGTEXT NOT NULL,
    settings_json LONGTEXT NOT NULL,
    template_assignment_json LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS templates (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    slug VARCHAR(150) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    content_json LONGTEXT NOT NULL,
    settings_json LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS menus (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(100) NOT NULL,
    items_json LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(20) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT UNSIGNED NOT NULL DEFAULT 0,
    alt VARCHAR(255) NULL,
    title VARCHAR(255) NULL,
    caption TEXT NULL,
    url VARCHAR(255) NOT NULL,
    meta_json LONGTEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value LONGTEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS posts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    post_type VARCHAR(100) NOT NULL DEFAULT 'post',
    slug VARCHAR(150) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    excerpt TEXT NULL,
    content LONGTEXT NULL,
    featured_image VARCHAR(255) NULL,
    author_name VARCHAR(255) NULL,
    categories_json LONGTEXT NULL,
    published_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS form_submissions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    page_slug VARCHAR(150) NOT NULL,
    form_name VARCHAR(150) NOT NULL,
    submission_json LONGTEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO settings (setting_key, setting_value) VALUES
('site_name', 'Visual Builder Site'),
('site_tagline', 'A professional cPanel-friendly visual website builder'),
('site_logo', ''),
('favicon', ''),
('custom_css', ''),
('custom_js', ''),
('homepage_slug', 'home')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

INSERT INTO menus (name, location, items_json) VALUES
('Primary Menu', 'header', '[{"label":"Home","url":"/page/home","children":[]},{"label":"Blog","url":"/page/blog","children":[]}]')
ON DUPLICATE KEY UPDATE name = VALUES(name), items_json = VALUES(items_json);

INSERT INTO posts (post_type, slug, title, excerpt, content, featured_image, author_name, categories_json, published_at)
VALUES
('post', 'hello-builder', 'Hello Builder', 'A starter post for dynamic widgets.', 'This is a starter post used by the post grid and archive widgets.', '', 'Admin', '["General"]', NOW())
ON DUPLICATE KEY UPDATE title = VALUES(title), excerpt = VALUES(excerpt), content = VALUES(content), author_name = VALUES(author_name), categories_json = VALUES(categories_json), published_at = VALUES(published_at);

INSERT INTO templates (slug, title, template_type, status, content_json, settings_json)
VALUES
(
    'header-default',
    'Default Header',
    'header',
    'published',
    '[{"id":"header-container","type":"container","content":{},"styles":{"desktop":{"display":"flex","justifyContent":"space-between","alignItems":"center","padding":"18px 24px","margin":"0 0 24px 0","backgroundColor":"#0f172a","color":"#ffffff","borderRadius":"20px"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[{"id":"header-logo","type":"site-title","content":{},"styles":{"desktop":{"color":"#ffffff","fontSize":"28px","fontWeight":"700","margin":"0"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[]},{"id":"header-menu","type":"menu","content":{"menuId":1,"orientation":"horizontal"},"styles":{"desktop":{"color":"#ffffff","margin":"0"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[]}]}]',
    '{"seo":{"title":"","description":"","canonical":"","og_image":"","twitter_card":"summary_large_image"},"customCss":"","customJs":""}'
),
(
    'footer-default',
    'Default Footer',
    'footer',
    'published',
    '[{"id":"footer-container","type":"container","content":{},"styles":{"desktop":{"display":"flex","flexDirection":"column","gap":"12px","padding":"24px","margin":"24px 0 0 0","backgroundColor":"#111827","color":"#ffffff","borderRadius":"20px"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[{"id":"footer-title","type":"site-title","content":{},"styles":{"desktop":{"color":"#ffffff","fontSize":"24px","fontWeight":"700","margin":"0"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[]},{"id":"footer-tagline","type":"site-tagline","content":{},"styles":{"desktop":{"color":"#cbd5e1","fontSize":"14px","margin":"0"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[]}]}]',
    '{"seo":{"title":"","description":"","canonical":"","og_image":"","twitter_card":"summary_large_image"},"customCss":"","customJs":""}'
)
ON DUPLICATE KEY UPDATE title = VALUES(title), status = VALUES(status), content_json = VALUES(content_json), settings_json = VALUES(settings_json);

INSERT INTO pages (slug, title, status, is_homepage, content_json, settings_json, template_assignment_json)
VALUES
(
    'home',
    'Home',
    'published',
    1,
    '[{"id":"hero-section","type":"section","content":{},"styles":{"desktop":{"display":"flex","flexDirection":"column","gap":"20px","padding":"80px 32px","margin":"0 0 24px 0","backgroundColor":"#eff6ff","borderRadius":"28px","textAlign":"center"}},"advanced":{"cssClass":"","anchorId":"hero","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[{"id":"hero-heading","type":"heading","content":{"text":"Build complete websites visually on cPanel","level":1,"link":""},"styles":{"desktop":{"fontSize":"54px","fontWeight":"800","margin":"0","color":"#0f172a"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[]},{"id":"hero-copy","type":"paragraph","content":{"html":"<p>Create pages, templates, menus, forms, media, and dynamic layouts with a single PHP + MySQL visual builder.</p>"},"styles":{"desktop":{"fontSize":"18px","lineHeight":"1.7","color":"#334155","margin":"0 auto","width":"min(100%, 760px)"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[]},{"id":"hero-buttons","type":"columns","content":{"columns":2},"styles":{"desktop":{"display":"flex","gap":"16px","margin":"0 auto","width":"min(100%, 420px)"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[{"id":"hero-button-col-1","type":"column","content":{},"styles":{"desktop":{"display":"flex","width":"50%","padding":"0","margin":"0"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[{"id":"hero-button-primary","type":"button","content":{"text":"Open admin","link":"/admin/login.php","icon":""},"styles":{"desktop":{"backgroundColor":"#2563eb","color":"#ffffff","padding":"14px 18px","borderRadius":"12px","display":"inline-flex","justifyContent":"center","width":"100%"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[]}]},{"id":"hero-button-col-2","type":"column","content":{},"styles":{"desktop":{"display":"flex","width":"50%","padding":"0","margin":"0"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[{"id":"hero-button-secondary","type":"button","content":{"text":"Read docs","link":"#documentation","icon":""},"styles":{"desktop":{"backgroundColor":"#0f172a","color":"#ffffff","padding":"14px 18px","borderRadius":"12px","display":"inline-flex","justifyContent":"center","width":"100%"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[]}]}]},{"id":"feature-grid","type":"post-grid","content":{"limit":3},"styles":{"desktop":{"margin":"0 0 24px 0"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[]},{"id":"contact-widget","type":"contact-form","content":{"formName":"homepage_contact","submitText":"Send enquiry","fields":[{"type":"text","name":"name","label":"Name"},{"type":"email","name":"email","label":"Email"},{"type":"textarea","name":"message","label":"Message"}]},"styles":{"desktop":{"padding":"24px","backgroundColor":"#ffffff","border":"1px solid #dbe2ea","borderRadius":"20px","margin":"0"}},"advanced":{"cssClass":"","anchorId":"documentation","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[]}]',
    '{"seo":{"title":"Visual Builder Site","description":"A professional PHP + MySQL visual website builder for cPanel hosting.","canonical":"","og_image":"","twitter_card":"summary_large_image"},"customCss":"","customJs":""}',
    '{"header":"header-default","footer":"footer-default"}'
),
(
    'blog',
    'Blog',
    'published',
    0,
    '[{"id":"blog-heading","type":"heading","content":{"text":"Blog","level":1,"link":""},"styles":{"desktop":{"fontSize":"48px","fontWeight":"800","margin":"0 0 20px 0"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[]},{"id":"blog-archive","type":"archive-list","content":{},"styles":{"desktop":{"padding":"24px","backgroundColor":"#ffffff","border":"1px solid #e2e8f0","borderRadius":"20px"}},"advanced":{"cssClass":"","anchorId":"","animation":"","customCss":"","hideDesktop":false,"hideTablet":false,"hideMobile":false},"children":[]}]',
    '{"seo":{"title":"Blog","description":"Dynamic archive page.","canonical":"","og_image":"","twitter_card":"summary_large_image"},"customCss":"","customJs":""}',
    '{"header":"header-default","footer":"footer-default"}'
)
ON DUPLICATE KEY UPDATE title = VALUES(title), status = VALUES(status), is_homepage = VALUES(is_homepage), content_json = VALUES(content_json), settings_json = VALUES(settings_json), template_assignment_json = VALUES(template_assignment_json);
