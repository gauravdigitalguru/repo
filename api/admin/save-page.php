<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_login();
verify_csrf();

$raw = file_get_contents('php://input');
$payload = json_decode($raw ?: '{}', true);

if (!is_array($payload)) {
    json_response(['error' => 'Invalid JSON payload'], 422);
}

try {
    $page = save_page($payload);
    json_response([
        'message' => 'Page saved successfully.',
        'page' => $page,
    ]);
} catch (Throwable $exception) {
    json_response(['error' => $exception->getMessage()], 422);
}
