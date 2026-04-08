<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$payload = json_decode(file_get_contents('php://input') ?: '{}', true);
$id = (int) ($payload['id'] ?? 0);
$document = duplicate_page_document($id);

if (!$document) {
    json_response(['error' => 'Unable to duplicate page'], 404);
}

json_response([
    'message' => 'Page duplicated.',
    'document' => $document,
    'pages' => fetch_pages(),
]);
