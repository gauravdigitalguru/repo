<?php

declare(strict_types=1);

function default_page_payload(string $slug = 'home'): array
{
    return [
        'slug' => $slug,
        'title' => ucfirst($slug),
        'seo_title' => ucfirst($slug),
        'seo_description' => '',
        'seo_keywords' => '',
        'canonical_url' => '',
        'og_image' => '',
        'layout' => [],
    ];
}

function get_page_by_slug(string $slug): array
{
    $stmt = db()->prepare('SELECT slug, title, seo_title, seo_description, seo_keywords, canonical_url, og_image, layout_json FROM cms_pages WHERE slug = :slug LIMIT 1');
    $stmt->execute(['slug' => $slug]);
    $page = $stmt->fetch();

    if (!$page) {
        return default_page_payload($slug);
    }

    return [
        'slug' => $page['slug'],
        'title' => $page['title'],
        'seo_title' => $page['seo_title'] ?: $page['title'],
        'seo_description' => $page['seo_description'] ?? '',
        'seo_keywords' => $page['seo_keywords'] ?? '',
        'canonical_url' => $page['canonical_url'] ?? '',
        'og_image' => $page['og_image'] ?? '',
        'layout' => json_decode($page['layout_json'] ?: '[]', true) ?: [],
    ];
}

function get_pages(): array
{
    $stmt = db()->query('SELECT slug, title, updated_at FROM cms_pages ORDER BY slug ASC');
    return $stmt->fetchAll();
}

function save_page(array $payload): array
{
    $slug = sanitize_slug((string) ($payload['slug'] ?? 'home'));
    if ($slug === '') {
        throw new InvalidArgumentException('Slug is required.');
    }

    $title = trim((string) ($payload['title'] ?? ucfirst($slug)));
    $seoTitle = trim((string) ($payload['seo_title'] ?? $title));
    $seoDescription = trim((string) ($payload['seo_description'] ?? ''));
    $seoKeywords = trim((string) ($payload['seo_keywords'] ?? ''));
    $canonicalUrl = trim((string) ($payload['canonical_url'] ?? ''));
    $ogImage = trim((string) ($payload['og_image'] ?? ''));
    $layout = $payload['layout'] ?? [];

    if (!is_array($layout)) {
        throw new InvalidArgumentException('Layout must be a JSON array.');
    }

    $layoutJson = json_encode($layout, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($layoutJson === false) {
        throw new RuntimeException('Unable to encode layout JSON.');
    }

    $sql = <<<SQL
        INSERT INTO cms_pages (slug, title, seo_title, seo_description, seo_keywords, canonical_url, og_image, layout_json)
        VALUES (:slug, :title, :seo_title, :seo_description, :seo_keywords, :canonical_url, :og_image, :layout_json)
        ON DUPLICATE KEY UPDATE
            title = VALUES(title),
            seo_title = VALUES(seo_title),
            seo_description = VALUES(seo_description),
            seo_keywords = VALUES(seo_keywords),
            canonical_url = VALUES(canonical_url),
            og_image = VALUES(og_image),
            layout_json = VALUES(layout_json),
            updated_at = CURRENT_TIMESTAMP
    SQL;

    $stmt = db()->prepare($sql);
    $stmt->execute([
        'slug' => $slug,
        'title' => $title,
        'seo_title' => $seoTitle,
        'seo_description' => $seoDescription,
        'seo_keywords' => $seoKeywords,
        'canonical_url' => $canonicalUrl,
        'og_image' => $ogImage,
        'layout_json' => $layoutJson,
    ]);

    return get_page_by_slug($slug);
}

function sanitize_slug(string $slug): string
{
    $slug = strtolower(trim($slug));
    $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug) ?? '';
    return trim($slug, '-');
}
