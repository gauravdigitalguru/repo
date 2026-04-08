<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$payload = json_decode(file_get_contents('php://input') ?: '{}', true);
$id = (int) ($payload['id'] ?? 0);
if ($id <= 0) {
    json_response(['error' => 'Invalid media id'], 422);
}

delete_media_record($id);

json_response([
    'message' => 'Media deleted.',
    'media' => fetch_media(),
]);
