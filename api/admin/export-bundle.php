<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_login();

$bundle = [
    'exported_at' => date(DATE_ATOM),
    'pages' => fetch_pages(),
    'templates' => fetch_templates(),
    'menus' => fetch_menus(),
    'settings' => fetch_settings(),
];

header('Content-Type: application/json; charset=utf-8');
header('Content-Disposition: attachment; filename="builder-export-' . date('Ymd-His') . '.json"');
echo json_encode($bundle, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
exit;
