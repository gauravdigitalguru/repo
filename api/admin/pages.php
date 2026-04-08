<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_login();

json_response([
    'pages' => get_pages(),
    'csrf_token' => $_SESSION['csrf_token'],
]);
