<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';

if (is_logged_in()) {
    header('Location: index.php');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim((string) ($_POST['username'] ?? ''));
    $password = (string) ($_POST['password'] ?? '');
    $token = (string) ($_POST['csrf_token'] ?? '');

    if (!hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        $error = 'Invalid security token. Refresh the page and try again.';
    } elseif (attempt_login($username, $password)) {
        header('Location: index.php');
        exit;
    } else {
        $error = 'Incorrect username or password.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CMS Login</title>
    <link rel="stylesheet" href="../assets/css/admin.css">
</head>
<body class="cms-login-page">
    <main class="cms-login-shell">
        <section class="cms-login-card">
            <p class="cms-eyebrow">Custom Visual CMS</p>
            <h1>Sign in to the editor</h1>
            <p class="cms-login-copy">Use the credentials from <code>config.php</code> to access the protected visual builder.</p>

            <?php if ($error !== ''): ?>
                <div class="cms-alert cms-alert--error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></div>
            <?php endif; ?>

            <form method="post" class="cms-login-form">
                <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
                <label>
                    <span>Username</span>
                    <input type="text" name="username" required autocomplete="username">
                </label>
                <label>
                    <span>Password</span>
                    <input type="password" name="password" required autocomplete="current-password">
                </label>
                <button type="submit" class="cms-button cms-button--primary cms-button--full">Login</button>
            </form>
        </section>
    </main>
</body>
</html>
