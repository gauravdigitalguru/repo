<?php

declare(strict_types=1);

require dirname(__DIR__) . '/includes/bootstrap.php';
require_login();

$editorCssVersion = asset_version(dirname(__DIR__) . '/assets/css/editor.css');
$dragDropEngineJsVersion = asset_version(dirname(__DIR__) . '/assets/js/drag-drop-engine.js');
$builderRulesJsVersion = asset_version(dirname(__DIR__) . '/assets/js/builder/rules.js');
$builderInsertionMarkerJsVersion = asset_version(dirname(__DIR__) . '/assets/js/builder/insertionMarker.js');
$builderWidgetFactoryJsVersion = asset_version(dirname(__DIR__) . '/assets/js/builder/widgetFactory.js');
$builderDragDropEngineJsVersion = asset_version(dirname(__DIR__) . '/assets/js/builder/dragDropEngine.js');
$typographyInspectorJsVersion = asset_version(dirname(__DIR__) . '/assets/js/typography-inspector.js');
$builderJsVersion = asset_version(dirname(__DIR__) . '/assets/js/builder.js');
$adminBuildVersion = date('Y-m-d H:i:s', filemtime(__FILE__) ?: time());
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional Visual Builder</title>
    <link rel="stylesheet" href="../assets/css/editor.css?v=<?= htmlspecialchars($editorCssVersion, ENT_QUOTES, 'UTF-8') ?>">
</head>
<body class="cms-admin-page" data-theme="light">
    <div class="vb-admin">
        <header class="vb-toolbar">
            <div class="vb-toolbar__brand">
                <p class="vb-eyebrow">Protected admin</p>
                <p class="vb-build-stamp">Build <?= htmlspecialchars($adminBuildVersion, ENT_QUOTES, 'UTF-8') ?></p>
                <input type="text" id="pageTitleInput" class="vb-title-input" value="Visual Builder Pro" aria-label="Page title">
            </div>

            <div class="vb-toolbar__document">
                <select id="documentTypeSelect">
                    <option value="page">Page</option>
                    <option value="template">Template</option>
                </select>
                <select id="documentSelect"></select>
                <button type="button" class="vb-button" id="newDocumentButton">New</button>
                <button type="button" class="vb-button" id="duplicateDocumentButton">Duplicate</button>
                <button type="button" class="vb-button" id="deleteDocumentButton">Delete</button>
                <button type="button" class="vb-button" id="setHomepageButton">Set homepage</button>
            </div>

            <div class="vb-toolbar__actions">
                <div class="vb-toolbar__group">
                    <button type="button" class="vb-button vb-button--icon" id="undoButton" data-tooltip="Undo (Ctrl+Z)" aria-label="Undo">
                        <span aria-hidden="true">↶</span>
                    </button>
                    <button type="button" class="vb-button vb-button--icon" id="redoButton" data-tooltip="Redo (Ctrl+Y)" aria-label="Redo">
                        <span aria-hidden="true">↷</span>
                    </button>
                </div>
                <div class="vb-device-switcher vb-toolbar__group" role="group" aria-label="Device preview">
                    <button type="button" class="vb-button vb-button--icon is-active" data-breakpoint="desktop" data-tooltip="Desktop preview" aria-label="Desktop preview">
                        <span aria-hidden="true">🖥</span>
                    </button>
                    <button type="button" class="vb-button vb-button--icon" data-breakpoint="tablet" data-tooltip="Tablet preview" aria-label="Tablet preview">
                        <span aria-hidden="true">📱</span>
                    </button>
                    <button type="button" class="vb-button vb-button--icon" data-breakpoint="mobile" data-tooltip="Mobile preview" aria-label="Mobile preview">
                        <span aria-hidden="true">📲</span>
                    </button>
                </div>
                <div class="vb-toolbar__group">
                    <button type="button" class="vb-button vb-button--icon" id="themeToggleButton" data-tooltip="Toggle light and dark theme" aria-label="Toggle theme">
                        <span aria-hidden="true">◐</span>
                    </button>
                    <button type="button" class="vb-button vb-button--icon" id="gridToggleButton" data-tooltip="Toggle canvas grid" aria-label="Toggle canvas grid">
                        <span aria-hidden="true">⌗</span>
                    </button>
                    <button type="button" class="vb-button vb-button--icon" id="toggleLeftSidebarButton" data-tooltip="Collapse widget panel" aria-label="Collapse widget panel">
                        <span aria-hidden="true">◧</span>
                    </button>
                    <button type="button" class="vb-button vb-button--icon" id="toggleRightSidebarButton" data-tooltip="Collapse property panel" aria-label="Collapse property panel">
                        <span aria-hidden="true">◨</span>
                    </button>
                    <button type="button" class="vb-button vb-button--icon" id="fullscreenButton" data-tooltip="Toggle fullscreen editor" aria-label="Toggle fullscreen">
                        <span aria-hidden="true">⛶</span>
                    </button>
                    <button type="button" class="vb-button vb-button--icon" id="previewButton" data-tooltip="Open static preview" aria-label="Preview page">
                        <span aria-hidden="true">▶</span>
                    </button>
                </div>
                <button type="button" class="vb-button" id="exportBundleButton">Export</button>
                <label class="vb-button vb-button--file">
                    Import
                    <input type="file" id="importBundleInput" accept=".json" hidden>
                </label>
                <button type="button" class="vb-button" id="saveButton" title="Save draft to console">Save Draft</button>
                <button type="button" class="vb-button vb-button--primary" id="publishButton" title="Publish to the CMS">Publish</button>
                <button type="button" class="vb-button vb-button--icon" id="settingsMenuButton" data-tooltip="More settings" aria-label="More settings">
                    <span aria-hidden="true">⋯</span>
                </button>
                <a class="vb-button" href="logout.php">Logout</a>
            </div>
        </header>

        <main class="vb-layout">
            <aside class="vb-sidebar vb-sidebar--left">
                <div class="vb-sidebar__tabs">
                    <button type="button" class="vb-tab is-active" data-sidebar-panel="widgets">Widgets</button>
                    <button type="button" class="vb-tab" data-sidebar-panel="structure">Structure</button>
                    <button type="button" class="vb-tab" data-sidebar-panel="media">Media</button>
                    <button type="button" class="vb-tab" data-sidebar-panel="menus">Menus</button>
                    <button type="button" class="vb-tab" data-sidebar-panel="settings">Settings</button>
                </div>

                <div class="vb-sidebar__panel is-active" data-sidebar-panel="widgets">
                    <div class="vb-panel-head">
                        <h2>Widget library</h2>
                        <input type="search" id="widgetSearch" placeholder="Search widgets">
                    </div>
                    <div id="widgetLibrary" class="vb-widget-library"></div>
                </div>

                <div class="vb-sidebar__panel" data-sidebar-panel="structure">
                    <div class="vb-panel-head">
                        <h2>Navigator</h2>
                        <p>Move and select elements from a tree view.</p>
                    </div>
                    <div id="structureTree" class="vb-structure-tree"></div>
                </div>

                <div class="vb-sidebar__panel" data-sidebar-panel="media">
                    <div class="vb-panel-head">
                        <h2>Media library</h2>
                        <label class="vb-button vb-button--file">
                            Upload files
                            <input type="file" id="mediaUploadInput" multiple hidden>
                        </label>
                    </div>
                    <div id="mediaLibrary" class="vb-media-grid"></div>
                </div>

                <div class="vb-sidebar__panel" data-sidebar-panel="menus">
                    <div class="vb-panel-head">
                        <h2>Menus</h2>
                        <button type="button" class="vb-button" id="newMenuButton">New menu</button>
                    </div>
                    <div id="menuManager" class="vb-menu-manager"></div>
                </div>

                <div class="vb-sidebar__panel" data-sidebar-panel="settings">
                    <div class="vb-panel-head">
                        <h2>Document settings</h2>
                        <p>SEO, theme assignment, custom CSS, and JavaScript.</p>
                    </div>
                    <form id="documentSettingsForm" class="vb-form-stack"></form>
                </div>
            </aside>

            <section class="vb-canvas-area">
                <div class="vb-stage-toolbar">
                    <div>
                        <strong id="stageTitle">Canvas</strong>
                        <span id="saveStatus">Ready</span>
                    </div>
                    <div class="vb-stage-toolbar__actions">
                        <button type="button" class="vb-button" id="copyElementButton">Copy</button>
                        <button type="button" class="vb-button" id="pasteElementButton">Paste</button>
                        <button type="button" class="vb-button" id="moveUpButton">Move up</button>
                        <button type="button" class="vb-button" id="moveDownButton">Move down</button>
                        <button type="button" class="vb-button" id="duplicateElementButton">Duplicate</button>
                        <button type="button" class="vb-button" id="deleteElementButton">Delete</button>
                    </div>
                </div>
                <div class="vb-stage-shell">
                    <div class="vb-canvas-frame" id="canvasFrame" data-breakpoint="desktop">
                        <div class="vb-canvas" id="canvas"></div>
                    </div>
                </div>
            </section>

            <aside class="vb-sidebar vb-sidebar--right">
                <div class="vb-sidebar__tabs">
                    <button type="button" class="vb-tab is-active" data-inspector-tab="content">Content</button>
                    <button type="button" class="vb-tab" data-inspector-tab="style">Style</button>
                    <button type="button" class="vb-tab" data-inspector-tab="advanced">Advanced</button>
                </div>
                <div class="vb-inspector-head">
                    <h2 id="inspectorTitle">Properties</h2>
                    <p id="inspectorSubtitle">Select an element to edit.</p>
                </div>
                <div id="inspectorContent" class="vb-inspector-panel is-active" data-inspector-tab="content"></div>
                <div id="inspectorStyle" class="vb-inspector-panel" data-inspector-tab="style"></div>
                <div id="inspectorAdvanced" class="vb-inspector-panel" data-inspector-tab="advanced"></div>
            </aside>
        </main>

        <footer class="vb-footerbar">
            <div class="vb-footerbar__group">
                <label class="vb-zoom-control">
                    <span>Zoom</span>
                    <input type="range" id="zoomRange" min="50" max="150" step="5" value="100">
                </label>
                <span id="zoomValue">100%</span>
            </div>
            <div class="vb-footerbar__group">
                <strong>Navigator</strong>
                <span id="navigatorSummary">0 elements</span>
            </div>
            <div class="vb-footerbar__group">
                <span id="footerStatus">Builder ready</span>
            </div>
        </footer>
    </div>

    <div class="vb-context-menu" id="contextMenu" hidden>
        <button type="button" data-context-action="duplicate">Duplicate</button>
        <button type="button" data-context-action="delete">Delete</button>
        <button type="button" data-context-action="copy">Copy</button>
        <button type="button" data-context-action="paste">Paste</button>
        <button type="button" data-context-action="save-template">Save as Template</button>
    </div>

    <script>
        window.CMS_CONFIG = {
            csrfToken: <?= json_encode($_SESSION['csrf_token'], JSON_UNESCAPED_SLASHES) ?>,
            endpoints: {
                loadData: '../api/admin/load-data.php',
                saveDocument: '../api/admin/save-document.php',
                deletePage: '../api/admin/delete-page.php',
                duplicatePage: '../api/admin/duplicate-page.php',
                setHomepage: '../api/admin/set-homepage.php',
                saveMenu: '../api/admin/save-menu.php',
                saveSettings: '../api/admin/save-settings.php',
                mediaUpload: '../api/admin/media-upload.php',
                mediaDelete: '../api/admin/media-delete.php',
                exportBundle: '../api/admin/export-bundle.php',
                importBundle: '../api/admin/import-bundle.php'
            },
            publicBase: '../index.php?page='
        };
    </script>
    <script src="../assets/js/drag-drop-engine.js?v=<?= htmlspecialchars($dragDropEngineJsVersion, ENT_QUOTES, 'UTF-8') ?>"></script>
    <script src="../assets/js/builder/rules.js?v=<?= htmlspecialchars($builderRulesJsVersion, ENT_QUOTES, 'UTF-8') ?>"></script>
    <script src="../assets/js/builder/insertionMarker.js?v=<?= htmlspecialchars($builderInsertionMarkerJsVersion, ENT_QUOTES, 'UTF-8') ?>"></script>
    <script src="../assets/js/builder/widgetFactory.js?v=<?= htmlspecialchars($builderWidgetFactoryJsVersion, ENT_QUOTES, 'UTF-8') ?>"></script>
    <script src="../assets/js/builder/dragDropEngine.js?v=<?= htmlspecialchars($builderDragDropEngineJsVersion, ENT_QUOTES, 'UTF-8') ?>"></script>
    <script src="../assets/js/typography-inspector.js?v=<?= htmlspecialchars($typographyInspectorJsVersion, ENT_QUOTES, 'UTF-8') ?>"></script>
    <script src="../assets/js/builder.js?v=<?= htmlspecialchars($builderJsVersion, ENT_QUOTES, 'UTF-8') ?>"></script>
</body>
</html>
