<?php

declare(strict_types=1);

require __DIR__ . '/includes/bootstrap.php';
require __DIR__ . '/includes/render.php';

$publicCssVersion = asset_version(__DIR__ . '/assets/css/public.css');
$frontendJsVersion = asset_version(__DIR__ . '/assets/js/frontend.js');

$settings = fetch_settings();
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$slug = sanitize_slug((string) ($_GET['page'] ?? ''));

if ($slug === '' && preg_match('#/page/([a-z0-9-]+)$#i', $requestUri, $matches)) {
    $slug = sanitize_slug($matches[1]);
}

if ($slug === '' && preg_match('#/post/([a-z0-9-]+)$#i', $requestUri, $matches)) {
    $slug = sanitize_slug($matches[1]);
}

$slug = $slug !== '' ? $slug : sanitize_slug((string) ($settings['homepage_slug'] ?? 'home'));
$page = fetch_page_by_slug($slug === '' ? 'home' : $slug);
$context = [
    'document' => $page,
    'menus' => fetch_menus(),
    'posts' => fetch_posts(),
    'site_settings' => $settings,
];
$GLOBALS['vb_page_slug'] = $page['slug'];

$seoTitle = $page['settings']['seo']['title'] !== '' ? $page['settings']['seo']['title'] : $page['title'];
$canonical = $page['settings']['seo']['canonical'] ?? '';
$responsiveCss = build_responsive_css($page['layout']);
$documentCss = collect_custom_code($page['layout'], 'css');
$documentJs = collect_custom_code($page['layout'], 'javascript');
$headerTemplate = fetch_template_for_slot('header', $page['template_assignment']['header'] ?? null);
$footerTemplate = fetch_template_for_slot('footer', $page['template_assignment']['footer'] ?? null);
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($seoTitle, ENT_QUOTES, 'UTF-8') ?></title>
    <meta name="description" content="<?= htmlspecialchars((string) ($page['settings']['seo']['description'] ?? ''), ENT_QUOTES, 'UTF-8') ?>">
    <?php if ($canonical !== ''): ?>
        <link rel="canonical" href="<?= htmlspecialchars($canonical, ENT_QUOTES, 'UTF-8') ?>">
    <?php endif; ?>
    <meta property="og:title" content="<?= htmlspecialchars($seoTitle, ENT_QUOTES, 'UTF-8') ?>">
    <meta property="og:description" content="<?= htmlspecialchars((string) ($page['settings']['seo']['description'] ?? ''), ENT_QUOTES, 'UTF-8') ?>">
    <?php if (($page['settings']['seo']['og_image'] ?? '') !== ''): ?>
        <meta property="og:image" content="<?= htmlspecialchars((string) $page['settings']['seo']['og_image'], ENT_QUOTES, 'UTF-8') ?>">
    <?php endif; ?>
    <meta name="twitter:card" content="<?= htmlspecialchars((string) ($page['settings']['seo']['twitter_card'] ?? 'summary_large_image'), ENT_QUOTES, 'UTF-8') ?>">
    <link rel="stylesheet" href="assets/css/public.css?v=<?= htmlspecialchars($publicCssVersion, ENT_QUOTES, 'UTF-8') ?>">
    <?php if (($settings['favicon'] ?? '') !== ''): ?>
        <link rel="icon" href="<?= htmlspecialchars((string) $settings['favicon'], ENT_QUOTES, 'UTF-8') ?>">
    <?php endif; ?>
    <style>
        <?= $responsiveCss ?>
        <?= (string) ($settings['custom_css'] ?? '') ?>
        <?= (string) ($page['settings']['customCss'] ?? '') ?>
        <?= $documentCss ?>
    </style>
</head>
<body>
    <?php if ($headerTemplate): ?>
        <header class="vb-template vb-template--header">
            <?= render_document_tree($headerTemplate['layout'], $context) ?>
        </header>
    <?php endif; ?>
    <main class="public-shell" data-document-slug="<?= htmlspecialchars($page['slug'], ENT_QUOTES, 'UTF-8') ?>">
        <?= render_document_tree($page['layout'], $context) ?>
    </main>
    <?php if ($footerTemplate): ?>
        <footer class="vb-template vb-template--footer">
            <?= render_document_tree($footerTemplate['layout'], $context) ?>
        </footer>
    <?php endif; ?>
    <script>
        window.VB_FRONTEND = {
            formEndpoint: 'api/form-submit.php'
        };
    </script>
    <script src="assets/js/frontend.js?v=<?= htmlspecialchars($frontendJsVersion, ENT_QUOTES, 'UTF-8') ?>"></script>
    <script><?= (string) ($settings['custom_js'] ?? '') ?></script>
    <script><?= (string) ($page['settings']['customJs'] ?? '') ?></script>
    <script><?= $documentJs ?></script>
</body>
</html>
