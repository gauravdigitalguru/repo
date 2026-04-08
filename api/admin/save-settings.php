<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$payload = json_decode(file_get_contents('php://input') ?: '{}', true);
if (!is_array($payload)) {
    json_response(['error' => 'Invalid settings payload'], 422);
}

json_response([
    'message' => 'Settings saved.',
    'settings' => save_settings($payload),
]);
