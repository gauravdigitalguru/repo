<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$payload = json_decode(file_get_contents('php://input') ?: '{}', true);
if (!is_array($payload)) {
    json_response(['error' => 'Invalid menu payload'], 422);
}

save_menu($payload);

json_response([
    'message' => 'Menu saved.',
    'menus' => fetch_menus(),
]);
