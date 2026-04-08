<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_login();
verify_csrf();

if (!isset($_FILES['image'])) {
    json_response(['error' => 'No image uploaded'], 422);
}

$file = $_FILES['image'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    json_response(['error' => 'Upload failed with error code ' . $file['error']], 422);
}

$allowedMimeTypes = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
    'image/svg+xml' => 'svg',
];

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = finfo_file($finfo, $file['tmp_name']) ?: '';
finfo_close($finfo);

if (!isset($allowedMimeTypes[$mime])) {
    json_response(['error' => 'Unsupported image type'], 422);
}

$uploadDir = $config['app']['uploads_dir'];
if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
    json_response(['error' => 'Unable to create upload directory'], 500);
}

$extension = $allowedMimeTypes[$mime];
$filename = uniqid('cms_', true) . '.' . $extension;
$destination = rtrim($uploadDir, '/\\') . DIRECTORY_SEPARATOR . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    json_response(['error' => 'Unable to store uploaded image'], 500);
}

$baseUrl = rtrim((string) $config['app']['base_url'], '/');
$uploadsUrl = trim((string) $config['app']['uploads_url'], '/');
$url = ($baseUrl !== '' ? $baseUrl . '/' : '/') . $uploadsUrl . '/' . $filename;

json_response([
    'url' => $url,
    'filename' => $filename,
]);
