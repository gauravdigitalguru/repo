<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$payload = json_decode(file_get_contents('php://input') ?: '{}', true);
if (!is_array($payload)) {
    json_response(['error' => 'Invalid payload'], 422);
}

$documentType = (string) ($payload['type'] ?? 'page');
$document = $documentType === 'template'
    ? save_template_document($payload)
    : save_page_document($payload);

json_response([
    'message' => 'Document saved.',
    'document' => $document,
    'pages' => fetch_pages(),
    'templates' => fetch_templates(),
]);
