<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_login();

$documentType = (string) ($_GET['document_type'] ?? 'page');
$slug = sanitize_slug((string) ($_GET['slug'] ?? 'home'));

$document = $documentType === 'template'
    ? fetch_template_by_slug($slug ?: 'header-default')
    : fetch_page_by_slug($slug ?: 'home');

json_response([
    'csrf_token' => $_SESSION['csrf_token'],
    'document' => $document,
    'pages' => fetch_pages(),
    'templates' => fetch_templates(),
    'menus' => fetch_menus(),
    'media' => fetch_media(),
    'settings' => fetch_settings(),
    'posts' => fetch_posts(),
]);
