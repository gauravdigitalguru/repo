<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$payload = json_decode(file_get_contents('php://input') ?: '{}', true);
$id = (int) ($payload['id'] ?? 0);
$page = set_homepage($id);

if (!$page) {
    json_response(['error' => 'Unable to set homepage'], 404);
}

save_settings(['homepage_slug' => $page['slug']]);

json_response([
    'message' => 'Homepage updated.',
    'page' => $page,
    'pages' => fetch_pages(),
    'settings' => fetch_settings(),
]);
