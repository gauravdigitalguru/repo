<?php

return [
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'database' => 'your_database_name',
        'username' => 'your_database_user',
        'password' => 'your_database_password',
        'charset' => 'utf8mb4',
    ],
    'auth' => [
        'username' => 'admin',
        'password' => 'ChangeThisStrongPassword123!',
    ],
    'app' => [
        'name' => 'Custom Visual CMS',
        'base_url' => '',
        'uploads_dir' => __DIR__ . '/uploads',
        'uploads_url' => 'uploads',
    ],
    'mail' => [
        'to' => '',
    ],
];
