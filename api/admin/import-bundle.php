<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_login();
verify_csrf();

if (!isset($_FILES['bundle'])) {
    json_response(['error' => 'No bundle uploaded'], 422);
}

$raw = file_get_contents($_FILES['bundle']['tmp_name'] ?: '');
$bundle = json_decode($raw ?: '{}', true);
if (!is_array($bundle)) {
    json_response(['error' => 'Invalid JSON bundle'], 422);
}

$imported = import_template_bundle($bundle);

json_response([
    'message' => 'Bundle imported.',
    'imported' => $imported,
    'pages' => fetch_pages(),
    'templates' => fetch_templates(),
    'menus' => fetch_menus(),
    'settings' => fetch_settings(),
]);
