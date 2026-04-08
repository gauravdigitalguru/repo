<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

$contentType = (string) ($_SERVER['CONTENT_TYPE'] ?? '');
$payload = [];
$submission = [];

if (stripos($contentType, 'application/json') !== false) {
    $payload = json_decode(file_get_contents('php://input') ?: '{}', true);
    if (!is_array($payload)) {
        json_response(['error' => 'Invalid form submission'], 422);
    }
    $submission = is_array($payload['submission'] ?? null) ? $payload['submission'] : [];
} else {
    $payload = $_POST;
    $submission = $_POST;
    unset($submission['page_slug'], $submission['form_name']);

    foreach ($_FILES as $fieldName => $file) {
        if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            continue;
        }

        $tmpName = (string) ($file['tmp_name'] ?? '');
        if ($tmpName === '' || !is_uploaded_file($tmpName)) {
            continue;
        }

        $mimeType = mime_content_type($tmpName) ?: 'application/octet-stream';
        if (!in_array($mimeType, allowed_upload_mime_types(), true)) {
            continue;
        }

        [$absoluteDir, $relativeDir] = ensure_upload_path();
        $originalName = (string) ($file['name'] ?? 'upload');
        $sanitizedBase = preg_replace('/[^a-zA-Z0-9_-]+/', '-', pathinfo($originalName, PATHINFO_FILENAME)) ?: 'upload';
        $extension = strtolower((string) pathinfo($originalName, PATHINFO_EXTENSION));
        $filename = $sanitizedBase . '-' . time() . ($extension !== '' ? '.' . $extension : '');
        $absolutePath = $absoluteDir . DIRECTORY_SEPARATOR . $filename;

        if (!move_uploaded_file($tmpName, $absolutePath)) {
            continue;
        }

        $relativePath = trim($relativeDir . '/' . $filename, '/');
        $url = uploads_url($relativePath);
        create_media_record([
            'filename' => $filename,
            'original_name' => $originalName,
            'file_type' => media_kind_from_mime($mimeType),
            'mime_type' => $mimeType,
            'file_size' => (int) ($file['size'] ?? 0),
            'alt' => '',
            'title' => pathinfo($originalName, PATHINFO_FILENAME),
            'caption' => '',
            'url' => $url,
            'meta_json' => ['source' => 'form-upload', 'field' => $fieldName],
        ]);

        $submission[$fieldName] = [
            'original_name' => $originalName,
            'url' => $url,
            'mime_type' => $mimeType,
            'file_size' => (int) ($file['size'] ?? 0),
        ];
    }
}

$pageSlug = sanitize_slug((string) ($payload['page_slug'] ?? 'home')) ?: 'home';
$formName = trim((string) ($payload['form_name'] ?? 'contact_form'));

save_form_submission([
    'page_slug' => $pageSlug,
    'form_name' => $formName,
    'submission' => $submission,
]);

$configData = require dirname(__DIR__) . '/config.php';
$recipient = $configData['mail']['to'] ?? '';
if ($recipient !== '') {
    $subject = '[' . ($configData['app']['name'] ?? 'Visual Builder') . '] Form submission: ' . $formName;
    $message = "Page: {$pageSlug}\nForm: {$formName}\n\n" . print_r($submission, true);
    @mail($recipient, $subject, $message);
}

json_response([
    'message' => 'Form submitted successfully.',
]);
