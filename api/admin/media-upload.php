<?php

declare(strict_types=1);

require dirname(__DIR__, 2) . '/includes/bootstrap.php';
require_login();
verify_csrf();

if (!isset($_FILES['file'])) {
    json_response(['error' => 'No file uploaded'], 422);
}

$file = $_FILES['file'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    json_response(['error' => 'Upload error code ' . $file['error']], 422);
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mime = (string) finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mime, allowed_upload_mime_types(), true)) {
    json_response(['error' => 'Unsupported file type'], 422);
}

[$targetDirectory, $relativeFolder] = ensure_upload_path();
$extension = pathinfo($file['name'], PATHINFO_EXTENSION);
$filename = uniqid('asset_', true) . ($extension ? '.' . strtolower($extension) : '');
$destination = $targetDirectory . DIRECTORY_SEPARATOR . $filename;

if (!move_uploaded_file($file['tmp_name'], $destination)) {
    json_response(['error' => 'Unable to move uploaded file'], 500);
}

$relativePath = trim($relativeFolder . '/' . $filename, '/');
$url = uploads_url($relativePath);

$media = create_media_record([
    'filename' => $relativePath,
    'original_name' => $file['name'],
    'file_type' => media_kind_from_mime($mime),
    'mime_type' => $mime,
    'file_size' => (int) $file['size'],
    'url' => $url,
    'alt' => trim((string) ($_POST['alt'] ?? '')),
    'title' => trim((string) ($_POST['title'] ?? pathinfo($file['name'], PATHINFO_FILENAME))),
    'caption' => trim((string) ($_POST['caption'] ?? '')),
    'meta_json' => [],
]);

json_response([
    'message' => 'Media uploaded.',
    'media' => $media,
    'items' => fetch_media(),
]);
