(function () {
    const config = window.CMS_CONFIG;
    const state = {
        pages: [],
        page: emptyPage('home'),
        selectedPath: null,
        dragPayload: null,
        csrfToken: config.csrfToken,
    };

    const elements = {
        pageSelect: document.getElementById('pageSelect'),
        newPageButton: document.getElementById('newPageButton'),
        savePageButton: document.getElementById('savePageButton'),
        viewPageButton: document.getElementById('viewPageButton'),
        saveStatus: document.getElementById('saveStatus'),
        canvas: document.getElementById('canvas'),
        propertiesPanel: document.getElementById('propertiesPanel'),
        pageSettingsForm: document.getElementById('pageSettingsForm'),
        palette: document.getElementById('palette'),
    };

    init();

    async function init() {
        bindPalette();
        bindPageControls();
        bindPageSettings();
        setStatus('Loading pages...');
        await loadPages();
        await loadPage(state.pages[0]?.slug || 'home');
        document.addEventListener('click', handleGlobalClick);
    }

    function emptyPage(slug) {
        return {
            slug,
            title: slug === 'home' ? 'Home' : slug,
            seo_title: slug === 'home' ? 'Home' : slug,
            seo_description: '',
            seo_keywords: '',
            canonical_url: '',
            og_image: '',
            layout: [],
        };
    }

    function bindPalette() {
        elements.palette.querySelectorAll('[data-type]').forEach((item) => {
            item.addEventListener('dragstart', (event) => {
                const payload = { source: 'palette', type: item.dataset.type };
                state.dragPayload = payload;
                event.dataTransfer.setData('text/plain', JSON.stringify(payload));
                event.dataTransfer.effectAllowed = 'copy';
            });
        });
    }

    function bindPageControls() {
        elements.pageSelect.addEventListener('change', async (event) => {
            await loadPage(event.target.value);
        });

        elements.newPageButton.addEventListener('click', () => {
            const rawSlug = window.prompt('Enter a page slug (for example: about-us)');
            if (!rawSlug) return;

            const slug = sanitizeSlug(rawSlug);
            if (!slug) {
                window.alert('Please enter a valid slug using letters, numbers, or dashes.');
                return;
            }

            state.page = emptyPage(slug);
            state.selectedPath = null;
            if (!state.pages.find((page) => page.slug === slug)) {
                state.pages = [{ slug, title: slug }, ...state.pages];
            }
            renderPageOptions();
            hydratePageSettings();
            updateViewLink();
            renderCanvas();
            renderPropertiesPanel();
            elements.pageSelect.value = slug;
            setStatus('New page ready. Save when you are happy with it.');
        });

        elements.savePageButton.addEventListener('click', async () => {
            await saveCurrentPage();
        });
    }

    function bindPageSettings() {
        elements.pageSettingsForm.addEventListener('input', () => {
            const formData = new FormData(elements.pageSettingsForm);
            state.page.slug = sanitizeSlug(formData.get('slug') || 'home') || 'home';
            state.page.title = String(formData.get('title') || '');
            state.page.seo_title = String(formData.get('seo_title') || '');
            state.page.seo_description = String(formData.get('seo_description') || '');
            state.page.seo_keywords = String(formData.get('seo_keywords') || '');
            state.page.canonical_url = String(formData.get('canonical_url') || '');
            state.page.og_image = String(formData.get('og_image') || '');
            updateViewLink();
        });
    }

    async function loadPages() {
        const response = await fetch(config.endpoints.pages, { credentials: 'same-origin' });
        const data = await response.json();
        state.pages = Array.isArray(data.pages) ? data.pages : [];
        if (data.csrf_token) state.csrfToken = data.csrf_token;
        renderPageOptions();
    }

    async function loadPage(slug) {
        setStatus('Loading page...');
        const response = await fetch(`${config.endpoints.page}?slug=${encodeURIComponent(slug)}`, {
            credentials: 'same-origin',
        });
        const data = await response.json();
        state.page = data.page || emptyPage(slug);
        state.page.layout = Array.isArray(state.page.layout) ? state.page.layout : [];
        state.selectedPath = null;
        hydratePageSettings();
        updateViewLink();
        renderCanvas();
        renderPropertiesPanel();
        elements.pageSelect.value = state.page.slug;
        setStatus('Ready');
    }

    async function saveCurrentPage() {
        setStatus('Saving...');
        const response = await fetch(config.endpoints.savePage, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': state.csrfToken,
            },
            body: JSON.stringify(state.page),
        });
        const data = await response.json();

        if (!response.ok) {
            window.alert(data.error || 'Unable to save the page.');
            setStatus('Save failed');
            return;
        }

        state.page = data.page;
        const existing = state.pages.find((page) => page.slug === state.page.slug);
        if (existing) {
            existing.title = state.page.title;
        } else {
            state.pages.push({ slug: state.page.slug, title: state.page.title });
        }

        renderPageOptions();
        hydratePageSettings();
        updateViewLink();
        elements.pageSelect.value = state.page.slug;
        setStatus('Saved');
    }

    function renderPageOptions() {
        const currentSlug = state.page.slug;
        elements.pageSelect.innerHTML = '';
        const pages = state.pages.length ? state.pages : [{ slug: currentSlug, title: currentSlug }];

        pages.forEach((page) => {
            const option = document.createElement('option');
            option.value = page.slug;
            option.textContent = `${page.title || page.slug} (${page.slug})`;
            elements.pageSelect.appendChild(option);
        });
    }

    function hydratePageSettings() {
        document.getElementById('pageSlug').value = state.page.slug || '';
        document.getElementById('pageTitle').value = state.page.title || '';
        document.getElementById('seoTitle').value = state.page.seo_title || '';
        document.getElementById('seoDescription').value = state.page.seo_description || '';
        document.getElementById('seoKeywords').value = state.page.seo_keywords || '';
        document.getElementById('canonicalUrl').value = state.page.canonical_url || '';
        document.getElementById('ogImage').value = state.page.og_image || '';
    }

    function updateViewLink() {
        const slug = state.page.slug || 'home';
        elements.viewPageButton.href = `${config.publicBase}${encodeURIComponent(slug)}`;
    }

    function renderCanvas() {
        elements.canvas.innerHTML = '';

        if (!state.page.layout.length) {
            const empty = document.createElement('div');
            empty.className = 'cms-empty-canvas';
            empty.innerHTML = '<div><strong>Canvas is empty.</strong><br>Drag an element here to start building the page.</div>';
            empty.addEventListener('dragover', (event) => {
                event.preventDefault();
                empty.classList.add('is-active');
            });
            empty.addEventListener('dragleave', () => {
                empty.classList.remove('is-active');
            });
            empty.addEventListener('drop', (event) => {
                event.preventDefault();
                empty.classList.remove('is-active');
                const payload = getDragPayload(event);
                if (!payload) return;
                if (payload.source === 'palette') {
                    insertNode([], 0, createDefaultNode(payload.type));
                    state.selectedPath = [0];
                } else if (payload.source === 'canvas') {
                    moveNode(payload.path, [], 0);
                }
                renderCanvas();
                renderPropertiesPanel();
            });
            elements.canvas.appendChild(empty);
            return;
        }

        renderDropzone(elements.canvas, [], 0);
        state.page.layout.forEach((node, index) => {
            elements.canvas.appendChild(createNodeElement(node, [index]));
            renderDropzone(elements.canvas, [], index + 1);
        });
    }

    function createNodeElement(node, path) {
        const wrapper = document.createElement('div');
        wrapper.className = `cms-node cms-node--${node.type}`;
        if (node.type === 'container') wrapper.classList.add('cms-node--container');
        if (samePath(path, state.selectedPath)) wrapper.classList.add('is-selected');
        wrapper.draggable = true;

        wrapper.addEventListener('dragstart', (event) => {
            const payload = { source: 'canvas', path };
            state.dragPayload = payload;
            event.dataTransfer.setData('text/plain', JSON.stringify(payload));
            event.dataTransfer.effectAllowed = 'move';
        });

        wrapper.addEventListener('click', (event) => {
            event.stopPropagation();
            state.selectedPath = path;
            renderCanvas();
            renderPropertiesPanel();
        });

        const badge = document.createElement('div');
        badge.className = 'cms-node__badge';
        badge.textContent = node.type;
        wrapper.appendChild(badge);

        const toolbar = document.createElement('div');
        toolbar.className = 'cms-node__toolbar';
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            deleteNode(path);
        });
        toolbar.appendChild(deleteButton);
        wrapper.appendChild(toolbar);

        applyNodeStyles(wrapper, node);

        if (node.type === 'heading' || node.type === 'paragraph') {
            wrapper.textContent = node.content || (node.type === 'heading' ? 'Heading text' : 'Paragraph text');
            wrapper.prepend(badge);
            wrapper.appendChild(toolbar);
            return wrapper;
        }

        if (node.type === 'button') {
            const anchor = document.createElement('a');
            anchor.href = node.link || '#';
            anchor.textContent = node.content || 'Button';
            applyNodeStyles(anchor, node);
            wrapper.appendChild(anchor);
            return wrapper;
        }

        if (node.type === 'image') {
            if (node.imageUrl) {
                const image = document.createElement('img');
                image.src = node.imageUrl;
                image.alt = '';
                wrapper.appendChild(image);
            } else {
                const placeholder = document.createElement('div');
                placeholder.className = 'cms-placeholder-image';
                placeholder.textContent = 'Add an image URL or upload one.';
                wrapper.appendChild(placeholder);
            }
            return wrapper;
        }

        const children = Array.isArray(node.children) ? node.children : [];
        if (!children.length) {
            const empty = document.createElement('div');
            empty.className = 'cms-node-empty';
            empty.textContent = 'Drop elements into this container.';
            wrapper.appendChild(empty);
        }

        renderDropzone(wrapper, path, 0);
        children.forEach((child, index) => {
            wrapper.appendChild(createNodeElement(child, [...path, index]));
            renderDropzone(wrapper, path, index + 1);
        });

        return wrapper;
    }

    function renderDropzone(parent, parentPath, index) {
        const zone = document.createElement('div');
        zone.className = 'cms-dropzone';
        zone.addEventListener('dragover', (event) => {
            event.preventDefault();
            zone.classList.add('is-active');
            event.dataTransfer.dropEffect = state.dragPayload?.source === 'palette' ? 'copy' : 'move';
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('is-active'));
        zone.addEventListener('drop', (event) => {
            event.preventDefault();
            zone.classList.remove('is-active');
            const payload = getDragPayload(event);
            if (!payload) return;
            if (payload.source === 'palette') {
                insertNode(parentPath, index, createDefaultNode(payload.type));
                state.selectedPath = [...parentPath, index];
            } else if (payload.source === 'canvas') {
                moveNode(payload.path, parentPath, index);
            }
            renderCanvas();
            renderPropertiesPanel();
        });
        parent.appendChild(zone);
    }

    function renderPropertiesPanel() {
        const node = state.selectedPath ? getNode(state.selectedPath) : null;
        if (!node) {
            elements.propertiesPanel.className = 'cms-properties-empty';
            elements.propertiesPanel.textContent = 'Select an element on the canvas to edit its content and styles.';
            return;
        }

        elements.propertiesPanel.className = '';
        elements.propertiesPanel.innerHTML = `
            <form class="cms-properties-form" id="propertiesForm">
                <div class="cms-properties-section">
                    <h3>Element</h3>
                    <label>
                        <span>Type</span>
                        <input type="text" value="${escapeHtml(node.type)}" disabled>
                    </label>
                    ${renderContentFields(node)}
                </div>
                <div class="cms-properties-section">
                    <h3>Style</h3>
                    <div class="cms-properties-grid">
                        ${renderStyleField('backgroundColor', 'Background', node.styles.backgroundColor || '')}
                        ${renderStyleField('color', 'Text color', node.styles.color || '')}
                        ${renderStyleField('fontSize', 'Font size', node.styles.fontSize || '')}
                        ${renderStyleField('width', 'Width', node.styles.width || '')}
                        ${renderStyleField('padding', 'Padding', node.styles.padding || '')}
                        ${renderStyleField('margin', 'Margin', node.styles.margin || '')}
                        ${renderStyleField('borderRadius', 'Radius', node.styles.borderRadius || '')}
                        ${renderSelectField('textAlign', 'Alignment', node.styles.textAlign || '', ['left', 'center', 'right'])}
                    </div>
                </div>
                ${node.type === 'container' ? `
                    <div class="cms-properties-section">
                        <h3>Container layout</h3>
                        <div class="cms-properties-grid">
                            ${renderSelectField('flexDirection', 'Direction', node.styles.flexDirection || 'column', ['column', 'row'])}
                            ${renderSelectField('justifyContent', 'Justify', node.styles.justifyContent || 'flex-start', ['flex-start', 'center', 'space-between', 'space-around'])}
                            ${renderSelectField('alignItems', 'Align items', node.styles.alignItems || 'stretch', ['stretch', 'flex-start', 'center', 'flex-end'])}
                            ${renderStyleField('gap', 'Gap', node.styles.gap || '')}
                        </div>
                    </div>
                ` : ''}
            </form>
        `;

        const form = document.getElementById('propertiesForm');
        form.addEventListener('input', handlePropertiesInput);

        const uploadInput = document.getElementById('imageUploadInput');
        if (uploadInput) {
            uploadInput.addEventListener('change', async (event) => {
                const file = event.target.files[0];
                if (file) await uploadImage(file);
            });
        }
    }

    function renderContentFields(node) {
        if (node.type === 'heading' || node.type === 'paragraph' || node.type === 'button') {
            return `
                <label>
                    <span>Text</span>
                    <textarea name="content" rows="${node.type === 'heading' ? 2 : 4}">${escapeHtml(node.content || '')}</textarea>
                </label>
                ${node.type === 'button' ? `
                    <label>
                        <span>Button link</span>
                        <input type="text" name="link" value="${escapeHtml(node.link || '')}" placeholder="https://example.com">
                    </label>
                ` : ''}
            `;
        }

        if (node.type === 'image') {
            return `
                <label>
                    <span>Image URL</span>
                    <input type="text" name="imageUrl" value="${escapeHtml(node.imageUrl || '')}" placeholder="/uploads/example.jpg">
                </label>
                <label>
                    <span>Upload image</span>
                    <input type="file" id="imageUploadInput" accept="image/*">
                    <span class="cms-upload-status">Images are uploaded into the /uploads folder and inserted automatically.</span>
                </label>
            `;
        }

        return '<p class="cms-upload-status">Containers hold other elements. Adjust layout settings below.</p>';
    }

    function renderStyleField(name, label, value) {
        return `
            <label>
                <span>${label}</span>
                <input type="text" name="style:${name}" value="${escapeHtml(value)}">
            </label>
        `;
    }

    function renderSelectField(name, label, currentValue, options) {
        const optionsHtml = options.map((option) => `
            <option value="${option}" ${currentValue === option ? 'selected' : ''}>${option}</option>
        `).join('');

        return `
            <label>
                <span>${label}</span>
                <select name="style:${name}">
                    <option value="">Default</option>
                    ${optionsHtml}
                </select>
            </label>
        `;
    }

    function handlePropertiesInput(event) {
        const node = getNode(state.selectedPath);
        if (!node) return;

        const { name, value } = event.target;
        if (name === 'content') node.content = value;
        if (name === 'link') node.link = value;
        if (name === 'imageUrl') node.imageUrl = value;
        if (name.startsWith('style:')) node.styles[name.replace('style:', '')] = value;

        renderCanvas();
        renderPropertiesPanel();
    }

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('csrf_token', state.csrfToken);

        setStatus('Uploading image...');
        const response = await fetch(config.endpoints.uploadImage, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin',
            headers: {
                'X-CSRF-Token': state.csrfToken,
            },
        });
        const data = await response.json();

        if (!response.ok) {
            window.alert(data.error || 'Upload failed.');
            setStatus('Upload failed');
            return;
        }

        const node = getNode(state.selectedPath);
        if (node) node.imageUrl = data.url;
        renderCanvas();
        renderPropertiesPanel();
        setStatus('Image uploaded');
    }

    function createDefaultNode(type) {
        const id = `node-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const common = {
            backgroundColor: '',
            color: '#0f172a',
            fontSize: type === 'heading' ? '42px' : '16px',
            padding: type === 'container' ? '24px' : type === 'button' ? '14px 20px' : '0',
            margin: '0 0 16px 0',
            borderRadius: type === 'button' ? '12px' : type === 'container' ? '18px' : '0',
            width: '100%',
            textAlign: type === 'button' ? 'center' : 'left',
        };

        if (type === 'container') {
            return {
                id,
                type,
                content: '',
                styles: {
                    ...common,
                    backgroundColor: '#f8fafc',
                    flexDirection: 'column',
                    justifyContent: 'flex-start',
                    alignItems: 'stretch',
                    gap: '16px',
                },
                children: [],
            };
        }

        if (type === 'button') {
            return {
                id,
                type,
                content: 'Button text',
                link: '#',
                styles: {
                    ...common,
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    width: 'auto',
                },
            };
        }

        if (type === 'image') {
            return {
                id,
                type,
                content: '',
                imageUrl: '',
                styles: {
                    ...common,
                    fontSize: '',
                    padding: '0',
                    borderRadius: '16px',
                },
            };
        }

        return {
            id,
            type,
            content: type === 'heading' ? 'New heading' : 'New paragraph text',
            styles: common,
        };
    }

    function applyNodeStyles(element, node) {
        const styles = node.styles || {};
        if (styles.backgroundColor) element.style.backgroundColor = styles.backgroundColor;
        if (styles.color) element.style.color = styles.color;
        if (styles.fontSize) element.style.fontSize = styles.fontSize;
        if (styles.padding) element.style.padding = styles.padding;
        if (styles.margin) element.style.margin = styles.margin;
        if (styles.borderRadius) element.style.borderRadius = styles.borderRadius;
        if (styles.width) element.style.width = styles.width;
        if (styles.textAlign) element.style.textAlign = styles.textAlign;
        if (node.type === 'container') {
            element.style.display = 'flex';
            element.style.flexDirection = styles.flexDirection || 'column';
            element.style.justifyContent = styles.justifyContent || 'flex-start';
            element.style.alignItems = styles.alignItems || 'stretch';
            if (styles.gap) element.style.gap = styles.gap;
        }
    }

    function getNode(path) {
        let current = { children: state.page.layout };
        for (const index of path) {
            if (!Array.isArray(current.children) || !current.children[index]) return null;
            current = current.children[index];
        }
        return current;
    }

    function getChildren(parentPath) {
        if (!parentPath.length) return state.page.layout;
        const parentNode = getNode(parentPath);
        if (!parentNode) return null;
        if (!Array.isArray(parentNode.children)) parentNode.children = [];
        return parentNode.children;
    }

    function insertNode(parentPath, index, node) {
        const children = getChildren(parentPath);
        if (children) children.splice(index, 0, node);
    }

    function deleteNode(path) {
        if (!window.confirm('Delete this element?')) return;
        const parentPath = path.slice(0, -1);
        const index = path[path.length - 1];
        const children = getChildren(parentPath);
        children.splice(index, 1);
        state.selectedPath = null;
        renderCanvas();
        renderPropertiesPanel();
        setStatus('Element removed');
    }

    function moveNode(sourcePath, destinationParentPath, destinationIndex) {
        if (isPathInside(destinationParentPath, sourcePath)) return;
        const sourceParentPath = sourcePath.slice(0, -1);
        const sourceIndex = sourcePath[sourcePath.length - 1];
        const sourceChildren = getChildren(sourceParentPath);
        const [node] = sourceChildren.splice(sourceIndex, 1);
        if (!node) return;
        const destinationChildren = getChildren(destinationParentPath);
        let index = destinationIndex;
        if (samePath(sourceParentPath, destinationParentPath) && sourceIndex < destinationIndex) index -= 1;
        destinationChildren.splice(index, 0, node);
        state.selectedPath = [...destinationParentPath, index];
    }

    function getDragPayload(event) {
        const raw = event.dataTransfer.getData('text/plain');
        if (!raw) return state.dragPayload;
        try {
            const payload = JSON.parse(raw);
            if (Array.isArray(payload.path)) payload.path = payload.path.map(Number);
            return payload;
        } catch (error) {
            return state.dragPayload;
        }
    }

    function handleGlobalClick(event) {
        if (elements.canvas.contains(event.target) || elements.propertiesPanel.contains(event.target)) return;
        state.selectedPath = null;
        renderCanvas();
        renderPropertiesPanel();
    }

    function samePath(a, b) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
        return a.every((value, index) => value === b[index]);
    }

    function isPathInside(candidateParent, candidateChild) {
        if (!Array.isArray(candidateParent) || !Array.isArray(candidateChild)) return false;
        if (candidateParent.length < candidateChild.length) return false;
        return candidateChild.every((value, index) => candidateParent[index] === value);
    }

    function sanitizeSlug(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function setStatus(message) {
        elements.saveStatus.textContent = message;
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
})();
