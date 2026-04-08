<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$payload = json_decode(file_get_contents('php://input') ?: '{}', true);
$id = (int) ($payload['id'] ?? 0);
if ($id <= 0) {
    json_response(['error' => 'Invalid page id'], 422);
}

delete_page_document($id);

json_response([
    'message' => 'Page deleted.',
    'pages' => fetch_pages(),
]);
