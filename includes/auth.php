<?php

declare(strict_types=1);

function is_logged_in(): bool
{
    return !empty($_SESSION['cms_logged_in']);
}

function require_login(): void
{
    if (is_logged_in()) {
        return;
    }

    if (str_contains($_SERVER['REQUEST_URI'] ?? '', '/api/')) {
        json_response(['error' => 'Unauthenticated'], 401);
    }

    header('Location: login.php');
    exit;
}

function attempt_login(string $username, string $password): bool
{
    global $config;

    $expectedUser = (string) ($config['auth']['username'] ?? '');
    $expectedPassword = (string) ($config['auth']['password'] ?? '');

    if (!hash_equals($expectedUser, $username) || !hash_equals($expectedPassword, $password)) {
        return false;
    }

    session_regenerate_id(true);
    $_SESSION['cms_logged_in'] = true;

    return true;
}

function logout_user(): void
{
    $_SESSION = [];

    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }

    session_destroy();
}

function verify_csrf(): void
{
    $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? ($_POST['csrf_token'] ?? '');

    if (!hash_equals($_SESSION['csrf_token'] ?? '', (string) $token)) {
        json_response(['error' => 'Invalid CSRF token'], 419);
    }
}
