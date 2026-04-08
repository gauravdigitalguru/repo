<?php

declare(strict_types=1);

function app_base_url(): string
{
    global $config;
    return rtrim((string) ($config['app']['base_url'] ?? ''), '/');
}

function uploads_dir(): string
{
    global $config;
    return (string) $config['app']['uploads_dir'];
}

function uploads_url(string $path = ''): string
{
    global $config;
    $base = app_base_url();
    $uploadsPath = trim((string) ($config['app']['uploads_url'] ?? 'uploads'), '/');
    $suffix = trim($path, '/');

    return ($base !== '' ? $base : '') . '/' . $uploadsPath . ($suffix !== '' ? '/' . $suffix : '');
}

function ensure_upload_path(): array
{
    $relative = date('Y') . '/' . date('m');
    $absolute = rtrim(uploads_dir(), DIRECTORY_SEPARATOR) . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relative);

    if (!is_dir($absolute) && !mkdir($absolute, 0755, true) && !is_dir($absolute)) {
        throw new RuntimeException('Unable to create upload directory.');
    }

    return [$absolute, $relative];
}

function media_kind_from_mime(string $mime): string
{
    if (str_starts_with($mime, 'image/')) {
        return 'image';
    }
    if (str_starts_with($mime, 'video/')) {
        return 'video';
    }
    if (str_starts_with($mime, 'audio/')) {
        return 'audio';
    }
    return 'file';
}

function safe_html(string $html): string
{
    $allowed = '<a><abbr><b><blockquote><br><code><div><em><h1><h2><h3><h4><h5><h6><hr><i><img><li><ol><p><pre><section><span><strong><sub><sup><table><tbody><td><th><thead><tr><u><ul><video><audio><source><iframe>';
    return strip_tags($html, $allowed);
}

function allowed_upload_mime_types(): array
{
    return [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'video/mp4',
        'video/webm',
        'audio/mpeg',
        'audio/mp3',
        'audio/wav',
        'application/pdf',
        'application/zip',
        'text/plain',
    ];
}

function asset_version(string $absolutePath): string
{
    if (!is_file($absolutePath)) {
        return (string) time();
    }

    $mtime = filemtime($absolutePath);
    return $mtime !== false ? (string) $mtime : (string) time();
}
