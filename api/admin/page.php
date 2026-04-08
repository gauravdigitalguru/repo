<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_login();

$slug = sanitize_slug((string) ($_GET['slug'] ?? 'home'));
json_response([
    'page' => get_page_by_slug($slug === '' ? 'home' : $slug),
]);
