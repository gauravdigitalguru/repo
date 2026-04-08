(function () {
    const config = window.CMS_CONFIG;
    const BREAKPOINTS = ['desktop', 'tablet', 'mobile'];
    const STYLE_FIELDS = [
        ['backgroundColor', 'Background'],
        ['hoverBackgroundColor', 'Hover background'],
        ['backgroundImage', 'Background image'],
        ['color', 'Text color'],
        ['fontFamily', 'Font family'],
        ['fontSize', 'Font size'],
        ['fontWeight', 'Font weight'],
        ['lineHeight', 'Line height'],
        ['letterSpacing', 'Letter spacing'],
        ['textAlign', 'Text align'],
        ['padding', 'Padding'],
        ['margin', 'Margin'],
        ['border', 'Border'],
        ['borderWidth', 'Border width'],
        ['borderColor', 'Border color'],
        ['borderRadius', 'Border radius'],
        ['boxShadow', 'Box shadow'],
        ['opacity', 'Opacity'],
        ['width', 'Width'],
        ['minHeight', 'Min height'],
        ['gap', 'Gap'],
        ['justifyContent', 'Justify'],
        ['alignItems', 'Align items'],
        ['position', 'Position'],
        ['zIndex', 'Z-index'],
    ];
    const TYPOGRAPHY_WIDGET_TYPES = ['heading', 'paragraph', 'button'];
    const TYPOGRAPHY_STYLE_KEYS = ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'color'];

    const widgetCatalog = buildWidgetCatalog();
    const widgetMap = Object.fromEntries(widgetCatalog.flatMap((group) => group.widgets.map((widget) => [widget.type, widget])));

    const state = {
        csrfToken: config.csrfToken,
        activeBreakpoint: 'desktop',
        activeDocumentType: 'page',
        documents: { pages: [], templates: [] },
        document: createDocument('page', 'home'),
        selectedPath: null,
        contextPath: null,
        dragPayload: null,
        dragEngine: null,
        history: [],
        future: [],
        clipboard: null,
        menus: [],
        media: [],
        settings: {},
        posts: [],
        ui: { leftPanel: 'widgets', inspectorTab: 'content', collapsedCategories: {}, theme: 'light', zoom: 100, showGrid: true, leftCollapsed: false, rightCollapsed: false },
    };

    const elements = {
        documentTypeSelect: document.getElementById('documentTypeSelect'),
        documentSelect: document.getElementById('documentSelect'),
        pageTitleInput: document.getElementById('pageTitleInput'),
        newDocumentButton: document.getElementById('newDocumentButton'),
        duplicateDocumentButton: document.getElementById('duplicateDocumentButton'),
        deleteDocumentButton: document.getElementById('deleteDocumentButton'),
        setHomepageButton: document.getElementById('setHomepageButton'),
        undoButton: document.getElementById('undoButton'),
        redoButton: document.getElementById('redoButton'),
        saveButton: document.getElementById('saveButton'),
        publishButton: document.getElementById('publishButton'),
        previewButton: document.getElementById('previewButton'),
        themeToggleButton: document.getElementById('themeToggleButton'),
        gridToggleButton: document.getElementById('gridToggleButton'),
        toggleLeftSidebarButton: document.getElementById('toggleLeftSidebarButton'),
        toggleRightSidebarButton: document.getElementById('toggleRightSidebarButton'),
        fullscreenButton: document.getElementById('fullscreenButton'),
        settingsMenuButton: document.getElementById('settingsMenuButton'),
        exportBundleButton: document.getElementById('exportBundleButton'),
        importBundleInput: document.getElementById('importBundleInput'),
        widgetSearch: document.getElementById('widgetSearch'),
        widgetLibrary: document.getElementById('widgetLibrary'),
        structureTree: document.getElementById('structureTree'),
        mediaLibrary: document.getElementById('mediaLibrary'),
        menuManager: document.getElementById('menuManager'),
        documentSettingsForm: document.getElementById('documentSettingsForm'),
        canvas: document.getElementById('canvas'),
        canvasFrame: document.getElementById('canvasFrame'),
        inspectorContent: document.getElementById('inspectorContent'),
        inspectorStyle: document.getElementById('inspectorStyle'),
        inspectorAdvanced: document.getElementById('inspectorAdvanced'),
        inspectorTitle: document.getElementById('inspectorTitle'),
        inspectorSubtitle: document.getElementById('inspectorSubtitle'),
        saveStatus: document.getElementById('saveStatus'),
        stageTitle: document.getElementById('stageTitle'),
        mediaUploadInput: document.getElementById('mediaUploadInput'),
        copyElementButton: document.getElementById('copyElementButton'),
        pasteElementButton: document.getElementById('pasteElementButton'),
        moveUpButton: document.getElementById('moveUpButton'),
        moveDownButton: document.getElementById('moveDownButton'),
        duplicateElementButton: document.getElementById('duplicateElementButton'),
        deleteElementButton: document.getElementById('deleteElementButton'),
        newMenuButton: document.getElementById('newMenuButton'),
        zoomRange: document.getElementById('zoomRange'),
        zoomValue: document.getElementById('zoomValue'),
        navigatorSummary: document.getElementById('navigatorSummary'),
        footerStatus: document.getElementById('footerStatus'),
        contextMenu: document.getElementById('contextMenu'),
        adminRoot: document.querySelector('.vb-admin'),
        leftSidebar: document.querySelector('.vb-sidebar--left'),
        rightSidebar: document.querySelector('.vb-sidebar--right'),
        stageShell: document.querySelector('.vb-stage-shell'),
        body: document.body,
    };

    init();

    async function init() {
        setupDragDropEngine();
        bindToolbar();
        bindPanels();
        renderWidgetLibrary();
        await loadEditorData();
        bindShortcuts();
        document.addEventListener('click', handleDocumentClick);
        document.addEventListener('contextmenu', handleGlobalContextMenuClose);
    }

    function buildWidgetCatalog() {
        return [
            { category: 'Basic', widgets: [
                widget('heading', 'Heading', { text: 'Heading', level: 2, link: '' }),
                widget('paragraph', 'Paragraph', { html: '<p>Paragraph text</p>' }),
                widget('image', 'Image', { src: '', alt: '', title: '', caption: '', lightbox: false, lazy: true }),
                widget('video', 'Video', { sourceType: 'self', src: '', poster: '', autoplay: false, loop: false, controls: true, muted: false }),
                widget('button', 'Button', { text: 'Click me', link: '#', icon: '' }),
                widget('divider', 'Divider', {}),
                widget('spacer', 'Spacer', {}),
            ]},
            { category: 'Media', widgets: [
                widget('gallery', 'Image gallery', { items: [] }),
                widget('audio', 'Audio', { src: '' }),
                widget('download', 'File download', { src: '', label: 'Download file' }),
                widget('icon', 'Icon', { icon: '&#9733;' }),
                widget('icon-list', 'Icon list', { items: [{ icon: '&#10003;', text: 'List item' }] }),
                widget('video-playlist', 'Video playlist', { items: [{ src: '', title: 'Video 1' }] }),
            ]},
            { category: 'Layout', widgets: [
                widget('section', 'Section', { layoutMode: 'flex-column' }, true),
                widget('container', 'Container', { layoutMode: 'flex-column' }, true),
                widget('inner-section', 'Inner section', { layoutMode: 'flex-column' }, true),
                widget('columns', 'Columns', { columns: 2 }, false, () => createColumnsNode(2)),
                widget('tabs', 'Tabs', { items: [{ label: 'Tab 1', content: '<p>Tab content</p>' }] }),
                widget('accordion', 'Accordion', { items: [{ label: 'Item 1', content: '<p>Accordion content</p>' }] }),
                widget('toggle', 'Toggle', { items: [{ label: 'Toggle label', content: '<p>Toggle content</p>' }] }),
                widget('popup', 'Popup', { buttonText: 'Open popup' }, true),
            ]},
            { category: 'Forms', widgets: [
                widget('contact-form', 'Contact form', { formName: 'contact_form', submitText: 'Send message', fields: [
                    { type: 'text', name: 'name', label: 'Name' },
                    { type: 'email', name: 'email', label: 'Email' },
                    { type: 'textarea', name: 'message', label: 'Message' },
                ]}),
            ]},
            { category: 'Dynamic', widgets: [
                widget('post-grid', 'Post grid', { limit: 6 }),
                widget('post-carousel', 'Post carousel', { limit: 6 }),
                widget('archive-list', 'Archive list', {}),
                widget('author-box', 'Author box', { name: 'Author Name', bio: 'Author biography' }),
                widget('comments-list', 'Comments list', {}),
                widget('search-form', 'Search form', {}),
                widget('breadcrumbs', 'Breadcrumbs', {}),
                widget('site-logo', 'Site logo', {}),
                widget('site-title', 'Site title', {}),
                widget('site-tagline', 'Site tagline', {}),
                widget('menu', 'Menu widget', { menuId: 0, orientation: 'horizontal' }),
            ]},
            { category: 'Advanced', widgets: [
                widget('html', 'HTML block', { html: '<div>Custom HTML</div>' }),
                widget('javascript', 'JavaScript embed', { code: '' }),
                widget('css', 'CSS block', { code: '' }),
                widget('shortcode', 'Shortcode', { shortcode: '[example]' }),
                widget('map', 'Google Maps', { embed: '' }),
                widget('social-icons', 'Social icons', { items: [{ icon: 'F', url: 'https://facebook.com' }] }),
                widget('countdown', 'Countdown', { targetDate: '' }),
                widget('progress', 'Progress bar', { label: 'Progress', value: 70 }),
                widget('testimonial-slider', 'Testimonial slider', { items: [{ quote: 'Amazing service.', name: 'Client' }] }),
                widget('pricing-table', 'Pricing table', { title: 'Starter', price: '$99', features: ['Feature 1', 'Feature 2'] }),
                widget('counter', 'Counter', { target: 100 }),
                widget('table-of-contents', 'Table of contents', { title: 'On this page' }),
            ]},
            { category: 'Examples', widgets: [
                widget('example-hero-section', 'Hero section', {}, false, createHeroSectionExample),
                widget('example-feature-section', 'Feature section', {}, false, createFeatureSectionExample),
                widget('example-two-column-grid', '2-column grid', {}, false, () => createGridExample(2)),
                widget('example-three-column-grid', '3-column grid', {}, false, () => createGridExample(3)),
                widget('example-complete-form', 'Complete form', {}, false, createCompleteFormExample),
            ]},
        ];
    }

    function widget(type, label, content, canHaveChildren = false, factory = null) {
        return { type, label, content, canHaveChildren, factory };
    }

    function setupDragDropEngine() {
        const modularApi = window.CMSBuilderDragDropEngine;
        if (modularApi && typeof modularApi.createDragDropEngine === 'function') {
            const rulesApi = window.CMSBuilderRules;
            const markerApi = window.CMSInsertionMarker;

            state.dragEngine = modularApi.createDragDropEngine({
                panelRoot: elements.widgetLibrary,
                canvasRoot: elements.canvas,
                rules: rulesApi && typeof rulesApi.createRules === 'function'
                    ? rulesApi.createRules({
                        containerTypes: ['container', 'inner-section', 'column', 'popup'],
                        sectionTypes: ['section'],
                    })
                    : null,
                marker: markerApi && typeof markerApi.createInsertionMarker === 'function'
                    ? markerApi.createInsertionMarker()
                    : null,
                selectors: {
                    panelWidget: '.vb-widget[data-widget-dnd="new"]',
                    container: '[data-dnd-container="true"]',
                    widget: '.vb-node',
                    widgetChild: '.vb-node',
                    invalidTarget: '.vb-node, .vb-drop-surface, .vb-canvas',
                    ignoreChildren: '.vb-dropzone, .vb-helper, .vb-container-empty, .vb-drop-marker, .vb-node__badge, .vb-node__toolbar',
                },
                resolveNodeFromEl: resolveDragDropNodeFromEl,
                createWidget: function (widgetType) {
                    return createWidgetFromFactoryType(widgetType);
                },
                onWidgetAdd: function (detail) {
                    let insertedPath = null;
                    let insertedNode = null;

                    mutate(() => {
                        const containerPath = Array.isArray(detail.containerPath)
                            ? detail.containerPath.slice()
                            : resolveContainerPathFromEl(detail.containerEl);

                        if (!Array.isArray(containerPath)) {
                            return;
                        }

                        insertedNode = detail.widget;
                        insertNode(containerPath, detail.index, insertedNode);
                        insertedPath = [...containerPath, detail.index];
                        state.selectedPath = insertedPath;
                    });

                    return insertedNode && insertedPath
                        ? { node: insertedNode, path: insertedPath }
                        : false;
                },
                onSelectNode: function () {},
                onInspectorOpen: function () {},
            });
            return;
        }

        const api = window.CMSDragDropEngine;
        if (!api || typeof api.createDragDropEngine !== 'function') return;

        state.dragEngine = api.createDragDropEngine({
            canDrop: canDropPayloadToTarget,
            onDrop: handleDropIntent,
            onInvalidDrop: () => setStatus('This item cannot be dropped here.'),
            onDragStart: (payload) => {
                state.dragPayload = payload;
            },
            onDragEnd: () => {
                state.dragPayload = null;
            },
        });
    }

    function canDropPayloadToTarget(payload, meta) {
        if (!payload || !meta || !Array.isArray(meta.parentPath)) return false;

        if (payload.source === 'canvas') {
            return Array.isArray(payload.path) && !isPathInside(meta.parentPath, payload.path);
        }

        if (payload.source !== 'widget') return false;

        if (!meta.parentPath.length) {
            return true;
        }

        const parentNode = getNode(meta.parentPath);
        return !parentNode || canAcceptChildren(parentNode.type);
    }

    function handleDropIntent(payload, meta) {
        mutate(() => {
            if (payload.source === 'widget') {
                insertNode(meta.parentPath, meta.index, createNode(payload.type));
                state.selectedPath = [...meta.parentPath, meta.index];
                return;
            }

            if (payload.source === 'canvas' && Array.isArray(payload.path)) {
                moveNode(payload.path, meta.parentPath, meta.index);
            }
        });
    }

    function getDropAxis(parentPath) {
        if (!Array.isArray(parentPath) || !parentPath.length) return 'vertical';
        const parentNode = getNode(parentPath);
        const layoutMode = parentNode?.content?.layoutMode || 'flex-column';
        return layoutMode === 'flex-row' || parentNode?.type === 'columns' ? 'horizontal' : 'vertical';
    }

    function getDragIcon(type) {
        const icons = {
            section: 'S',
            container: 'C',
            'inner-section': 'I',
            columns: '||',
            column: '|',
            heading: 'H',
            paragraph: 'T',
            button: 'B',
        };
        return icons[type] || '+';
    }

    function supportsModularWidgetDrop(type) {
        return ['heading', 'paragraph', 'text', 'button'].includes(type);
    }

    function resolveContainerPathFromEl(element) {
        if (!(element instanceof Element)) return null;
        const raw = element.dataset.nodePath || element.dataset.path || '';
        if (!raw) return null;

        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : null;
        } catch (error) {
            const path = raw.split('.').map((part) => Number(part)).filter((value) => Number.isFinite(value));
            return path.length ? path : null;
        }
    }

    function resolveDragDropNodeFromEl(element) {
        const path = resolveContainerPathFromEl(element);
        const node = Array.isArray(path) ? getNode(path) : null;
        if (!node) return null;

        return {
            id: node.id || '',
            type: isWidgetDropContainer(node.type) ? 'container' : node.type,
            rawType: node.type,
            content: node.content || {},
        };
    }

    function isWidgetDropContainer(type) {
        return ['container', 'inner-section', 'column', 'popup'].includes(type);
    }

    function createWidgetFromFactoryType(widgetType) {
        const factoryApi = window.CMSWidgetFactory;
        const baseNode = factoryApi && typeof factoryApi.createDefaultWidget === 'function'
            ? factoryApi.createDefaultWidget(widgetType)
            : null;
        const targetType = baseNode && baseNode.type === 'text'
            ? 'paragraph'
            : (baseNode && baseNode.type ? baseNode.type : widgetType === 'text' ? 'paragraph' : widgetType);
        const node = createNode(targetType);

        if (!baseNode) {
            return node;
        }

        if (targetType === 'heading') {
            node.content.text = baseNode.content?.text || node.content.text;
            node.content.level = headingTagToLevel(baseNode.content?.tag) || node.content.level;
            return node;
        }

        if (targetType === 'paragraph') {
            node.content.html = `<p>${escapeHtml(baseNode.content?.text || 'Start typing your text...')}</p>`;
            return node;
        }

        if (targetType === 'button') {
            node.content.text = baseNode.content?.text || node.content.text;
            node.content.link = baseNode.content?.url || node.content.link;
            return node;
        }

        return node;
    }

    function headingTagToLevel(tag) {
        const match = String(tag || '').trim().toLowerCase().match(/^h([1-6])$/);
        return match ? Number(match[1]) : 2;
    }

    function bindToolbar() {
        elements.documentTypeSelect.addEventListener('change', async (event) => {
            state.activeDocumentType = event.target.value;
            renderDocumentOptions();
            const next = currentDocuments()[0];
            if (next) {
                await loadDocument(next.slug);
            } else {
                state.document = createDocument(state.activeDocumentType, state.activeDocumentType === 'template' ? 'header-default' : 'home');
                pushHistorySnapshot(true);
                repaint();
            }
        });
        elements.documentSelect.addEventListener('change', async (event) => await loadDocument(event.target.value));
        elements.newDocumentButton.addEventListener('click', createNewDocument);
        elements.duplicateDocumentButton.addEventListener('click', duplicateCurrentDocument);
        elements.deleteDocumentButton.addEventListener('click', deleteCurrentDocument);
        elements.setHomepageButton.addEventListener('click', setHomepage);
        elements.undoButton.addEventListener('click', undo);
        elements.redoButton.addEventListener('click', redo);
        elements.saveButton.addEventListener('click', saveDraftDocument);
        elements.publishButton.addEventListener('click', saveCurrentDocument);
        elements.previewButton.addEventListener('click', openPreviewWindow);
        elements.exportBundleButton.addEventListener('click', () => window.open(config.endpoints.exportBundle, '_blank'));
        elements.importBundleInput.addEventListener('change', importBundle);
        elements.widgetSearch.addEventListener('input', renderWidgetLibrary);
        elements.mediaUploadInput.addEventListener('change', uploadMediaFiles);
        elements.copyElementButton.addEventListener('click', copySelectedNode);
        elements.pasteElementButton.addEventListener('click', pasteNodeFromClipboard);
        elements.moveUpButton.addEventListener('click', () => moveSelectedNode(-1));
        elements.moveDownButton.addEventListener('click', () => moveSelectedNode(1));
        elements.duplicateElementButton.addEventListener('click', duplicateSelectedNode);
        elements.deleteElementButton.addEventListener('click', deleteSelectedNode);
        elements.newMenuButton.addEventListener('click', createMenu);
        elements.pageTitleInput.addEventListener('input', () => updateDocumentTitle(elements.pageTitleInput.value));
        elements.themeToggleButton.addEventListener('click', toggleTheme);
        elements.gridToggleButton.addEventListener('click', toggleGrid);
        elements.toggleLeftSidebarButton.addEventListener('click', () => toggleSidebar('left'));
        elements.toggleRightSidebarButton.addEventListener('click', () => toggleSidebar('right'));
        elements.fullscreenButton.addEventListener('click', toggleFullscreenEditor);
        elements.zoomRange.addEventListener('input', () => updateZoom(Number(elements.zoomRange.value)));
        elements.settingsMenuButton.addEventListener('click', () => alert('Settings menu can be expanded with more document options next.'));
        elements.contextMenu.querySelectorAll('[data-context-action]').forEach((button) => {
            button.addEventListener('click', () => handleContextAction(button.dataset.contextAction));
        });
        document.querySelectorAll('[data-breakpoint]').forEach((button) => {
            button.addEventListener('click', () => {
                state.activeBreakpoint = button.dataset.breakpoint;
                elements.canvasFrame.dataset.breakpoint = state.activeBreakpoint;
                updateBreakpointButtons();
                updateCanvasPresentation();
                renderInspector();
            });
        });
    }

    function bindPanels() {
        document.querySelectorAll('[data-sidebar-panel]').forEach((button) => {
            button.addEventListener('click', () => {
                const panel = button.dataset.sidebarPanel;
                state.ui.leftPanel = panel;
                document.querySelectorAll('.vb-sidebar__tabs .vb-tab').forEach((tab) => tab.classList.toggle('is-active', tab.dataset.sidebarPanel === panel));
                document.querySelectorAll('.vb-sidebar__panel').forEach((section) => section.classList.toggle('is-active', section.dataset.sidebarPanel === panel));
            });
        });
        document.querySelectorAll('[data-inspector-tab]').forEach((button) => {
            button.addEventListener('click', () => {
                const tab = button.dataset.inspectorTab;
                state.ui.inspectorTab = tab;
                document.querySelectorAll('.vb-sidebar--right .vb-tab').forEach((item) => item.classList.toggle('is-active', item.dataset.inspectorTab === tab));
                document.querySelectorAll('.vb-inspector-panel').forEach((panel) => panel.classList.toggle('is-active', panel.dataset.inspectorTab === tab));
            });
        });
    }

    async function loadEditorData(slug) {
        setStatus('Loading builder data...');
        const query = new URLSearchParams({ document_type: state.activeDocumentType, slug: slug || 'home' });
        const response = await fetch(`${config.endpoints.loadData}?${query.toString()}`, { credentials: 'same-origin' });
        const data = await response.json();
        state.csrfToken = data.csrf_token || state.csrfToken;
        state.documents.pages = data.pages || [];
        state.documents.templates = data.templates || [];
        state.menus = data.menus || [];
        state.media = data.media || [];
        state.settings = data.settings || {};
        state.posts = data.posts || [];
        state.document = data.document || createDocument(state.activeDocumentType, slug || 'home');
        pushHistorySnapshot(true);
        repaint();
        setStatus('Ready');
    }

    async function loadDocument(slug) {
        await loadEditorData(slug);
    }

    async function saveCurrentDocument() {
        setStatus('Saving...');
        const response = await postJson(config.endpoints.saveDocument, state.document);
        const data = await response.json();
        if (!response.ok) {
            alert(data.error || 'Unable to save document.');
            setStatus('Save failed');
            return;
        }
        state.document = data.document;
        state.documents.pages = data.pages || state.documents.pages;
        state.documents.templates = data.templates || state.documents.templates;
        renderDocumentOptions();
        updatePreviewLink();
        setStatus('Saved');
    }

    function saveDraftDocument() {
        console.log('Visual Builder draft JSON:', JSON.stringify(state.document, null, 2));
        setStatus('Draft JSON logged to console');
    }

    function openPreviewWindow() {
        const previewWindow = window.open('', '_blank', 'noopener,noreferrer');
        if (!previewWindow) {
            alert('Preview popup was blocked by the browser.');
            return;
        }
        previewWindow.document.open();
        previewWindow.document.write(renderPreviewDocument());
        previewWindow.document.close();
    }

    function updateDocumentTitle(value) {
        mutate(() => {
            state.document.title = value || state.document.slug;
        }, false, {
            documentOptions: false,
            previewLink: false,
            widgetLibrary: false,
            structureTree: false,
            canvas: false,
            inspector: false,
            documentSettings: false,
            mediaLibrary: false,
            menus: false,
            stageTitle: true,
        });
    }

    function toggleTheme() {
        state.ui.theme = state.ui.theme === 'light' ? 'dark' : 'light';
        elements.body.dataset.theme = state.ui.theme;
        elements.themeToggleButton.setAttribute('data-tooltip', state.ui.theme === 'light' ? 'Toggle light and dark theme' : 'Switch back to light theme');
    }

    function toggleGrid() {
        state.ui.showGrid = !state.ui.showGrid;
        updateCanvasPresentation();
    }

    function toggleSidebar(side) {
        if (side === 'left') {
            state.ui.leftCollapsed = !state.ui.leftCollapsed;
            elements.leftSidebar.classList.toggle('is-collapsed', state.ui.leftCollapsed);
        }
        if (side === 'right') {
            state.ui.rightCollapsed = !state.ui.rightCollapsed;
            elements.rightSidebar.classList.toggle('is-collapsed', state.ui.rightCollapsed);
        }
    }

    async function toggleFullscreenEditor() {
        try {
            if (!document.fullscreenElement) {
                await elements.adminRoot.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch (error) {
            alert('Fullscreen mode is not available in this browser.');
        }
    }

    function updateZoom(value) {
        state.ui.zoom = value;
        updateCanvasPresentation();
    }

    async function createNewDocument() {
        const raw = prompt(`Enter a ${state.activeDocumentType} slug`, state.activeDocumentType === 'template' ? 'header-default' : 'new-page');
        if (!raw) return;
        const slug = sanitizeSlug(raw);
        if (!slug) return alert('Please enter a valid slug.');
        state.document = createDocument(state.activeDocumentType, slug);
        state.selectedPath = null;
        pushHistorySnapshot(true);
        repaint();
        setStatus('New document ready.');
    }

    async function duplicateCurrentDocument() {
        if (state.activeDocumentType !== 'page' || !state.document.id) {
            alert('Duplicate is available for saved pages in this version.');
            return;
        }
        const response = await postJson(config.endpoints.duplicatePage, { id: state.document.id });
        const data = await response.json();
        if (!response.ok) return alert(data.error || 'Unable to duplicate page.');
        state.documents.pages = data.pages || state.documents.pages;
        state.document = data.document;
        pushHistorySnapshot(true);
        repaint();
    }

    async function deleteCurrentDocument() {
        if (state.activeDocumentType !== 'page' || !state.document.id) {
            alert('Delete is available for saved pages in this version.');
            return;
        }
        if (!confirm('Delete this page?')) return;
        const response = await postJson(config.endpoints.deletePage, { id: state.document.id });
        const data = await response.json();
        if (!response.ok) return alert(data.error || 'Unable to delete page.');
        state.documents.pages = data.pages || [];
        state.document = createDocument('page', 'home');
        pushHistorySnapshot(true);
        repaint();
    }

    async function setHomepage() {
        if (state.activeDocumentType !== 'page' || !state.document.id) {
            alert('Save the page first, then set it as homepage.');
            return;
        }
        const response = await postJson(config.endpoints.setHomepage, { id: state.document.id });
        const data = await response.json();
        if (!response.ok) return alert(data.error || 'Unable to update homepage.');
        state.documents.pages = data.pages || state.documents.pages;
        state.settings = data.settings || state.settings;
        repaint();
    }

    function repaint(options = {}) {
        const settings = {
            documentOptions: true,
            previewLink: true,
            widgetLibrary: true,
            structureTree: true,
            canvas: true,
            inspector: true,
            documentSettings: true,
            mediaLibrary: true,
            menus: true,
            stageTitle: true,
            ...options,
        };
        if (settings.documentOptions) renderDocumentOptions();
        if (settings.previewLink) updatePreviewLink();
        if (settings.widgetLibrary) renderWidgetLibrary();
        if (settings.structureTree) renderStructureTree();
        if (settings.canvas) renderCanvas();
        if (settings.inspector) renderInspector();
        if (settings.documentSettings) renderDocumentSettings();
        if (settings.mediaLibrary) renderMediaLibrary();
        if (settings.menus) renderMenus();
        if (settings.stageTitle) {
            elements.stageTitle.textContent = `${state.document.title || state.document.slug} (${state.activeDocumentType})`;
        }
        syncEditorChrome();
    }

    function renderDocumentOptions() {
        elements.documentTypeSelect.value = state.activeDocumentType;
        elements.documentSelect.innerHTML = '';
        currentDocuments().forEach((doc) => {
            const option = document.createElement('option');
            option.value = doc.slug;
            option.textContent = `${doc.title || doc.slug} (${doc.slug})`;
            elements.documentSelect.appendChild(option);
        });
        if (state.document.slug) {
            elements.documentSelect.value = state.document.slug;
        }
    }

    function renderWidgetLibrary() {
        const search = elements.widgetSearch.value.trim().toLowerCase();
        elements.widgetLibrary.innerHTML = '';
        widgetCatalog.forEach((group) => {
            const widgets = group.widgets.filter((widget) => widget.label.toLowerCase().includes(search) || widget.type.includes(search));
            if (!widgets.length) return;
            const category = document.createElement('section');
            category.className = 'vb-widget-category';
            if (state.ui.collapsedCategories[group.category]) {
                category.classList.add('is-collapsed');
            }
            category.innerHTML = `
                <button type="button" class="vb-widget-category__toggle" data-category-toggle="${escapeAttribute(group.category)}">
                    <h3>${group.category}</h3>
                    <span class="vb-widget-category__icon">▾</span>
                </button>
            `;
            const list = document.createElement('div');
            list.className = 'vb-widget-list';
            widgets.forEach((widget) => {
                const legacyDragEngine = state.dragEngine && typeof state.dragEngine.bindSource === 'function';
                const modularWidgetDrop = state.dragEngine && !legacyDragEngine && supportsModularWidgetDrop(widget.type);
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'vb-widget';
                button.draggable = !state.dragEngine || legacyDragEngine || modularWidgetDrop;
                button.dataset.widgetType = widget.type;
                button.dataset.widgetLabel = widget.label;
                button.dataset.widgetIcon = getDragIcon(widget.type);
                if (modularWidgetDrop) {
                    button.dataset.widgetDnd = 'new';
                }
                button.innerHTML = `<strong>${widget.label}</strong><small>${widget.type}</small>`;
                if (legacyDragEngine) {
                    state.dragEngine.bindSource(button, () => ({
                        source: 'widget',
                        type: widget.type,
                        label: widget.label,
                        icon: getDragIcon(widget.type),
                    }));
                } else if (!state.dragEngine) {
                    button.addEventListener('dragstart', (event) => {
                        state.dragPayload = { source: 'widget', type: widget.type };
                        event.dataTransfer.setData('text/plain', JSON.stringify(state.dragPayload));
                    });
                }
                list.appendChild(button);
            });
            category.appendChild(list);
            category.querySelector('[data-category-toggle]').addEventListener('click', () => {
                state.ui.collapsedCategories[group.category] = !state.ui.collapsedCategories[group.category];
                renderWidgetLibrary();
            });
            elements.widgetLibrary.appendChild(category);
        });
    }

    function renderStructureTree() {
        elements.structureTree.innerHTML = '';
        if (!state.document.layout.length) {
            elements.structureTree.innerHTML = '<p class="vb-helper">No elements yet.</p>';
            return;
        }
        state.document.layout.forEach((node, index) => {
            elements.structureTree.appendChild(renderStructureItem(node, [index]));
        });
    }

    function renderStructureItem(node, path) {
        const item = document.createElement('div');
        item.className = 'vb-navigator-item';
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = `${labelForType(node.type)} (${node.id})`;
        button.addEventListener('click', () => {
            state.selectedPath = path;
            renderCanvas();
            renderInspector();
        });
        item.appendChild(button);
        if (node.children?.length) {
            node.children.forEach((child, index) => item.appendChild(renderStructureItem(child, [...path, index])));
        }
        return item;
    }

    function renderCanvas() {
        elements.canvas.innerHTML = '';
        elements.canvasFrame.dataset.breakpoint = state.activeBreakpoint;
        if (!state.document.layout.length) {
            const empty = document.createElement('div');
            empty.className = 'vb-empty-canvas';
            empty.innerHTML = '<div><strong>Canvas is empty.</strong><br>Drag a widget here to start building.</div>';
            bindDropTarget(empty, [], 0);
            elements.canvas.appendChild(empty);
            return;
        }
        renderDropzone(elements.canvas, [], 0);
        state.document.layout.forEach((node, index) => {
            elements.canvas.appendChild(renderNodePreview(node, [index]));
            renderDropzone(elements.canvas, [], index + 1);
        });
    }

    function syncEditorChrome() {
        elements.pageTitleInput.value = state.document.title || '';
        elements.footerStatus.textContent = state.selectedPath ? `Selected: ${labelForType(getSelectedNode()?.type || '')}` : 'No element selected';
        elements.navigatorSummary.textContent = `${countNodes(state.document.layout)} elements`;
        elements.zoomRange.value = String(state.ui.zoom);
        elements.zoomValue.textContent = `${state.ui.zoom}%`;
        updateBreakpointButtons();
        updateCanvasPresentation();
        elements.body.dataset.theme = state.ui.theme;
        elements.themeToggleButton.setAttribute('data-tooltip', state.ui.theme === 'light' ? 'Toggle light and dark theme' : 'Switch back to light theme');
        elements.gridToggleButton.classList.toggle('is-active', state.ui.showGrid);
        elements.leftSidebar.classList.toggle('is-collapsed', state.ui.leftCollapsed);
        elements.rightSidebar.classList.toggle('is-collapsed', state.ui.rightCollapsed);
    }

    function updateBreakpointButtons() {
        document.querySelectorAll('[data-breakpoint]').forEach((button) => {
            button.classList.toggle('is-active', button.dataset.breakpoint === state.activeBreakpoint);
        });
    }

    function updateCanvasPresentation() {
        elements.stageShell.classList.toggle('is-grid-hidden', !state.ui.showGrid);
        elements.canvasFrame.style.transform = `scale(${state.ui.zoom / 100})`;
        elements.canvasFrame.style.transformOrigin = 'top center';
        elements.canvasFrame.style.marginBottom = `${Math.max(0, state.ui.zoom - 100) * 8}px`;
    }

    function renderNodePreview(node, path) {
        const element = document.createElement('div');
        element.className = 'vb-node';
        element.dataset.nodeId = node.id || '';
        element.dataset.nodeType = isWidgetDropContainer(node.type)
            ? 'container'
            : (node.type === 'section' ? 'section' : 'widget');
        element.dataset.nodePath = JSON.stringify(path);
        if (samePath(path, state.selectedPath)) element.classList.add('is-selected');
        element.draggable = !state.dragEngine || typeof state.dragEngine.bindSource === 'function';
        if (state.dragEngine && typeof state.dragEngine.bindSource === 'function') {
            state.dragEngine.bindSource(element, () => ({
                source: 'canvas',
                path: path.slice(),
                type: node.type,
                label: labelForType(node.type),
                icon: getDragIcon(node.type),
            }));
        } else {
            element.addEventListener('dragstart', (event) => {
                state.dragPayload = { source: 'canvas', path };
                event.dataTransfer.setData('text/plain', JSON.stringify(state.dragPayload));
            });
        }
        element.addEventListener('click', (event) => {
            event.stopPropagation();
            state.selectedPath = path;
            renderCanvas();
            renderInspector();
        });
        element.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            event.stopPropagation();
            state.selectedPath = path;
            state.contextPath = path;
            renderCanvas();
            renderInspector();
            openContextMenu(event.clientX, event.clientY);
        });
        const badge = document.createElement('div');
        badge.className = 'vb-node__badge';
        badge.textContent = labelForType(node.type);
        element.appendChild(badge);

        const toolbar = document.createElement('div');
        toolbar.className = 'vb-node__toolbar';
        toolbar.innerHTML = '<button type="button" class="vb-node__handle" title="Drag to reorder">::</button><button type="button" data-action="duplicate" title="Duplicate">Copy</button><button type="button" data-action="delete" title="Delete">Delete</button>';
        toolbar.querySelector('[data-action="duplicate"]').addEventListener('click', (event) => {
            event.stopPropagation();
            state.selectedPath = path;
            duplicateSelectedNode();
        });
        toolbar.querySelector('[data-action="delete"]').addEventListener('click', (event) => {
            event.stopPropagation();
            state.selectedPath = path;
            deleteSelectedNode();
        });
        element.appendChild(toolbar);
        const contentShell = document.createElement('div');
        contentShell.className = 'vb-node__content';
        const previewBody = buildNodePreviewBody(node, path);
        contentShell.appendChild(previewBody);
        if (node.type === 'button') {
            const buttonEl = previewBody.querySelector('.vb-preview-button');
            if (buttonEl) {
                applyButtonPreviewStyles(buttonEl, node);
            }
            const styleSet = normalizeButtonStyleSet(resolveNodeStyleSet(node, state.activeBreakpoint));
            if (styleSet.textAlign) {
                contentShell.style.textAlign = styleSet.textAlign;
            }
        } else {
            applyPreviewStyles(contentShell, node);
        }
        element.appendChild(contentShell);
        return element;
    }

    function buildNodePreviewBody(node, path) {
        if (node.type === 'columns') {
            const wrapper = document.createElement('div');
            wrapper.className = 'vb-columns-node';
            node.children.forEach((child, index) => {
                wrapper.appendChild(renderNodePreview(child, [...path, index]));
                if (index < node.children.length - 1) {
                    const resizer = document.createElement('div');
                    resizer.className = 'vb-column-resizer';
                    enableColumnResize(resizer, path, index);
                    wrapper.appendChild(resizer);
                }
            });
            return wrapper;
        }

        if (canAcceptChildren(node.type)) {
            const wrapper = document.createElement('div');
            wrapper.className = 'vb-drop-surface';
            if (isWidgetDropContainer(node.type)) {
                wrapper.dataset.dndContainer = 'true';
                wrapper.dataset.nodeId = node.id || '';
                wrapper.dataset.nodePath = JSON.stringify(path);
                wrapper.dataset.nodeType = 'container';
                wrapper.dataset.containerLayout = getDropAxis(path) === 'horizontal' ? 'row' : 'column';
            }
            bindDropTarget(wrapper, path, Array.isArray(node.children) ? node.children.length : 0);
            renderDropzone(wrapper, path, 0);
            const children = Array.isArray(node.children) ? node.children : [];
            children.forEach((child, index) => {
                wrapper.appendChild(renderNodePreview(child, [...path, index]));
                renderDropzone(wrapper, path, index + 1);
            });

            if (!children.length) {
                const empty = document.createElement('div');
                empty.className = 'vb-helper vb-container-empty';
                empty.textContent = `Drop widgets inside this ${labelForType(node.type).toLowerCase()}.`;
                wrapper.appendChild(empty);
            }

            return wrapper;
        }

        if (node.type === 'button') {
            const preview = document.createElement('div');
            preview.className = 'vb-node__preview';
            const button = document.createElement('a');
            button.className = 'vb-preview-button';
            button.href = node.content?.link || '#';
            button.textContent = node.content?.text || 'Button';
            button.addEventListener('click', (event) => event.preventDefault());
            preview.appendChild(button);
            return preview;
        }

        const preview = document.createElement('div');
        preview.className = 'vb-node__preview';
        preview.innerHTML = getNodePreviewMarkup(node);
        return preview;
    }

    function getNodePreviewMarkup(node) {
        const content = node.content || {};
        switch (node.type) {
            case 'heading': return `<h${normalizeHeadingLevel(content.level)} style="margin:0;font-family:inherit;font-size:inherit;font-weight:inherit;line-height:inherit;letter-spacing:inherit;text-transform:inherit;color:inherit;">${escapeHtml(content.text || 'Heading')}</h${normalizeHeadingLevel(content.level)}>`;
            case 'paragraph': return `<div style="font-family:inherit;font-size:inherit;font-weight:inherit;line-height:inherit;letter-spacing:inherit;text-transform:inherit;color:inherit;">${safeHtml(content.html || '<p>Paragraph</p>')}</div>`;
            case 'image': return content.src ? `<img src="${escapeAttribute(content.src)}" alt="${escapeAttribute(content.alt || '')}">` : '<div class="vb-helper">Select an image.</div>';
            case 'video': return `<div class="vb-helper">Video: ${escapeHtml(content.src || 'No source')}</div>`;
            case 'button': return `<a class="vb-preview-button" style="font-family:inherit;font-size:inherit;font-weight:inherit;line-height:inherit;letter-spacing:inherit;text-transform:inherit;color:inherit;">${escapeHtml(content.text || 'Button')}</a>`;
            case 'divider': return '<hr>';
            case 'spacer': return '<div style="height:40px"></div>';
            case 'gallery': return `<div class="vb-helper">Gallery items: ${(content.items || []).length}</div>`;
            case 'icon': return `<div>${safeHtml(content.icon || '&#9733;')}</div>`;
            case 'icon-list': return `<ul>${(content.items || []).map((item) => `<li>${safeHtml(item.icon || '&#10003;')} ${escapeHtml(item.text || '')}</li>`).join('')}</ul>`;
            case 'tabs':
            case 'accordion':
            case 'toggle': return `<div class="vb-helper">${labelForType(node.type)} items: ${(content.items || []).length}</div>`;
            case 'popup': return `<div class="vb-helper">Popup trigger: ${escapeHtml(content.buttonText || 'Open popup')}</div>`;
            case 'contact-form': return `<div class="vb-helper">Form fields: ${(content.fields || []).length}</div>`;
            case 'menu': return `<div class="vb-helper">Menu widget</div>`;
            case 'post-grid':
            case 'post-carousel': return `<div class="vb-helper">${labelForType(node.type)} showing ${content.limit || 6} posts</div>`;
            case 'author-box': return `<div><strong>${escapeHtml(content.name || 'Author')}</strong><p>${escapeHtml(content.bio || '')}</p></div>`;
            case 'search-form': return '<input type="search" placeholder="Search">';
            case 'site-title': return `<strong>${escapeHtml(state.settings.site_name || 'Site Title')}</strong>`;
            case 'site-tagline': return `<span>${escapeHtml(state.settings.site_tagline || 'Site tagline')}</span>`;
            case 'social-icons': return `<div>${(content.items || []).map((item) => `<span>${safeHtml(item.icon || '')}</span>`).join(' ')}</div>`;
            case 'pricing-table': return `<div><strong>${escapeHtml(content.title || 'Plan')}</strong><div>${escapeHtml(content.price || '$99')}</div></div>`;
            case 'counter': return `<strong>${escapeHtml(String(content.target || 100))}</strong>`;
            case 'html': return safeHtml(content.html || '<div>Custom HTML</div>');
            case 'javascript':
            case 'css': return `<pre>${escapeHtml(content.code || '')}</pre>`;
            default: return `<div class="vb-helper">${labelForType(node.type)}</div>`;
        }
    }

    function renderDropzone(parent, parentPath, index) {
        const zone = document.createElement('div');
        zone.className = 'vb-dropzone';
        bindDropTarget(zone, parentPath, index);
        parent.appendChild(zone);
    }

    function bindDropTarget(target, parentPath, index) {
        target.dataset.dndTarget = 'true';

        if (state.dragEngine && typeof state.dragEngine.bindDropTarget === 'function') {
            state.dragEngine.bindDropTarget(target, () => ({
                parentPath: parentPath.slice(),
                index,
                kind: target.classList.contains('vb-dropzone') ? 'between' : 'inside',
                mode: target.classList.contains('vb-dropzone') ? 'line' : 'inside',
                axis: getDropAxis(parentPath),
                parentType: parentPath.length ? (getNode(parentPath)?.type || '') : 'root',
            }));
            return;
        }

        if (state.dragEngine) {
            return;
        }

        target.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.stopPropagation();
            target.classList.add('is-active');
            if (event.dataTransfer) {
                event.dataTransfer.dropEffect = state.dragPayload?.source === 'canvas' ? 'move' : 'copy';
            }
        });
        target.addEventListener('dragleave', (event) => {
            event.stopPropagation();
            target.classList.remove('is-active');
        });
        target.addEventListener('drop', (event) => {
            event.preventDefault();
            event.stopPropagation();
            target.classList.remove('is-active');
            const payload = readDragPayload(event);
            if (!payload) return;
            mutate(() => {
                if (payload.source === 'widget') {
                    insertNode(parentPath, index, createNode(payload.type));
                    state.selectedPath = [...parentPath, index];
                }
                if (payload.source === 'canvas') {
                    moveNode(payload.path, parentPath, index);
                }
            });
        });
    }

    function renderInspector() {
        const node = getSelectedNode();
        elements.inspectorTitle.textContent = node ? labelForType(node.type) : 'Properties';
        elements.inspectorSubtitle.textContent = node ? `Editing ${node.id}` : 'Select an element to edit.';
        elements.inspectorContent.innerHTML = node ? renderContentInspector(node) : '<p class="vb-helper">Select an element on the canvas.</p>';
        elements.inspectorStyle.innerHTML = node ? renderStyleInspector(node) : '';
        elements.inspectorAdvanced.innerHTML = node ? renderAdvancedInspector(node) : '';
        bindInspectorInputs();
    }

    function renderContentInspector(node) {
        return `<div class="vb-field-group">${renderContentFieldsForNode(node)}</div>`;
    }

    function renderStyleInspector(node) {
        const styleState = node.styles[state.activeBreakpoint] || {};
        if (supportsTypographyInspector(node)) {
            ensureNodeTypographyState(node);
            return `<div class="vb-field-group vb-field-group--style-tab">
                <p class="vb-helper">Editing ${state.activeBreakpoint} styles</p>
                ${getTypographyApi().renderTypographyInspector(node)}
                ${node.type === 'button' ? `<details class="vb-inspector-details" open>
                    <summary>Button style</summary>
                    <div class="vb-field-group">
                        ${renderButtonStyleFields(styleState)}
                    </div>
                </details>` : ''}
                <details class="vb-inspector-details">
                    <summary>Additional styles</summary>
                    <div class="vb-field-group">
                        ${renderAdditionalStyleFields(styleState)}
                    </div>
                </details>
            </div>`;
        }
        return `<div class="vb-field-group">
            <p class="vb-helper">Editing ${state.activeBreakpoint} styles</p>
            ${STYLE_FIELDS.map(([key, label]) => `<label><span>${label}</span><input type="text" data-style-field="${key}" value="${escapeAttribute(styleState[key] || '')}"></label>`).join('')}
        </div>`;
    }
    function renderButtonStyleFields(styleState) {
        return [
            renderStyleField(styleState, 'width', 'Width'),
            renderStyleField(styleState, 'padding', 'Padding'),
            renderStyleField(styleState, 'backgroundColor', 'Background'),
            renderStyleField(styleState, 'hoverBackgroundColor', 'Hover background'),
            renderStyleField(styleState, 'borderWidth', 'Border width'),
            renderStyleField(styleState, 'borderColor', 'Border color'),
            renderStyleField(styleState, 'borderRadius', 'Border radius'),
            renderStyleField(styleState, 'boxShadow', 'Shadow')
        ].join('');
    }

    function renderAdvancedInspector(node) {
        const advanced = node.advanced || {};
        return `<div class="vb-field-group">
            <label><span>CSS class</span><input type="text" data-advanced-field="cssClass" value="${escapeAttribute(advanced.cssClass || '')}"></label>
            <label><span>Anchor ID</span><input type="text" data-advanced-field="anchorId" value="${escapeAttribute(advanced.anchorId || '')}"></label>
            <label><span>Animation</span><input type="text" data-advanced-field="animation" value="${escapeAttribute(advanced.animation || '')}"></label>
            <label><span>Custom CSS</span><textarea data-advanced-field="customCss" rows="4">${escapeHtml(advanced.customCss || '')}</textarea></label>
            <label><input type="checkbox" data-advanced-toggle="hideDesktop" ${advanced.hideDesktop ? 'checked' : ''}> Hide on desktop</label>
            <label><input type="checkbox" data-advanced-toggle="hideTablet" ${advanced.hideTablet ? 'checked' : ''}> Hide on tablet</label>
            <label><input type="checkbox" data-advanced-toggle="hideMobile" ${advanced.hideMobile ? 'checked' : ''}> Hide on mobile</label>
        </div>`;
    }

    function renderContentFieldsForNode(node) {
        const content = node.content || {};
        switch (node.type) {
            case 'heading': return textField('text', 'Text', content.text) + renderHeadingLevelField(String(content.level || 2)) + textField('link', 'Link', content.link);
            case 'paragraph':
            case 'html': return textareaField('html', node.type === 'html' ? 'HTML' : 'HTML content', content.html, 8);
            case 'javascript':
            case 'css': return textareaField('code', 'Code', content.code, 8);
            case 'image': return textField('src', 'Image URL', content.src) + textField('alt', 'Alt text', content.alt) + textField('title', 'Title', content.title) + textField('caption', 'Caption', content.caption) + toggleField('lightbox', 'Open in lightbox', content.lightbox) + toggleField('lazy', 'Lazy load', content.lazy !== false);
            case 'video': return selectField('sourceType', 'Source type', content.sourceType || 'self', ['self','youtube','vimeo']) + textField('src', 'Video URL', content.src) + textField('poster', 'Poster image', content.poster) + ['autoplay','loop','controls','muted'].map((flag) => toggleField(flag, startCase(flag), content[flag])).join('');
            case 'button': return textField('text', 'Text', content.text) + textField('link', 'Link', content.link) + textField('icon', 'Icon HTML / text', content.icon);
            case 'section':
            case 'container':
            case 'inner-section':
            case 'column':
                return selectField('layoutMode', 'Layout mode', content.layoutMode || 'flex-column', ['flex-column','flex-row','grid']) + textField('gridColumns', 'Grid columns', content.gridColumns || 'repeat(2, minmax(0, 1fr))');
            case 'gallery':
            case 'social-icons':
            case 'icon-list':
            case 'testimonial-slider':
            case 'tabs':
            case 'accordion':
            case 'toggle': return repeaterField('items', 'Items', content.items || [], node.type);
            case 'contact-form': return textField('formName', 'Form name', content.formName) + textField('submitText', 'Submit text', content.submitText) + repeaterField('fields', 'Form fields', content.fields || [], 'form-fields');
            case 'menu': return selectField('menuId', 'Menu', String(content.menuId || 0), state.menus.map((menu) => String(menu.id)), state.menus.map((menu) => menu.name)) + selectField('orientation', 'Orientation', content.orientation || 'horizontal', ['horizontal','vertical']);
            case 'post-grid':
            case 'post-carousel': return numberField('limit', 'Items limit', content.limit || 6);
            case 'author-box': return textField('name', 'Author name', content.name) + textareaField('bio', 'Bio', content.bio, 4);
            case 'pricing-table': return textField('title', 'Title', content.title) + textField('price', 'Price', content.price) + textareaField('features', 'Features (one per line)', (content.features || []).join('\n'), 6);
            case 'countdown': return textField('targetDate', 'Target date', content.targetDate);
            case 'progress': return textField('label', 'Label', content.label) + numberField('value', 'Value', content.value || 70);
            case 'counter': return numberField('target', 'Target number', content.target || 100);
            case 'map': return textField('embed', 'Embed URL', content.embed);
            case 'shortcode': return textField('shortcode', 'Shortcode', content.shortcode);
            default: return '<p class="vb-helper">This widget uses simple output or global settings.</p>';
        }
    }

    function bindInspectorInputs() {
        const node = getSelectedNode();
        if (!node) return;
        elements.inspectorContent.querySelectorAll('[data-content-field]').forEach((input) => {
            input.addEventListener('input', () => updateContentField(input.dataset.contentField, input.type === 'checkbox' ? input.checked : input.value, false));
            input.addEventListener('change', () => updateContentField(input.dataset.contentField, input.type === 'checkbox' ? input.checked : input.value, true));
        });
        elements.inspectorStyle.querySelectorAll('[data-style-field]').forEach((input) => {
            input.addEventListener('input', () => updateStyleField(input.dataset.styleField, input.value, false));
            input.addEventListener('change', () => updateStyleField(input.dataset.styleField, input.value, true));
        });
        elements.inspectorStyle.querySelectorAll('[data-style-color-picker]').forEach((input) => {
            const sync = (recordHistory) => {
                const key = input.dataset.styleColorPicker;
                const textInput = elements.inspectorStyle.querySelector(`[data-style-field="${key}"]`);
                if (textInput) {
                    textInput.value = input.value;
                }
                updateStyleField(key, input.value, recordHistory);
            };
            input.addEventListener('input', () => sync(false));
            input.addEventListener('change', () => sync(true));
        });
        elements.inspectorAdvanced.querySelectorAll('[data-advanced-field]').forEach((input) => {
            input.addEventListener('input', () => updateAdvancedField(input.dataset.advancedField, input.value, false));
            input.addEventListener('change', () => updateAdvancedField(input.dataset.advancedField, input.value, true));
        });
        elements.inspectorAdvanced.querySelectorAll('[data-advanced-toggle]').forEach((input) => input.addEventListener('change', () => updateAdvancedField(input.dataset.advancedToggle, input.checked, true)));
        elements.inspectorContent.querySelectorAll('[data-repeater-add]').forEach((button) => button.addEventListener('click', () => addRepeaterItem(button.dataset.repeaterAdd)));
        elements.inspectorContent.querySelectorAll('[data-repeater-remove]').forEach((button) => button.addEventListener('click', () => removeRepeaterItem(button.dataset.repeaterField, Number(button.dataset.repeaterIndex))));
        elements.inspectorContent.querySelectorAll('[data-repeater-input]').forEach((input) => {
            input.addEventListener('input', () => updateRepeaterField(input, false));
            input.addEventListener('change', () => updateRepeaterField(input, true));
        });
        if (supportsTypographyInspector(node)) {
            getTypographyApi().bindTypographyInspectorEvents(elements.inspectorStyle, node, handleTypographyInspectorChange);
        }
    }

    function renderDocumentSettings() {
        const settings = state.document.settings || createDocument(state.activeDocumentType, state.document.slug).settings;
        elements.documentSettingsForm.innerHTML = `
            <label><span>Slug</span><input type="text" name="slug" value="${escapeAttribute(state.document.slug || '')}"></label>
            <label><span>Title</span><input type="text" name="title" value="${escapeAttribute(state.document.title || '')}"></label>
            ${state.activeDocumentType === 'template'
                ? `<label><span>Template type</span><select name="template_type">${['header','footer','single-post','archive','404'].map((type) => `<option value="${type}" ${state.document.template_type === type ? 'selected' : ''}>${type}</option>`).join('')}</select></label>`
                : `<label><span>Header template slug</span><input type="text" name="headerTemplate" value="${escapeAttribute(state.document.template_assignment?.header || '')}"></label><label><span>Footer template slug</span><input type="text" name="footerTemplate" value="${escapeAttribute(state.document.template_assignment?.footer || '')}"></label>`
            }
            <label><span>SEO title</span><input type="text" name="seo_title" value="${escapeAttribute(settings.seo?.title || '')}"></label>
            <label><span>SEO description</span><textarea name="seo_description" rows="4">${escapeHtml(settings.seo?.description || '')}</textarea></label>
            <label><span>Canonical URL</span><input type="text" name="canonical" value="${escapeAttribute(settings.seo?.canonical || '')}"></label>
            <label><span>OG image</span><input type="text" name="og_image" value="${escapeAttribute(settings.seo?.og_image || '')}"></label>
            <label><span>Twitter card</span><input type="text" name="twitter_card" value="${escapeAttribute(settings.seo?.twitter_card || 'summary_large_image')}"></label>
            <label><span>Custom CSS</span><textarea name="customCss" rows="6">${escapeHtml(settings.customCss || '')}</textarea></label>
            <label><span>Custom JavaScript</span><textarea name="customJs" rows="6">${escapeHtml(settings.customJs || '')}</textarea></label>
        `;
        elements.documentSettingsForm.querySelectorAll('input, textarea, select').forEach((input) => {
            input.addEventListener('input', (event) => handleDocumentSettingsChange(event, false));
            input.addEventListener('change', (event) => handleDocumentSettingsChange(event, true));
        });
    }

    function renderMediaLibrary() {
        elements.mediaLibrary.innerHTML = '';
        if (!state.media.length) {
            elements.mediaLibrary.innerHTML = '<p class="vb-helper">Upload media to get started.</p>';
            return;
        }
        state.media.forEach((item) => {
            const card = document.createElement('article');
            card.className = 'vb-media-card';
            const preview = item.file_type === 'image' ? `<img src="${escapeAttribute(item.url)}" alt="${escapeAttribute(item.alt || '')}">` : item.file_type === 'video' ? `<video src="${escapeAttribute(item.url)}"></video>` : `<div class="vb-helper">${escapeHtml(item.file_type)}</div>`;
            card.innerHTML = `${preview}<div class="vb-media-card__meta"><strong>${escapeHtml(item.title || item.original_name)}</strong><span class="vb-helper">${escapeHtml(item.url)}</span><button type="button" class="vb-button" data-insert-media="${item.id}">Use</button></div>`;
            card.querySelector('[data-insert-media]').addEventListener('click', () => insertMediaIntoSelected(item));
            elements.mediaLibrary.appendChild(card);
        });
    }

    function renderMenus() {
        elements.menuManager.innerHTML = '';
        if (!state.menus.length) {
            elements.menuManager.innerHTML = '<p class="vb-helper">Create a menu to use in headers, footers, and menu widgets.</p>';
            return;
        }
        state.menus.forEach((menu, menuIndex) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'vb-menu-editor';
            wrapper.innerHTML = `<div class="vb-field-group"><label><span>Name</span><input type="text" data-menu-field="name" data-menu-index="${menuIndex}" value="${escapeAttribute(menu.name)}"></label><label><span>Location</span><input type="text" data-menu-field="location" data-menu-index="${menuIndex}" value="${escapeAttribute(menu.location)}"></label></div><div class="vb-menu-items" data-menu-items="${menuIndex}"></div><button type="button" class="vb-button" data-add-menu-item="${menuIndex}">Add item</button><button type="button" class="vb-button vb-button--primary" data-save-menu="${menuIndex}">Save menu</button>`;
            const container = wrapper.querySelector(`[data-menu-items="${menuIndex}"]`);
            (menu.items || []).forEach((item, itemIndex) => container.appendChild(renderMenuItem(menuIndex, item, [itemIndex])));
            wrapper.querySelector(`[data-add-menu-item="${menuIndex}"]`).addEventListener('click', () => {
                menu.items = menu.items || [];
                menu.items.push({ label: 'Menu item', url: '#', children: [] });
                renderMenus();
            });
            wrapper.querySelector(`[data-save-menu="${menuIndex}"]`).addEventListener('click', () => saveMenu(menuIndex));
            wrapper.querySelectorAll('[data-menu-field]').forEach((input) => input.addEventListener('input', () => {
                state.menus[menuIndex][input.dataset.menuField] = input.value;
            }));
            elements.menuManager.appendChild(wrapper);
        });
    }

    function renderMenuItem(menuIndex, item, path) {
        const wrapper = document.createElement('div');
        wrapper.className = 'vb-menu-item';
        wrapper.innerHTML = `<div class="vb-field-group"><label><span>Label</span><input type="text" data-menu-item-field="label" value="${escapeAttribute(item.label || '')}"></label><label><span>URL</span><input type="text" data-menu-item-field="url" value="${escapeAttribute(item.url || '')}"></label></div><div class="vb-menu-item__children"></div><div class="vb-stage-toolbar__actions"><button type="button" class="vb-button" data-add-child>Add child</button><button type="button" class="vb-button" data-remove-item>Remove</button></div>`;
        wrapper.querySelectorAll('[data-menu-item-field]').forEach((input) => input.addEventListener('input', () => {
            const target = getMenuItem(menuIndex, path);
            target[input.dataset.menuItemField] = input.value;
        }));
        wrapper.querySelector('[data-add-child]').addEventListener('click', () => {
            const target = getMenuItem(menuIndex, path);
            target.children = target.children || [];
            target.children.push({ label: 'Child item', url: '#', children: [] });
            renderMenus();
        });
        wrapper.querySelector('[data-remove-item]').addEventListener('click', () => {
            removeMenuItem(menuIndex, path);
            renderMenus();
        });
        const childContainer = wrapper.querySelector('.vb-menu-item__children');
        (item.children || []).forEach((child, childIndex) => childContainer.appendChild(renderMenuItem(menuIndex, child, [...path, childIndex])));
        return wrapper;
    }

    function createMenu() { state.menus.push({ id: null, name: `Menu ${state.menus.length + 1}`, location: 'header', items: [] }); renderMenus(); }

    async function saveMenu(menuIndex) {
        const response = await postJson(config.endpoints.saveMenu, state.menus[menuIndex]);
        const data = await response.json();
        if (!response.ok) return alert(data.error || 'Unable to save menu.');
        state.menus = data.menus || state.menus;
        renderMenus();
        renderInspector();
    }

    async function uploadMediaFiles(event) {
        const files = Array.from(event.target.files || []);
        for (const file of files) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('csrf_token', state.csrfToken);
            const response = await fetch(config.endpoints.mediaUpload, { method: 'POST', body: formData, credentials: 'same-origin', headers: { 'X-CSRF-Token': state.csrfToken } });
            const data = await response.json();
            if (!response.ok) return alert(data.error || 'Media upload failed.');
            state.media = data.items || state.media;
        }
        renderMediaLibrary();
        event.target.value = '';
    }

    async function importBundle(event) {
        const file = event.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('bundle', file);
        formData.append('csrf_token', state.csrfToken);
        const response = await fetch(config.endpoints.importBundle, { method: 'POST', body: formData, credentials: 'same-origin', headers: { 'X-CSRF-Token': state.csrfToken } });
        const data = await response.json();
        if (!response.ok) return alert(data.error || 'Import failed.');
        state.documents.pages = data.pages || [];
        state.documents.templates = data.templates || [];
        state.menus = data.menus || [];
        state.settings = data.settings || state.settings;
        repaint();
    }

    function insertMediaIntoSelected(mediaItem) {
        const node = getSelectedNode();
        if (!node) return;
        mutate(() => {
            if (node.type === 'image') {
                node.content.src = mediaItem.url;
                node.content.alt = mediaItem.alt || '';
            } else if (['video', 'audio', 'download'].includes(node.type)) {
                node.content.src = mediaItem.url;
            } else if (node.type === 'gallery') {
                node.content.items = node.content.items || [];
                node.content.items.push({ src: mediaItem.url, alt: mediaItem.alt || '', caption: mediaItem.caption || '' });
            }
        });
    }

    function handleDocumentSettingsChange(event, recordHistory = false) {
        const { name, value } = event.target;
        mutate(() => {
            if (name === 'slug') state.document.slug = sanitizeSlug(value) || state.document.slug;
            if (name === 'title') state.document.title = value;
            if (name === 'template_type') state.document.template_type = value;
            if (name === 'headerTemplate') state.document.template_assignment.header = value;
            if (name === 'footerTemplate') state.document.template_assignment.footer = value;
            if (['seo_title','seo_description','canonical','og_image','twitter_card'].includes(name)) {
                const keyMap = { seo_title: 'title', seo_description: 'description', canonical: 'canonical', og_image: 'og_image', twitter_card: 'twitter_card' };
                state.document.settings.seo[keyMap[name]] = value;
            }
            if (name === 'customCss') state.document.settings.customCss = value;
            if (name === 'customJs') state.document.settings.customJs = value;
        }, recordHistory, {
            inspector: false,
            documentSettings: false,
            widgetLibrary: false,
            mediaLibrary: false,
            menus: false,
        });
    }

    function updateContentField(field, value, recordHistory = false) {
        let refreshInspector = false;
        mutate(() => {
            const node = getSelectedNode();
            if (!node) return;
            node.content[field] = field === 'features'
                ? String(value).split('\n').map((item) => item.trim()).filter(Boolean)
                : value;
            refreshInspector = node.type === 'heading' && field === 'level';

            if (['section', 'container', 'inner-section', 'column', 'columns'].includes(node.type) && ['layoutMode', 'gridColumns'].includes(field)) {
                const desktopStyles = node.styles.desktop || {};
                const {
                    display: _display,
                    flexDirection: _flexDirection,
                    gridTemplateColumns: _gridTemplateColumns,
                    width: preservedWidth,
                    minHeight: preservedMinHeight,
                    ...restDesktopStyles
                } = desktopStyles;
                node.styles.desktop = {
                    ...defaultStyleSet(node.type, node.content),
                    ...restDesktopStyles,
                    ...(preservedWidth ? { width: preservedWidth } : {}),
                    ...(preservedMinHeight ? { minHeight: preservedMinHeight } : {}),
                };
            }
        }, recordHistory, {
            inspector: refreshInspector,
            documentSettings: false,
            widgetLibrary: false,
            mediaLibrary: false,
            menus: false,
        });
    }
    function updateStyleField(field, value, recordHistory = false) {
        mutate(() => {
            const node = getSelectedNode();
            if (!node) return;
            node.styles[state.activeBreakpoint][field] = normalizeStyleFieldValue(field, value);
        }, recordHistory, {
            inspector: false,
            documentSettings: false,
            widgetLibrary: false,
            mediaLibrary: false,
            menus: false,
        });
    }
    function normalizeStyleFieldValue(field, value) {
        const raw = String(value ?? '').trim();
        if (!raw) return '';
        if (field === 'borderWidth') {
            return /px$/i.test(raw) ? raw : `${raw}px`;
        }
        return value;
    }
    function handleTypographyInspectorChange(node, detail) {
        if (!node || !detail) return;
        if (detail.commit) {
            pushHistorySnapshot();
        }
        repaint({
            documentOptions: false,
            previewLink: false,
            documentSettings: false,
            widgetLibrary: false,
            structureTree: false,
            mediaLibrary: false,
            menus: false,
            inspector: detail.key === 'reset' || detail.key === 'token',
            stageTitle: false,
        });
    }
    function updateAdvancedField(field, value, recordHistory = false) {
        mutate(() => {
            const node = getSelectedNode();
            if (!node) return;
            node.advanced[field] = value;
        }, recordHistory, {
            inspector: false,
            documentSettings: false,
            widgetLibrary: false,
            mediaLibrary: false,
            menus: false,
        });
    }
    function addRepeaterItem(field) { mutate(() => { const node = getSelectedNode(); node.content[field] = node.content[field] || []; node.content[field].push(defaultRepeaterItem(field, node.type)); }); }
    function removeRepeaterItem(field, index) { mutate(() => { const node = getSelectedNode(); node.content[field].splice(index, 1); }); }
    function updateRepeaterField(input, recordHistory = false) {
        const node = getSelectedNode();
        if (!node) return;
        mutate(() => {
            node.content[input.dataset.repeaterField][Number(input.dataset.repeaterIndex)][input.dataset.repeaterKey] = input.type === 'checkbox' ? input.checked : input.value;
        }, recordHistory, {
            inspector: false,
            documentSettings: false,
            widgetLibrary: false,
            mediaLibrary: false,
            menus: false,
        });
    }

    function copySelectedNode() { const node = getSelectedNode(); if (!node) return; state.clipboard = deepClone(node); setStatus('Element copied'); }
    function pasteNodeFromClipboard() { if (!state.clipboard) return; mutate(() => { const targetPath = state.selectedPath ? state.selectedPath.slice(0, -1) : []; const index = state.selectedPath ? state.selectedPath[state.selectedPath.length - 1] + 1 : state.document.layout.length; insertNode(targetPath, index, cloneNode(state.clipboard)); state.selectedPath = [...targetPath, index]; }); }
    function duplicateSelectedNode() { const node = getSelectedNode(); if (!node) return; mutate(() => { const parentPath = state.selectedPath.slice(0, -1); const index = state.selectedPath[state.selectedPath.length - 1] + 1; insertNode(parentPath, index, cloneNode(node)); state.selectedPath = [...parentPath, index]; }); }
    function deleteSelectedNode() { if (!state.selectedPath) return; mutate(() => { const parentPath = state.selectedPath.slice(0, -1); const index = state.selectedPath[state.selectedPath.length - 1]; getChildren(parentPath).splice(index, 1); state.selectedPath = null; }); }
    function moveSelectedNode(direction) { if (!state.selectedPath) return; mutate(() => { const parentPath = state.selectedPath.slice(0, -1); const index = state.selectedPath[state.selectedPath.length - 1]; const siblings = getChildren(parentPath); const next = index + direction; if (next < 0 || next >= siblings.length) return; [siblings[index], siblings[next]] = [siblings[next], siblings[index]]; state.selectedPath = [...parentPath, next]; }); }

    function undo() { if (state.history.length <= 1) return; state.future.push(state.history.pop()); restoreSnapshot(state.history[state.history.length - 1]); }
    function redo() { if (!state.future.length) return; const snapshot = state.future.pop(); state.history.push(snapshot); restoreSnapshot(snapshot); }
    function mutate(callback, recordHistory = true, repaintOptions = {}) {
        callback();
        if (recordHistory) pushHistorySnapshot();
        repaint(repaintOptions);
    }
    function pushHistorySnapshot(replace = false) { const snapshot = JSON.stringify({ document: state.document, menus: state.menus, settings: state.settings }); if (replace) { state.history = [snapshot]; state.future = []; return; } if (state.history[state.history.length - 1] === snapshot) return; state.history.push(snapshot); if (state.history.length > 50) state.history.shift(); state.future = []; }
    function restoreSnapshot(snapshot) { const data = JSON.parse(snapshot); state.document = data.document; state.menus = data.menus; state.settings = data.settings; repaint(); }

    function createDocument(type, slug) { return { id: null, type, slug, title: startCase(slug), status: 'draft', template_type: type === 'template' ? 'header' : undefined, template_assignment: { header: '', footer: '' }, layout: [], settings: { seo: { title: '', description: '', canonical: '', og_image: '', twitter_card: 'summary_large_image' }, customCss: '', customJs: '' } }; }
    function createNode(type) { const widget = widgetMap[type]; if (widget?.factory) return widget.factory(); return { id: generateId(type), type, content: deepClone(widget?.content || {}), styles: { desktop: defaultStyleSet(type, widget?.content || {}), tablet: {}, mobile: {} }, advanced: { cssClass: '', anchorId: '', animation: '', customCss: '', hideDesktop: false, hideTablet: false, hideMobile: false }, children: widget?.canHaveChildren ? [] : [] }; }
    function createColumnsNode(count) { const widths = Array.from({ length: count }, () => `${Math.round(100 / count)}%`); return { id: generateId('columns'), type: 'columns', content: { columns: count, layoutMode: 'flex-row' }, styles: { desktop: defaultStyleSet('columns', { layoutMode: 'flex-row' }), tablet: {}, mobile: {} }, advanced: { cssClass: '', anchorId: '', animation: '', customCss: '', hideDesktop: false, hideTablet: false, hideMobile: false }, children: widths.map((width, index) => ({ id: generateId(`column-${index + 1}`), type: 'column', content: { layoutMode: 'flex-column' }, styles: { desktop: { ...defaultStyleSet('column', { layoutMode: 'flex-column' }), width }, tablet: {}, mobile: { width: '100%' } }, advanced: { cssClass: '', anchorId: '', animation: '', customCss: '', hideDesktop: false, hideTablet: false, hideMobile: false }, children: [] })) }; }
    function createHeroSectionExample() {
        const section = createNode('section');
        section.content.layoutMode = 'flex-column';
        section.styles.desktop = {
            ...defaultStyleSet('section', section.content),
            padding: '72px 32px',
            gap: '20px',
            backgroundColor: '#eff6ff',
            borderRadius: '28px',
            textAlign: 'center',
        };
        section.children = [
            createNodeWithOverrides('heading', { text: 'Launch a polished visual experience', level: 1 }, { fontSize: '52px', fontWeight: '800', margin: '0', color: '#0f172a' }),
            createNodeWithOverrides('paragraph', { html: '<p>Use this hero starter for landing pages, product intros, and bold homepage openings.</p>' }, { fontSize: '18px', lineHeight: '1.7', color: '#334155', margin: '0 auto', width: 'min(100%, 760px)' }),
            createButtonRowExample(),
        ];
        return section;
    }
    function createFeatureSectionExample() {
        const section = createNode('section');
        section.content.layoutMode = 'flex-column';
        section.styles.desktop = {
            ...defaultStyleSet('section', section.content),
            padding: '40px 32px',
            gap: '18px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '24px',
        };
        const grid = createGridExample(3);
        grid.styles.desktop.margin = '0';
        section.children = [
            createNodeWithOverrides('heading', { text: 'Section example: feature highlights', level: 2, link: '' }, { fontSize: '36px', fontWeight: '700', margin: '0', color: '#0f172a' }),
            createNodeWithOverrides('paragraph', { html: '<p>Drop this section into a page, then replace the cards, spacing, and copy with your own content.</p>' }, { fontSize: '17px', color: '#475569', margin: '0' }),
            grid,
        ];
        return section;
    }
    function createGridExample(columns) {
        const container = createNode('container');
        container.content.layoutMode = 'grid';
        container.content.gridColumns = `repeat(${columns}, minmax(0, 1fr))`;
        container.styles.desktop = {
            ...defaultStyleSet('container', container.content),
            gap: '18px',
            padding: '24px',
            backgroundColor: '#f8fafc',
            border: '1px solid #dbe2ea',
            borderRadius: '22px',
        };
        container.children = Array.from({ length: columns }, (_, index) => createFeatureCard(index + 1));
        return container;
    }
    function createFeatureCard(index) {
        const card = createNode('container');
        card.content.layoutMode = 'flex-column';
        card.styles.desktop = {
            ...defaultStyleSet('container', card.content),
            margin: '0',
            padding: '22px',
            gap: '12px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            boxShadow: '0 12px 32px rgba(15, 23, 42, 0.06)',
        };
        card.children = [
            createNodeWithOverrides('heading', { text: `Grid card ${index}`, level: 3, link: '' }, { fontSize: '24px', fontWeight: '700', margin: '0', color: '#0f172a' }),
            createNodeWithOverrides('paragraph', { html: `<p>This is example card ${index}. Swap the content, icon, image, or CTA to build feature grids, service blocks, or team cards.</p>` }, { margin: '0', color: '#475569', lineHeight: '1.65' }),
            createNodeWithOverrides('button', { text: 'Learn more', link: '#', icon: '' }, { margin: '4px 0 0 0' }),
        ];
        return card;
    }
    function createButtonRowExample() {
        const columns = createColumnsNode(2);
        columns.styles.desktop = {
            ...columns.styles.desktop,
            width: 'min(100%, 420px)',
            margin: '0 auto',
            padding: '0',
            backgroundColor: 'transparent',
        };
        columns.children[0].styles.desktop = { ...columns.children[0].styles.desktop, margin: '0', padding: '0', backgroundColor: 'transparent' };
        columns.children[1].styles.desktop = { ...columns.children[1].styles.desktop, margin: '0', padding: '0', backgroundColor: 'transparent' };
        columns.children[0].children = [
            createNodeWithOverrides('button', { text: 'Primary action', link: '#', icon: '' }, { width: '100%', justifyContent: 'center' }),
        ];
        columns.children[1].children = [
            createNodeWithOverrides('button', { text: 'Secondary action', link: '#', icon: '' }, { width: '100%', justifyContent: 'center', backgroundColor: '#0f172a' }),
        ];
        return columns;
    }
    function createCompleteFormExample() {
        return createNodeWithOverrides('contact-form', {
            formName: 'complete_form',
            submitText: 'Submit form',
            fields: [
                { type: 'text', name: 'first_name', label: 'First name' },
                { type: 'text', name: 'last_name', label: 'Last name' },
                { type: 'email', name: 'email', label: 'Email address' },
                { type: 'number', name: 'phone', label: 'Phone number' },
                { type: 'date', name: 'preferred_date', label: 'Preferred date' },
                { type: 'select', name: 'service', label: 'Service', options: ['Website Design', 'SEO', 'Branding', 'Maintenance'] },
                { type: 'checkbox', name: 'services[]', label: 'Services needed', options: ['Design', 'Development', 'SEO', 'Support'] },
                { type: 'radio', name: 'budget', label: 'Budget range', options: ['Under 1,000', '1,000 - 5,000', '5,000 - 10,000', '10,000+'] },
                { type: 'file', name: 'brief', label: 'Project brief' },
                { type: 'textarea', name: 'message', label: 'Project details' },
            ],
        }, {
            padding: '28px',
            backgroundColor: '#ffffff',
            border: '1px solid #dbe2ea',
            borderRadius: '24px',
            boxShadow: '0 18px 44px rgba(15, 23, 42, 0.08)',
        });
    }
    function createNodeWithOverrides(type, content = {}, desktopStyles = {}, advanced = {}) {
        const node = createNode(type);
        node.content = { ...node.content, ...deepClone(content) };
        node.styles.desktop = { ...node.styles.desktop, ...desktopStyles };
        node.advanced = { ...node.advanced, ...advanced };
        return node;
    }
    function defaultStyleSet(type, content = {}) {
        const base = {
            width: '100%',
            margin: '0 0 16px 0',
            padding: ['container', 'section', 'inner-section', 'columns', 'column'].includes(type) ? '18px' : type === 'button' ? '12px 20px' : '0',
            color: '#0f172a',
        };
        if (['container', 'section', 'inner-section', 'columns', 'column'].includes(type)) {
            const layoutMode = content.layoutMode || (type === 'columns' ? 'flex-row' : 'flex-column');
            const layoutStyles = layoutMode === 'grid'
                ? {
                    display: 'grid',
                    gridTemplateColumns: content.gridColumns || 'repeat(2, minmax(0, 1fr))',
                }
                : {
                    display: 'flex',
                    flexDirection: layoutMode === 'flex-row' ? 'row' : 'column',
                };
            return {
                ...base,
                ...layoutStyles,
                gap: '16px',
                minHeight: '120px',
                backgroundColor: '#ffffff',
                borderRadius: '18px',
            };
        }
        if (type === 'button') {
            return {
                ...base,
                backgroundColor: '#2563eb',
                hoverBackgroundColor: '#1d4ed8',
                color: '#ffffff',
                borderRadius: '12px',
                borderWidth: '0px',
                borderColor: 'transparent',
                borderStyle: 'solid',
                width: 'auto',
                display: 'inline-flex'
            };
        }
        if (type === 'spacer') return { ...base, minHeight: '48px', margin: '0' };
        if (type === 'divider') return { ...base, border: '0', borderTop: '1px solid #cbd5e1', margin: '16px 0' };
        return base;
    }
    function defaultRepeaterItem(field, type) { if (field === 'items' && ['gallery','video-playlist'].includes(type)) return { src: '', title: 'Item', alt: '', caption: '' }; if (field === 'items' && ['tabs','accordion','toggle'].includes(type)) return { label: 'Item', content: '<p>Content</p>' }; if (field === 'items' && type === 'social-icons') return { icon: 'F', url: 'https://example.com' }; if (field === 'items' && type === 'icon-list') return { icon: '&#10003;', text: 'List item' }; if (field === 'items' && type === 'testimonial-slider') return { quote: 'Great service.', name: 'Client' }; if (field === 'fields') return { type: 'text', name: 'field_name', label: 'Field label' }; return { label: 'Item', value: '' }; }
    function getSelectedNode() { return state.selectedPath ? getNode(state.selectedPath) : null; }
    function getNode(path) { let current = { children: state.document.layout }; for (const index of path) { if (!Array.isArray(current.children) || !current.children[index]) return null; current = current.children[index]; } return current; }
    function getChildren(path) { if (!path.length) return state.document.layout; const parent = getNode(path); if (!parent.children) parent.children = []; return parent.children; }
    function insertNode(parentPath, index, node) { getChildren(parentPath).splice(index, 0, node); }
    function moveNode(sourcePath, destinationParentPath, destinationIndex) { if (isPathInside(destinationParentPath, sourcePath)) return; const sourceParentPath = sourcePath.slice(0, -1); const sourceIndex = sourcePath[sourcePath.length - 1]; const sourceChildren = getChildren(sourceParentPath); const [node] = sourceChildren.splice(sourceIndex, 1); if (!node) return; const destinationChildren = getChildren(destinationParentPath); let finalIndex = destinationIndex; if (samePath(sourceParentPath, destinationParentPath) && sourceIndex < destinationIndex) finalIndex -= 1; destinationChildren.splice(finalIndex, 0, node); state.selectedPath = [...destinationParentPath, finalIndex]; }
    function enableColumnResize(handle, columnsPath, leftIndex) { handle.addEventListener('mousedown', (event) => { event.preventDefault(); const columnsNode = getNode(columnsPath); if (!columnsNode) return; const leftColumn = columnsNode.children[leftIndex]; const rightColumn = columnsNode.children[leftIndex + 1]; const startX = event.clientX; const containerWidth = handle.parentElement.getBoundingClientRect().width; const leftStart = parseFloat(leftColumn.styles.desktop.width) || 50; const rightStart = parseFloat(rightColumn.styles.desktop.width) || 50; const onMove = (moveEvent) => { const deltaPercent = ((moveEvent.clientX - startX) / containerWidth) * 100; const leftWidth = Math.min(90, Math.max(10, leftStart + deltaPercent)); const rightWidth = Math.min(90, Math.max(10, rightStart - deltaPercent)); mutate(() => { leftColumn.styles.desktop.width = `${leftWidth}%`; rightColumn.styles.desktop.width = `${rightWidth}%`; }, false); }; const onUp = () => { pushHistorySnapshot(); repaint(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); }; window.addEventListener('mousemove', onMove); window.addEventListener('mouseup', onUp); }); }
    function getMenuItem(menuIndex, path) { let current = { children: state.menus[menuIndex].items }; for (const index of path) { current = current.children[index]; current.children = current.children || []; } return current; }
    function removeMenuItem(menuIndex, path) { const parentPath = path.slice(0, -1); const index = path[path.length - 1]; const siblings = parentPath.length ? getMenuItem(menuIndex, parentPath).children : state.menus[menuIndex].items; siblings.splice(index, 1); }
    function currentDocuments() { return state.activeDocumentType === 'template' ? state.documents.templates : state.documents.pages; }
    function updatePreviewLink() { elements.previewButton.dataset.previewSlug = state.document.slug || 'home'; }
    function bindShortcuts() {
        document.addEventListener('keydown', (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); saveCurrentDocument(); }
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); undo(); }
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); redo(); }
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'd') { event.preventDefault(); duplicateSelectedNode(); }
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') { if (state.selectedPath) { event.preventDefault(); copySelectedNode(); } }
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') { if (state.clipboard) { event.preventDefault(); pasteNodeFromClipboard(); } }
            if (event.key === 'Delete') deleteSelectedNode();
            if (event.key === 'Escape') closeContextMenu();
        });
    }
    function handleDocumentClick(event) {
        if (elements.contextMenu.contains(event.target)) return;
        if (
            elements.canvas.contains(event.target) ||
            event.target.closest('.vb-sidebar') ||
            event.target.closest('.vb-toolbar') ||
            event.target.closest('.vb-stage-toolbar') ||
            event.target.closest('.vb-footerbar')
        ) {
            closeContextMenu();
            return;
        }
        state.selectedPath = null;
        closeContextMenu();
        renderCanvas();
        renderInspector();
    }
    function handleGlobalContextMenuClose(event) {
        if (!event.target.closest('.vb-node')) {
            closeContextMenu();
        }
    }
    function openContextMenu(x, y) {
        elements.contextMenu.hidden = false;
        elements.contextMenu.style.left = `${x}px`;
        elements.contextMenu.style.top = `${y}px`;
    }
    function closeContextMenu() {
        elements.contextMenu.hidden = true;
        state.contextPath = null;
    }
    function handleContextAction(action) {
        if (state.contextPath) {
            state.selectedPath = state.contextPath;
        }
        if (action === 'duplicate') duplicateSelectedNode();
        if (action === 'delete') deleteSelectedNode();
        if (action === 'copy') copySelectedNode();
        if (action === 'paste') pasteNodeFromClipboard();
        if (action === 'save-template') {
            console.log('Save as template:', JSON.stringify(getSelectedNode(), null, 2));
            setStatus('Selected element logged as template JSON');
        }
        closeContextMenu();
    }
    function renderPreviewDocument() {
        const width = state.activeBreakpoint === 'tablet' ? '768px' : state.activeBreakpoint === 'mobile' ? '375px' : '100%';
        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(state.document.title || 'Preview')}</title>
<style>
body{margin:0;background:#f5f5f5;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#0f172a;padding:32px}
.preview-shell{max-width:${width};margin:0 auto;background:#fff;border-radius:24px;padding:24px;box-shadow:0 20px 50px rgba(15,23,42,.08)}
.preview-button{display:inline-flex;align-items:center;justify-content:center;text-decoration:none;border-style:solid;transition:background-color 120ms ease,border-color 120ms ease,color 120ms ease}
.preview-button:hover{background:var(--preview-button-hover-bg,var(--preview-button-bg,#2563eb))}
img{max-width:100%;height:auto;display:block}
</style>
</head>
<body>
<div class="preview-shell">${state.document.layout.map((node) => renderPreviewNode(node)).join('')}</div>
</body>
</html>`;
    }
    function renderPreviewNode(node) {
        const styleString = Object.entries(resolveNodeStyleSet(node, state.activeBreakpoint)).filter(([, value]) => value !== '' && value != null).map(([key, value]) => `${toKebabCase(key)}:${String(value)}`).join(';');
        const content = node.content || {};
        const children = (node.children || []).map((child) => renderPreviewNode(child)).join('');
        if (['section', 'container', 'inner-section', 'column', 'columns', 'popup'].includes(node.type)) return `<div style="${styleString}">${children}</div>`;
        if (node.type === 'heading') return `<h${normalizeHeadingLevel(content.level)} style="${styleString}">${escapeHtml(content.text || 'Heading')}</h${normalizeHeadingLevel(content.level)}>`;
        if (node.type === 'paragraph') return `<div style="${styleString}">${safeHtml(content.html || '<p>Paragraph</p>')}</div>`;
        if (node.type === 'button') return `<a href="${escapeAttribute(content.link || '#')}" class="preview-button" style="${createButtonPreviewStyleString(resolveNodeStyleSet(node, state.activeBreakpoint))}">${escapeHtml(content.text || 'Button')}</a>`;
        if (node.type === 'image') return content.src ? `<img src="${escapeAttribute(content.src)}" alt="${escapeAttribute(content.alt || '')}" style="${styleString}">` : '';
        if (node.type === 'divider') return `<hr style="${styleString}">`;
        if (node.type === 'spacer') return `<div style="${styleString}"></div>`;
        return `<div style="${styleString}">${getNodePreviewMarkup(node)}</div>`;
    }
    function toKebabCase(value) { return String(value || '').replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`); }
    function countNodes(nodes) {
        let total = 0;
        walkNodes(nodes || [], () => { total += 1; });
        return total;
    }
    function applyPreviewStyles(element, node) { const styleSet = resolveNodeStyleSet(node, state.activeBreakpoint); Object.entries(styleSet).forEach(([key, value]) => { if (value && key !== 'hoverBackgroundColor') element.style[key] = value; }); if (node.advanced.cssClass) element.classList.add(node.advanced.cssClass); }
    function normalizeButtonStyleSet(styleSet) {
        const next = { ...styleSet };
        if (next.borderColor && !next.borderWidth && !next.border) {
            next.borderWidth = '1px';
        }
        if (next.borderWidth && !next.borderStyle && !next.border) {
            next.borderStyle = 'solid';
        }
        if (!next.hoverBackgroundColor) {
            next.hoverBackgroundColor = next.backgroundColor || '#2563eb';
        }
        return next;
    }
    function applyButtonPreviewStyles(element, node) {
        const styleSet = normalizeButtonStyleSet(resolveNodeStyleSet(node, state.activeBreakpoint));
        Object.entries(styleSet).forEach(([key, value]) => {
            if (!value || key === 'hoverBackgroundColor' || key === 'backgroundColor') return;
            element.style[key] = value;
        });
        element.style.setProperty('--vb-button-bg', styleSet.backgroundColor || '#2563eb');
        element.style.setProperty('--vb-button-hover-bg', styleSet.hoverBackgroundColor || styleSet.backgroundColor || '#2563eb');
        if (!styleSet.border && styleSet.borderWidth) {
            element.style.borderStyle = styleSet.borderStyle || 'solid';
            element.style.borderWidth = styleSet.borderWidth;
            element.style.borderColor = styleSet.borderColor || 'transparent';
        }
    }
    function createButtonPreviewStyleString(styleSet) {
        const resolved = normalizeButtonStyleSet(styleSet);
        const entries = Object.entries(resolved)
            .filter(([key, value]) => value !== '' && value != null && key !== 'hoverBackgroundColor' && key !== 'backgroundColor')
            .map(([key, value]) => `${toKebabCase(key)}:${String(value)}`);
        entries.push(`--preview-button-bg:${resolved.backgroundColor || '#2563eb'}`);
        entries.push(`--preview-button-hover-bg:${resolved.hoverBackgroundColor || resolved.backgroundColor || '#2563eb'}`);
        return entries.join(';');
    }
    function getTypographyApi() { return window.CMSTypographyInspector || null; }
    function supportsTypographyInspector(node) { return !!(node && getTypographyApi() && TYPOGRAPHY_WIDGET_TYPES.includes(node.type)); }
    function ensureNodeTypographyState(node) {
        const api = getTypographyApi();
        if (!api || !node) return null;
        const hadTypography = !!(node.props && node.props.typography);
        const typography = api.ensureTypographyState(node);
        if (!hadTypography) {
            const seedStyles = node.styles?.[state.activeBreakpoint] || node.styles?.desktop || {};
            TYPOGRAPHY_STYLE_KEYS.forEach((key) => {
                if (seedStyles[key]) api.updateTypographyOverride(node, key, seedStyles[key]);
            });
        }
        return typography;
    }
    function resolveNodeStyleSet(node, breakpoint = state.activeBreakpoint) {
        const styleSet = { ...(node.styles?.desktop || {}), ...(node.styles?.[breakpoint] || {}) };
        if (supportsTypographyInspector(node) && node.props?.typography) {
            const computed = getTypographyApi().computeWidgetTypography(node);
            TYPOGRAPHY_STYLE_KEYS.forEach((key) => {
                if (computed[key]) styleSet[key] = computed[key];
            });
        }
        return styleSet;
    }
    function renderAdditionalStyleFields(styleState) {
        return STYLE_FIELDS
            .filter(([key]) => !TYPOGRAPHY_STYLE_KEYS.includes(key) && key !== 'fontFamily')
            .map(([key, label]) => renderStyleField(styleState, key, label))
            .join('');
    }
    function renderStyleField(styleState, key, label) {
        const value = styleState[key] || '';
        if (isColorStyleField(key)) {
            return `<label><span>${label}</span><div class="inspector-color-row"><input type="color" data-style-color-picker="${key}" value="${escapeAttribute(colorPickerValue(value))}"><input type="text" data-style-field="${key}" value="${escapeAttribute(value)}" placeholder="Inherit"></div></label>`;
        }
        if (key === 'borderWidth') {
            return `<label><span>${label}</span><div class="inspector-input-unit"><input type="number" min="0" step="1" data-style-field="${key}" value="${escapeAttribute(stripPx(value))}" placeholder="0"><span>px</span></div></label>`;
        }
        return `<label><span>${label}</span><input type="text" data-style-field="${key}" value="${escapeAttribute(value)}"></label>`;
    }
    function isColorStyleField(key) {
        return ['backgroundColor', 'hoverBackgroundColor', 'color', 'borderColor'].includes(key);
    }
    function colorPickerValue(value) {
        const raw = String(value || '').trim();
        if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();
        if (/^#[0-9a-f]{3}$/i.test(raw)) return (`#${raw[1]}${raw[1]}${raw[2]}${raw[2]}${raw[3]}${raw[3]}`).toLowerCase();
        return '#2563eb';
    }
    function stripPx(value) {
        return String(value || '').replace(/px$/i, '');
    }
    function renderHeadingLevelField(value) {
        const warning = getH1WarningMessage();
        return `<label><span>Heading level${warning ? ` <strong class="vb-field-warning">${escapeHtml(warning)}</strong>` : ''}</span><select data-content-field="level">${['1','2','3','4','5','6'].map((option) => `<option value="${option}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('')}</select></label>`;
    }
    function countH1Nodes(nodes) {
        let total = 0;
        walkNodes(nodes || [], (node) => {
            if (node?.type === 'heading' && String(node.content?.level || '2') === '1') {
                total += 1;
            }
        });
        return total;
    }
    function getH1WarningMessage() {
        const total = countH1Nodes(state.document.layout);
        return total > 1 ? `${total} H1 tags on this page` : '';
    }
    function normalizeHeadingLevel(value) {
        const level = Number(value) || 2;
        return Math.min(6, Math.max(1, level));
    }
    function textField(key, label, value) { return `<label><span>${label}</span><input type="text" data-content-field="${key}" value="${escapeAttribute(value || '')}"></label>`; }
    function numberField(key, label, value) { return `<label><span>${label}</span><input type="number" data-content-field="${key}" value="${escapeAttribute(String(value || 0))}"></label>`; }
    function textareaField(key, label, value, rows = 4) { return `<label><span>${label}</span><textarea data-content-field="${key}" rows="${rows}">${escapeHtml(value || '')}</textarea></label>`; }
    function selectField(key, label, value, options, labels) { return `<label><span>${label}</span><select data-content-field="${key}">${options.map((option, index) => `<option value="${escapeAttribute(option)}" ${String(value) === String(option) ? 'selected' : ''}>${escapeHtml(labels ? labels[index] : option)}</option>`).join('')}</select></label>`; }
    function toggleField(key, label, checked) { return `<label><input type="checkbox" data-content-field="${key}" ${checked ? 'checked' : ''}> ${label}</label>`; }
    function repeaterField(field, label, items, type) { return `<div class="vb-repeaters"><div class="vb-panel-head"><h3>${label}</h3><button type="button" class="vb-button" data-repeater-add="${field}">Add</button></div>${items.map((item, index) => `<div class="vb-repeater-item">${Object.keys(item).map((key) => `<label><span>${startCase(key)}</span>${typeof item[key] === 'boolean' ? `<input type="checkbox" data-repeater-input data-repeater-field="${field}" data-repeater-index="${index}" data-repeater-key="${key}" ${item[key] ? 'checked' : ''}>` : `<input type="text" data-repeater-input data-repeater-field="${field}" data-repeater-index="${index}" data-repeater-key="${key}" value="${escapeAttribute(item[key] || '')}">`}</label>`).join('')}<button type="button" class="vb-button" data-repeater-remove data-repeater-field="${field}" data-repeater-index="${index}">Remove</button></div>`).join('')}${!items.length ? `<p class="vb-helper">No ${type} configured yet.</p>` : ''}</div>`; }
    async function postJson(url, payload) { return fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrfToken }, body: JSON.stringify(payload) }); }
    function readDragPayload(event) { try { return JSON.parse(event.dataTransfer.getData('text/plain') || '{}'); } catch (error) { return state.dragPayload; } }
    function deepClone(value) { return JSON.parse(JSON.stringify(value)); }
    function cloneNode(node) { const copy = deepClone(node); walkNodes([copy], (item) => { item.id = generateId(item.type); }); return copy; }
    function walkNodes(nodes, callback) { nodes.forEach((node) => { callback(node); if (node.children?.length) walkNodes(node.children, callback); }); }
    function generateId(type) { return `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
    function samePath(a, b) { return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((value, index) => value === b[index]); }
    function isPathInside(parent, child) { return Array.isArray(parent) && Array.isArray(child) && parent.length >= child.length && child.every((value, index) => parent[index] === value); }
    function labelForType(type) { return widgetMap[type]?.label || startCase(type); }
    function canAcceptChildren(type) { return ['section', 'container', 'inner-section', 'column', 'popup'].includes(type); }
    function sanitizeSlug(value) { return String(value || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''); }
    function startCase(value) { return String(value || '').replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }
    function setStatus(message) { elements.saveStatus.textContent = message; }
    function escapeHtml(value) { return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
    function escapeAttribute(value) { return escapeHtml(value); }
    function safeHtml(html) { return String(html || ''); }
})();
