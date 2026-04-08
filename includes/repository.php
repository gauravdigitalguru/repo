<?php

declare(strict_types=1);

function db_fetch_all(string $sql, array $params = []): array
{
    $statement = db()->prepare($sql);
    $statement->execute($params);
    return $statement->fetchAll();
}

function db_fetch_one(string $sql, array $params = []): ?array
{
    $statement = db()->prepare($sql);
    $statement->execute($params);
    $row = $statement->fetch();
    return $row ?: null;
}

function sanitize_slug(string $slug): string
{
    $slug = strtolower(trim($slug));
    $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug) ?? '';
    return trim($slug, '-');
}

function json_decode_array(?string $json, array $fallback = []): array
{
    if (!$json) {
        return $fallback;
    }

    $decoded = json_decode($json, true);
    return is_array($decoded) ? $decoded : $fallback;
}

function default_document(string $type = 'page', string $slug = 'home'): array
{
    return [
        'id' => null,
        'type' => $type,
        'slug' => $slug,
        'title' => ucfirst(str_replace('-', ' ', $slug)),
        'status' => 'draft',
        'layout' => [],
        'settings' => default_document_settings(),
        'template_assignment' => [
            'header' => '',
            'footer' => '',
        ],
    ];
}

function default_document_settings(): array
{
    return [
        'seo' => [
            'title' => '',
            'description' => '',
            'canonical' => '',
            'og_image' => '',
            'twitter_card' => 'summary_large_image',
            'indexing' => 'index,follow',
        ],
        'customCss' => '',
        'customJs' => '',
        'responsive' => [
            'desktop' => ['maxWidth' => '1200px'],
            'tablet' => ['maxWidth' => '900px'],
            'mobile' => ['maxWidth' => '100%'],
        ],
    ];
}

function map_document_row(array $row, string $type = 'page'): array
{
    return [
        'id' => (int) $row['id'],
        'type' => $type,
        'slug' => $row['slug'],
        'title' => $row['title'],
        'status' => $row['status'] ?? 'draft',
        'layout' => json_decode_array($row['content_json'] ?? $row['layout_json'] ?? '[]', []),
        'settings' => array_replace_recursive(default_document_settings(), json_decode_array($row['settings_json'] ?? '{}', [])),
        'template_assignment' => json_decode_array($row['template_assignment_json'] ?? '{}', [
            'header' => '',
            'footer' => '',
        ]),
        'created_at' => $row['created_at'] ?? null,
        'updated_at' => $row['updated_at'] ?? null,
        'is_homepage' => !empty($row['is_homepage']),
        'template_type' => $row['template_type'] ?? null,
    ];
}

function fetch_pages(): array
{
    $rows = db_fetch_all('SELECT * FROM pages ORDER BY is_homepage DESC, updated_at DESC');
    return array_map(fn ($row) => map_document_row($row, 'page'), $rows);
}

function fetch_page_by_slug(string $slug): array
{
    $slug = sanitize_slug($slug) ?: 'home';
    $row = db_fetch_one('SELECT * FROM pages WHERE slug = :slug LIMIT 1', ['slug' => $slug]);
    return $row ? map_document_row($row, 'page') : default_document('page', $slug);
}

function fetch_page_by_id(int $id): ?array
{
    $row = db_fetch_one('SELECT * FROM pages WHERE id = :id LIMIT 1', ['id' => $id]);
    return $row ? map_document_row($row, 'page') : null;
}

function save_page_document(array $payload): array
{
    $slug = sanitize_slug((string) ($payload['slug'] ?? 'home')) ?: 'home';
    $title = trim((string) ($payload['title'] ?? ucfirst($slug)));
    $status = in_array(($payload['status'] ?? 'draft'), ['draft', 'published'], true) ? $payload['status'] : 'draft';
    $layoutJson = json_encode($payload['layout'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $settingsJson = json_encode($payload['settings'] ?? default_document_settings(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $templateAssignmentJson = json_encode($payload['template_assignment'] ?? ['header' => '', 'footer' => ''], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    $sql = <<<SQL
        INSERT INTO pages (id, slug, title, status, content_json, settings_json, template_assignment_json, is_homepage)
        VALUES (:id, :slug, :title, :status, :content_json, :settings_json, :template_assignment_json, :is_homepage)
        ON DUPLICATE KEY UPDATE
            slug = VALUES(slug),
            title = VALUES(title),
            status = VALUES(status),
            content_json = VALUES(content_json),
            settings_json = VALUES(settings_json),
            template_assignment_json = VALUES(template_assignment_json),
            is_homepage = VALUES(is_homepage),
            updated_at = CURRENT_TIMESTAMP
    SQL;

    $statement = db()->prepare($sql);
    $statement->execute([
        'id' => !empty($payload['id']) ? (int) $payload['id'] : null,
        'slug' => $slug,
        'title' => $title,
        'status' => $status,
        'content_json' => $layoutJson ?: '[]',
        'settings_json' => $settingsJson ?: '{}',
        'template_assignment_json' => $templateAssignmentJson ?: '{}',
        'is_homepage' => !empty($payload['is_homepage']) ? 1 : 0,
    ]);

    if (!empty($payload['is_homepage'])) {
        db()->prepare('UPDATE pages SET is_homepage = 0 WHERE slug <> :slug')->execute(['slug' => $slug]);
    }

    return fetch_page_by_slug($slug);
}

function delete_page_document(int $id): void
{
    db()->prepare('DELETE FROM pages WHERE id = :id')->execute(['id' => $id]);
}

function duplicate_page_document(int $id): ?array
{
    $page = fetch_page_by_id($id);
    if (!$page) {
        return null;
    }

    $page['id'] = null;
    $page['slug'] = sanitize_slug($page['slug'] . '-copy-' . substr((string) time(), -4));
    $page['title'] .= ' Copy';
    $page['is_homepage'] = false;

    return save_page_document($page);
}

function set_homepage(int $id): ?array
{
    db()->exec('UPDATE pages SET is_homepage = 0');
    db()->prepare('UPDATE pages SET is_homepage = 1 WHERE id = :id')->execute(['id' => $id]);
    return fetch_page_by_id($id);
}

function fetch_homepage(): ?array
{
    $row = db_fetch_one('SELECT * FROM pages WHERE is_homepage = 1 LIMIT 1');
    return $row ? map_document_row($row, 'page') : null;
}

function fetch_templates(): array
{
    $rows = db_fetch_all('SELECT * FROM templates ORDER BY template_type ASC, updated_at DESC');
    return array_map(fn ($row) => map_document_row($row, 'template'), $rows);
}

function fetch_template_by_slug(string $slug): array
{
    $slug = sanitize_slug($slug);
    $row = db_fetch_one('SELECT * FROM templates WHERE slug = :slug LIMIT 1', ['slug' => $slug]);
    return $row ? map_document_row($row, 'template') : default_document('template', $slug ?: 'template');
}

function fetch_template_for_slot(string $slot, ?string $slug = null): ?array
{
    if ($slug) {
        $row = db_fetch_one('SELECT * FROM templates WHERE slug = :slug LIMIT 1', ['slug' => sanitize_slug($slug)]);
        if ($row) {
            return map_document_row($row, 'template');
        }
    }

    $row = db_fetch_one('SELECT * FROM templates WHERE template_type = :template_type AND status = "published" ORDER BY updated_at DESC LIMIT 1', [
        'template_type' => $slot,
    ]);

    return $row ? map_document_row($row, 'template') : null;
}

function save_template_document(array $payload): array
{
    $slug = sanitize_slug((string) ($payload['slug'] ?? 'template')) ?: 'template';
    $title = trim((string) ($payload['title'] ?? ucfirst($slug)));
    $templateType = (string) ($payload['template_type'] ?? 'header');
    $status = in_array(($payload['status'] ?? 'draft'), ['draft', 'published'], true) ? $payload['status'] : 'draft';
    $layoutJson = json_encode($payload['layout'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    $settingsJson = json_encode($payload['settings'] ?? default_document_settings(), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    $statement = db()->prepare(
        'INSERT INTO templates (id, slug, title, template_type, status, content_json, settings_json)
         VALUES (:id, :slug, :title, :template_type, :status, :content_json, :settings_json)
         ON DUPLICATE KEY UPDATE slug = VALUES(slug), title = VALUES(title), template_type = VALUES(template_type), status = VALUES(status), content_json = VALUES(content_json), settings_json = VALUES(settings_json), updated_at = CURRENT_TIMESTAMP'
    );

    $statement->execute([
        'id' => !empty($payload['id']) ? (int) $payload['id'] : null,
        'slug' => $slug,
        'title' => $title,
        'template_type' => $templateType,
        'status' => $status,
        'content_json' => $layoutJson ?: '[]',
        'settings_json' => $settingsJson ?: '{}',
    ]);

    return fetch_template_by_slug($slug);
}

function fetch_menus(): array
{
    $rows = db_fetch_all('SELECT * FROM menus ORDER BY name ASC');
    return array_map(static function (array $row): array {
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'location' => $row['location'],
            'items' => json_decode_array($row['items_json'] ?? '[]', []),
            'created_at' => $row['created_at'] ?? null,
            'updated_at' => $row['updated_at'] ?? null,
        ];
    }, $rows);
}

function save_menu(array $payload): array
{
    $statement = db()->prepare(
        'INSERT INTO menus (id, name, location, items_json)
         VALUES (:id, :name, :location, :items_json)
         ON DUPLICATE KEY UPDATE name = VALUES(name), location = VALUES(location), items_json = VALUES(items_json), updated_at = CURRENT_TIMESTAMP'
    );

    $statement->execute([
        'id' => !empty($payload['id']) ? (int) $payload['id'] : null,
        'name' => trim((string) ($payload['name'] ?? 'New Menu')),
        'location' => trim((string) ($payload['location'] ?? 'header')),
        'items_json' => json_encode($payload['items'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
    ]);

    return fetch_menus()[0] ?? [
        'id' => null,
        'name' => trim((string) ($payload['name'] ?? 'New Menu')),
        'location' => trim((string) ($payload['location'] ?? 'header')),
        'items' => $payload['items'] ?? [],
    ];
}

function fetch_settings(): array
{
    $rows = db_fetch_all('SELECT setting_key, setting_value FROM settings');
    $settings = [
        'site_name' => 'Visual Builder Site',
        'site_tagline' => '',
        'site_logo' => '',
        'favicon' => '',
        'custom_css' => '',
        'custom_js' => '',
        'homepage_slug' => 'home',
    ];

    foreach ($rows as $row) {
        $settings[$row['setting_key']] = $row['setting_value'];
    }

    return $settings;
}

function save_settings(array $settings): array
{
    $statement = db()->prepare('REPLACE INTO settings (setting_key, setting_value) VALUES (:setting_key, :setting_value)');
    foreach ($settings as $key => $value) {
        $statement->execute([
            'setting_key' => (string) $key,
            'setting_value' => is_scalar($value) ? (string) $value : json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
        ]);
    }

    return fetch_settings();
}

function fetch_media(array $filters = []): array
{
    $conditions = [];
    $params = [];

    if (!empty($filters['file_type'])) {
        $conditions[] = 'file_type = :file_type';
        $params['file_type'] = $filters['file_type'];
    }

    if (!empty($filters['search'])) {
        $conditions[] = '(original_name LIKE :search OR title LIKE :search OR alt LIKE :search)';
        $params['search'] = '%' . $filters['search'] . '%';
    }

    $sql = 'SELECT * FROM media';
    if ($conditions) {
        $sql .= ' WHERE ' . implode(' AND ', $conditions);
    }
    $sql .= ' ORDER BY created_at DESC LIMIT 200';

    $rows = db_fetch_all($sql, $params);
    return array_map(static function (array $row): array {
        return [
            'id' => (int) $row['id'],
            'filename' => $row['filename'],
            'original_name' => $row['original_name'],
            'file_type' => $row['file_type'],
            'mime_type' => $row['mime_type'],
            'file_size' => (int) $row['file_size'],
            'alt' => $row['alt'],
            'title' => $row['title'],
            'caption' => $row['caption'],
            'url' => $row['url'],
            'meta_json' => json_decode_array($row['meta_json'] ?? '{}', []),
            'created_at' => $row['created_at'] ?? null,
        ];
    }, $rows);
}

function create_media_record(array $payload): array
{
    $statement = db()->prepare(
        'INSERT INTO media (filename, original_name, file_type, mime_type, file_size, alt, title, caption, url, meta_json)
         VALUES (:filename, :original_name, :file_type, :mime_type, :file_size, :alt, :title, :caption, :url, :meta_json)'
    );

    $statement->execute([
        'filename' => $payload['filename'],
        'original_name' => $payload['original_name'],
        'file_type' => $payload['file_type'],
        'mime_type' => $payload['mime_type'],
        'file_size' => $payload['file_size'],
        'alt' => $payload['alt'] ?? '',
        'title' => $payload['title'] ?? '',
        'caption' => $payload['caption'] ?? '',
        'url' => $payload['url'],
        'meta_json' => json_encode($payload['meta_json'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
    ]);

    return fetch_media()[0];
}

function delete_media_record(int $id): void
{
    db()->prepare('DELETE FROM media WHERE id = :id')->execute(['id' => $id]);
}

function fetch_posts(): array
{
    $rows = db_fetch_all('SELECT * FROM posts ORDER BY published_at DESC, created_at DESC');
    return array_map(static function (array $row): array {
        return [
            'id' => (int) $row['id'],
            'post_type' => $row['post_type'],
            'slug' => $row['slug'],
            'title' => $row['title'],
            'excerpt' => $row['excerpt'],
            'content' => $row['content'],
            'featured_image' => $row['featured_image'],
            'author_name' => $row['author_name'],
            'categories' => json_decode_array($row['categories_json'] ?? '[]', []),
            'published_at' => $row['published_at'],
        ];
    }, $rows);
}

function save_form_submission(array $payload): array
{
    $statement = db()->prepare('INSERT INTO form_submissions (page_slug, form_name, submission_json) VALUES (:page_slug, :form_name, :submission_json)');
    $statement->execute([
        'page_slug' => $payload['page_slug'] ?? 'home',
        'form_name' => $payload['form_name'] ?? 'contact_form',
        'submission_json' => json_encode($payload['submission'] ?? [], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
    ]);

    return [
        'id' => (int) db()->lastInsertId(),
        'page_slug' => $payload['page_slug'] ?? 'home',
        'form_name' => $payload['form_name'] ?? 'contact_form',
    ];
}

function import_template_bundle(array $bundle): array
{
    $imported = ['pages' => [], 'templates' => [], 'menus' => []];

    foreach (($bundle['pages'] ?? []) as $page) {
        $imported['pages'][] = save_page_document($page);
    }

    foreach (($bundle['templates'] ?? []) as $template) {
        $imported['templates'][] = save_template_document($template);
    }

    foreach (($bundle['menus'] ?? []) as $menu) {
        $imported['menus'][] = save_menu($menu);
    }

    if (!empty($bundle['settings']) && is_array($bundle['settings'])) {
        save_settings($bundle['settings']);
    }

    return $imported;
}
