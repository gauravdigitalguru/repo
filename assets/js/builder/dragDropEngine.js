(function () {
    function initDragDropEngine(options) {
        const cfg = normalizeConfig(options);
        const rules = resolveRules(cfg);
        const marker = resolveMarker(cfg);
        const state = {
            panelRoot: null,
            canvasRoot: null,
            payload: null,
            sourceEl: null,
            activeContainerEl: null,
            invalidEl: null,
            ghostEl: null,
            dragImageEl: null,
            insertion: null,
            attached: false,
        };

        if (cfg.autoAttach) attach(cfg.panelRoot, cfg.canvasRoot);

        return {
            attach,
            detach,
            handlePanelDragStart,
            handleCanvasDragOver,
            handleCanvasDrop,
            handleCanvasDragLeave,
            handleDragEnd,
            cleanupDragState: cleanup,
            cancelDrag() {
                cleanup();
                call(cfg.onCancel);
            },
            resolveDropTarget(event) {
                return resolveDropTarget(event);
            },
            calculateInsertion(targetMeta, event) {
                return calculateInsertion(targetMeta, event);
            },
            getState() {
                return {
                    payload: state.payload ? clone(state.payload) : null,
                    insertion: state.insertion ? { ...state.insertion } : null,
                };
            },
        };

        function attach(panelRoot, canvasRoot) {
            detach();
            state.panelRoot = panelRoot instanceof Element ? panelRoot : cfg.panelRoot;
            state.canvasRoot = canvasRoot instanceof Element ? canvasRoot : cfg.canvasRoot;

            if (state.panelRoot) {
                state.panelRoot.addEventListener('dragstart', handlePanelDragStart);
                state.panelRoot.addEventListener('dragend', handleDragEnd);
            }
            if (state.canvasRoot) {
                state.canvasRoot.addEventListener('dragover', handleCanvasDragOver);
                state.canvasRoot.addEventListener('drop', handleCanvasDrop);
                state.canvasRoot.addEventListener('dragleave', handleCanvasDragLeave);
            }
            document.addEventListener('dragover', handleDocumentDragOver);
            document.addEventListener('drop', handleDocumentDrop, true);
            document.addEventListener('dragend', handleDragEnd, true);
            document.addEventListener('keydown', handleKeyDown, true);
            state.attached = true;
        }

        function detach() {
            if (!state.attached) return;
            if (state.panelRoot) {
                state.panelRoot.removeEventListener('dragstart', handlePanelDragStart);
                state.panelRoot.removeEventListener('dragend', handleDragEnd);
            }
            if (state.canvasRoot) {
                state.canvasRoot.removeEventListener('dragover', handleCanvasDragOver);
                state.canvasRoot.removeEventListener('drop', handleCanvasDrop);
                state.canvasRoot.removeEventListener('dragleave', handleCanvasDragLeave);
            }
            document.removeEventListener('dragover', handleDocumentDragOver);
            document.removeEventListener('drop', handleDocumentDrop, true);
            document.removeEventListener('dragend', handleDragEnd, true);
            document.removeEventListener('keydown', handleKeyDown, true);
            cleanup();
            state.attached = false;
        }

        function handlePanelDragStart(event) {
            const sourceEl = getPanelWidgetElement(event.target);
            if (!sourceEl) return;

            const payload = buildPayload(sourceEl, event);
            if (!payload) {
                event.preventDefault();
                return;
            }

            state.payload = payload;
            state.sourceEl = sourceEl;
            sourceEl.classList.add(cfg.classes.draggingSource);
            if (state.canvasRoot) state.canvasRoot.classList.add(cfg.classes.canvasDragActive);
            document.body.classList.add(cfg.classes.bodyDragActive);
            updateGhost(payload, event.clientX || 0, event.clientY || 0);

            if (event.dataTransfer) {
                const raw = JSON.stringify(payload);
                event.dataTransfer.effectAllowed = 'copy';
                event.dataTransfer.setData('application/json', raw);
                event.dataTransfer.setData('text/plain', raw);
                event.dataTransfer.setDragImage(ensureDragImage(payload), 16, 16);
            }

            call(cfg.onDragStart, payload, event);
        }

        function handleCanvasDragOver(event) {
            const payload = getPayload(event);
            if (!isWidgetPayload(payload)) return;

            const target = resolveDropTarget(event);
            event.preventDefault();
            if (event.dataTransfer) event.dataTransfer.dropEffect = target.valid ? 'copy' : 'none';

            if (!target.valid) {
                setInvalid(target.invalidEl || null);
                clearActive();
                marker.clear();
                return;
            }

            clearInvalid();
            setActive(target.containerEl, target.empty);
            state.insertion = target.insertion;
            marker.show(target.insertion);
            call(cfg.onTargetChange, target, payload, event);
        }

        function handleCanvasDrop(event) {
            const payload = getPayload(event);
            if (!isWidgetPayload(payload)) return;
            event.preventDefault();
            event.stopPropagation();

            const target = resolveDropTarget(event);
            if (!target.valid) {
                fail(target, payload, event);
                cleanup();
                return;
            }

            const widget = cfg.createWidget(payload.widgetType, payload, cfg.factoryOptions);
            if (!widget) {
                fail({ reason: 'Failed to create widget.' }, payload, event);
                cleanup();
                return;
            }

            const detail = {
                payload: clone(payload),
                widget,
                target: {
                    containerEl: target.containerEl,
                    containerId: target.containerId,
                    containerPath: target.containerPath ? target.containerPath.slice() : null,
                    containerNode: target.containerNode || null,
                    layout: target.layout,
                    empty: !!target.empty,
                },
                insertion: { ...target.insertion },
                event,
            };

            if (call(cfg.onDrop, detail) !== false) {
                call(cfg.onSelectInserted, detail);
                call(cfg.onOpenInspector, detail);
                call(cfg.onAfterDrop, detail);
            }

            cleanup();
        }

        function handleCanvasDragLeave(event) {
            if (!state.canvasRoot || event.currentTarget !== state.canvasRoot) return;
            if (state.canvasRoot.contains(event.relatedTarget)) return;
            clearActive();
            clearInvalid();
            marker.clear();
        }

        function handleDocumentDragOver(event) {
            const payload = getPayload(event);
            if (!isWidgetPayload(payload)) return;
            updateGhost(payload, event.clientX || 0, event.clientY || 0);
            if (!state.canvasRoot || !(event.target instanceof Element) || state.canvasRoot.contains(event.target)) return;
            clearActive();
            clearInvalid();
            marker.clear();
        }

        function handleDocumentDrop(event) {
            const payload = getPayload(event);
            if (!isWidgetPayload(payload)) return;
            event.preventDefault();
            if (state.canvasRoot && event.target instanceof Element && state.canvasRoot.contains(event.target)) return;
            fail({ reason: 'Widgets can only be dropped into containers.' }, payload, event);
            cleanup();
        }

        function handleKeyDown(event) {
            if (!state.payload || event.key !== 'Escape') return;
            event.preventDefault();
            cleanup();
            call(cfg.onCancel);
        }

        function handleDragEnd() {
            if (!state.payload) return;
            cleanup();
            call(cfg.onDragEnd);
        }

        function resolveDropTarget(event) {
            if (typeof cfg.resolveDropTarget === 'function') {
                const custom = cfg.resolveDropTarget({ event, payload: state.payload, canvasRoot: state.canvasRoot });
                const normalized = normalizeCustomTarget(custom);
                if (normalized) return normalized;
            }

            const startEl = event.target instanceof Element ? event.target : null;
            if (!startEl || !state.canvasRoot || !state.canvasRoot.contains(startEl)) {
                return invalidTarget('Widgets can only be dropped into containers.');
            }

            const containerEl = resolveContainer(startEl);
            if (!containerEl) return invalidTarget('Widgets can only be dropped into containers.', startEl.closest(cfg.selectors.invalidTarget));

            const meta = getContainerMeta(containerEl, event);
            const containerNode = meta.node || inferContainerNode(containerEl);
            const containerPath = meta.path || readPath(containerEl);
            const layout = normalizeLayout(meta.layout || inferLayout(containerEl, containerNode));
            const childEls = getInsertionChildren(containerEl, meta);
            const insertion = calculateInsertion({
                containerEl,
                containerPath,
                containerNode,
                childEls,
                layout,
            }, event);
            const decision = rules.canDrop({ draggedNode: state.payload, targetNode: containerNode, position: insertion.placement });

            if (!decision.valid) return invalidTarget(decision.reason || 'Widgets can only be dropped into containers.', containerEl);

            return {
                valid: true,
                containerEl,
                containerId: meta.id || readNodeId(containerEl),
                containerPath,
                containerNode,
                layout,
                empty: childEls.length === 0,
                childEls,
                insertion,
            };
        }

        function calculateInsertion(targetMeta, event) {
            const axis = normalizeLayout(targetMeta.layout) === 'row' ? 'horizontal' : 'vertical';
            const childEls = Array.isArray(targetMeta.childEls) ? targetMeta.childEls : [];
            if (!childEls.length) {
                return { containerEl: targetMeta.containerEl, index: 0, placement: 'inside', axis, referenceEl: null, referenceIndex: -1 };
            }

            const pointer = axis === 'horizontal' ? (event.clientX || 0) : (event.clientY || 0);
            const hovered = findHoveredChild(childEls, event, axis) || findNearestChild(childEls, pointer, axis);
            if (!hovered) {
                return { containerEl: targetMeta.containerEl, index: childEls.length, placement: 'after', axis, referenceEl: childEls[childEls.length - 1], referenceIndex: childEls.length - 1 };
            }

            return buildInsertion(targetMeta.containerEl, hovered.element, hovered.index, axis, pointer);
        }

        function getContainerMeta(containerEl, event) {
            if (typeof cfg.getContainerMeta === 'function') {
                const meta = cfg.getContainerMeta(containerEl, event);
                return meta && typeof meta === 'object' ? meta : {};
            }
            return {
                id: readNodeId(containerEl),
                path: readPath(containerEl),
                layout: inferLayout(containerEl, null),
                node: inferContainerNode(containerEl),
            };
        }

        function getInsertionChildren(containerEl, meta) {
            if (typeof cfg.getInsertionChildren === 'function') {
                return (cfg.getInsertionChildren(containerEl, meta) || []).filter(isElement);
            }
            return Array.from(containerEl.children).filter((child) => {
                if (!isElement(child)) return false;
                if (child.matches(cfg.selectors.ignoreChildren)) return false;
                if (cfg.selectors.child && child.matches(cfg.selectors.child)) return true;
                return child.classList.contains('vb-node');
            });
        }

        function resolveContainer(startEl) {
            if (typeof cfg.resolveContainerElement === 'function') {
                const custom = cfg.resolveContainerElement(startEl, state.canvasRoot);
                if (custom instanceof Element) return custom;
            }
            if (!startEl) return null;
            const helper = startEl.closest('.vb-helper, .vb-container-empty');
            if (helper) {
                const fromHelper = helper.closest(cfg.selectors.container);
                if (fromHelper) return fromHelper;
            }
            if (startEl.matches(cfg.selectors.container)) return startEl;
            const widgetEl = startEl.closest(cfg.selectors.widget);
            if (widgetEl && widgetEl.parentElement) {
                const parentContainer = widgetEl.parentElement.closest(cfg.selectors.container);
                if (parentContainer) return parentContainer;
            }
            return startEl.closest(cfg.selectors.container);
        }

        function buildPayload(sourceEl, event) {
            const descriptor = typeof cfg.getWidgetDescriptor === 'function' ? cfg.getWidgetDescriptor(sourceEl, event) : null;
            const widgetType = normalizeWidgetType(descriptor && descriptor.widgetType ? descriptor.widgetType : sourceEl.dataset.widgetType);
            if (!widgetType) return null;

            return {
                dragType: 'new-widget',
                widgetType,
                label: descriptor && descriptor.label ? descriptor.label : sourceEl.dataset.widgetLabel || textLabel(sourceEl),
                icon: descriptor && descriptor.icon ? descriptor.icon : sourceEl.dataset.widgetIcon || '+',
                defaultConfig: descriptor && descriptor.defaultConfig ? descriptor.defaultConfig : null,
            };
        }

        function getPanelWidgetElement(target) {
            if (!(target instanceof Element) || !state.panelRoot) return null;
            const sourceEl = target.closest(cfg.selectors.panelWidget);
            return sourceEl && state.panelRoot.contains(sourceEl) ? sourceEl : null;
        }

        function getPayload(event) {
            if (state.payload) return state.payload;
            if (!event || !event.dataTransfer) return null;
            const raw = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('text/plain');
            if (!raw) return null;
            try {
                const payload = JSON.parse(raw);
                return isWidgetPayload(payload) ? payload : null;
            } catch (error) {
                return null;
            }
        }

        function setActive(containerEl, empty) {
            if (state.activeContainerEl && state.activeContainerEl !== containerEl) {
                state.activeContainerEl.classList.remove(cfg.classes.validTarget, cfg.classes.activeTarget, cfg.classes.emptyTarget);
            }
            state.activeContainerEl = containerEl;
            if (!containerEl) return;
            containerEl.classList.add(cfg.classes.validTarget, cfg.classes.activeTarget);
            containerEl.classList.toggle(cfg.classes.emptyTarget, !!empty);
        }

        function clearActive() {
            if (!state.activeContainerEl) return;
            state.activeContainerEl.classList.remove(cfg.classes.validTarget, cfg.classes.activeTarget, cfg.classes.emptyTarget);
            state.activeContainerEl = null;
        }

        function setInvalid(element) {
            if (state.invalidEl && state.invalidEl !== element) state.invalidEl.classList.remove(cfg.classes.invalidTarget);
            state.invalidEl = element;
            if (state.invalidEl) state.invalidEl.classList.add(cfg.classes.invalidTarget);
        }

        function clearInvalid() {
            if (!state.invalidEl) return;
            state.invalidEl.classList.remove(cfg.classes.invalidTarget);
            state.invalidEl = null;
        }

        function updateGhost(payload, x, y) {
            const ghostEl = ensureGhost();
            ghostEl.hidden = false;
            ghostEl.innerHTML = ghostMarkup(payload);
            ghostEl.style.transform = `translate(${Math.round(x + cfg.ghostOffset.x)}px, ${Math.round(y + cfg.ghostOffset.y)}px)`;
        }

        function ensureGhost() {
            if (state.ghostEl) return state.ghostEl;
            state.ghostEl = document.createElement('div');
            state.ghostEl.className = cfg.classes.ghost;
            state.ghostEl.hidden = true;
            document.body.appendChild(state.ghostEl);
            return state.ghostEl;
        }

        function ensureDragImage(payload) {
            if (state.dragImageEl && state.dragImageEl.parentNode) state.dragImageEl.parentNode.removeChild(state.dragImageEl);
            state.dragImageEl = document.createElement('div');
            state.dragImageEl.className = `${cfg.classes.ghost} ${cfg.classes.ghostImage}`;
            state.dragImageEl.style.position = 'fixed';
            state.dragImageEl.style.left = '-9999px';
            state.dragImageEl.style.top = '-9999px';
            state.dragImageEl.innerHTML = ghostMarkup(payload);
            document.body.appendChild(state.dragImageEl);
            return state.dragImageEl;
        }

        function hideGhost() {
            if (state.ghostEl) {
                state.ghostEl.hidden = true;
                state.ghostEl.style.transform = 'translate(-9999px, -9999px)';
            }
            if (state.dragImageEl && state.dragImageEl.parentNode) state.dragImageEl.parentNode.removeChild(state.dragImageEl);
            state.dragImageEl = null;
        }

        function ghostMarkup(payload) {
            return `<span class="vb-drag-ghost__icon" aria-hidden="true">${escapeHtml(payload.icon || '+')}</span><span class="vb-drag-ghost__label">${escapeHtml(payload.label || payload.widgetType || 'Widget')}</span>`;
        }

        function fail(target, payload, event) {
            call(cfg.onInvalidDrop, { payload: payload ? clone(payload) : null, target: target || null, event });
            if (typeof cfg.onStatus === 'function') cfg.onStatus(target && target.reason ? target.reason : 'Widgets can only be dropped into containers.');
        }
    }

    function resolveRules(cfg) {
        if (cfg.rules && typeof cfg.rules.canDrop === 'function') return cfg.rules;
        const api = window.CMSBuilderRules;
        return api && typeof api.createRules === 'function' ? api.createRules(cfg.ruleOptions) : { canDrop: fallbackDropRule };
    }

    function resolveMarker(cfg) {
        if (cfg.marker && typeof cfg.marker.show === 'function') return cfg.marker;
        const api = window.CMSInsertionMarker;
        return api && typeof api.createInsertionMarker === 'function'
            ? api.createInsertionMarker({ mount: cfg.markerRoot, activeContainerClass: cfg.classes.markerActiveContainer })
            : { show() {}, clear() {}, destroy() {} };
    }

    function fallbackDropRule(args) {
        const type = String(args && args.targetNode && args.targetNode.type || '').toLowerCase();
        return { valid: type === 'container', reason: type === 'container' ? '' : 'Widgets can only be dropped into containers.' };
    }

    function normalizeCustomTarget(meta) {
        if (!meta || typeof meta !== 'object' || !(meta.containerEl instanceof Element) || !meta.insertion) return null;
        return {
            valid: meta.valid !== false,
            reason: meta.reason || '',
            containerEl: meta.containerEl,
            containerId: meta.containerId || readNodeId(meta.containerEl),
            containerPath: Array.isArray(meta.containerPath) ? meta.containerPath.slice() : readPath(meta.containerEl),
            containerNode: meta.containerNode || inferContainerNode(meta.containerEl),
            layout: normalizeLayout(meta.layout),
            empty: !!meta.empty,
            childEls: Array.isArray(meta.childEls) ? meta.childEls.filter(isElement) : [],
            insertion: {
                ...meta.insertion,
                containerEl: meta.containerEl,
                axis: meta.insertion.axis === 'horizontal' ? 'horizontal' : 'vertical',
                placement: normalizePlacement(meta.insertion.placement),
                referenceEl: meta.insertion.referenceEl instanceof Element ? meta.insertion.referenceEl : null,
                referenceIndex: Number.isFinite(meta.insertion.referenceIndex) ? meta.insertion.referenceIndex : -1,
                index: Number.isFinite(meta.insertion.index) ? meta.insertion.index : 0,
            },
            invalidEl: meta.invalidEl || null,
        };
    }

    function invalidTarget(reason, invalidEl) {
        return { valid: false, reason: reason || 'Widgets can only be dropped into containers.', invalidEl: invalidEl instanceof Element ? invalidEl : null };
    }

    function buildInsertion(containerEl, referenceEl, referenceIndex, axis, pointer) {
        const rect = referenceEl.getBoundingClientRect();
        const start = axis === 'horizontal' ? rect.left : rect.top;
        const end = axis === 'horizontal' ? rect.right : rect.bottom;
        const size = axis === 'horizontal' ? rect.width : rect.height;
        const beforeEdge = start + (size * 0.25);
        const afterEdge = end - (size * 0.25);
        const placement = pointer <= beforeEdge ? 'before' : pointer >= afterEdge ? 'after' : pointer < (start + size / 2) ? 'before' : 'after';
        return {
            containerEl,
            index: placement === 'before' ? referenceIndex : referenceIndex + 1,
            placement,
            axis,
            referenceEl,
            referenceIndex,
        };
    }

    function findHoveredChild(childEls, event) {
        const x = event.clientX || 0;
        const y = event.clientY || 0;
        for (let index = 0; index < childEls.length; index += 1) {
            const element = childEls[index];
            const rect = element.getBoundingClientRect();
            if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                return { element, index };
            }
        }
        return null;
    }

    function findNearestChild(childEls, pointer, axis) {
        let nearest = null;
        childEls.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const center = axis === 'horizontal' ? rect.left + (rect.width / 2) : rect.top + (rect.height / 2);
            const distance = Math.abs(pointer - center);
            if (!nearest || distance < nearest.distance) nearest = { element, index, distance };
        });
        return nearest;
    }

    function normalizeConfig(options) {
        const source = options && typeof options === 'object' ? options : {};
        const factoryApi = window.CMSWidgetFactory;
        return {
            autoAttach: source.autoAttach !== false,
            panelRoot: source.panelRoot instanceof Element ? source.panelRoot : null,
            canvasRoot: source.canvasRoot instanceof Element ? source.canvasRoot : null,
            markerRoot: source.markerRoot instanceof Element ? source.markerRoot : document.body,
            rules: source.rules || null,
            ruleOptions: source.ruleOptions || {},
            marker: source.marker || null,
            factoryOptions: source.factoryOptions || {},
            createWidget: typeof source.createWidget === 'function'
                ? source.createWidget
                : (factoryApi && typeof factoryApi.createDefaultWidget === 'function' ? factoryApi.createDefaultWidget : function (widgetType) { return { type: widgetType, content: {}, styles: { desktop: {}, tablet: {}, mobile: {} }, children: [] }; }),
            getWidgetDescriptor: typeof source.getWidgetDescriptor === 'function' ? source.getWidgetDescriptor : null,
            resolveDropTarget: typeof source.resolveDropTarget === 'function' ? source.resolveDropTarget : null,
            resolveContainerElement: typeof source.resolveContainerElement === 'function' ? source.resolveContainerElement : null,
            getContainerMeta: typeof source.getContainerMeta === 'function' ? source.getContainerMeta : null,
            getInsertionChildren: typeof source.getInsertionChildren === 'function' ? source.getInsertionChildren : null,
            onDragStart: source.onDragStart,
            onDragEnd: source.onDragEnd,
            onDrop: source.onDrop,
            onAfterDrop: source.onAfterDrop,
            onSelectInserted: source.onSelectInserted,
            onOpenInspector: source.onOpenInspector,
            onInvalidDrop: source.onInvalidDrop,
            onTargetChange: source.onTargetChange,
            onStatus: source.onStatus,
            onCancel: source.onCancel,
            selectors: {
                panelWidget: readSelector(source, 'panelWidget', '[data-widget-type]'),
                container: readSelector(source, 'container', '[data-node-type="container"], [data-container-role="container"]'),
                widget: readSelector(source, 'widget', '[data-node-type="widget"], [data-widget-type], .vb-node'),
                child: readSelector(source, 'child', '.vb-node'),
                invalidTarget: readSelector(source, 'invalidTarget', '[data-node-type], .vb-node'),
                ignoreChildren: readSelector(source, 'ignoreChildren', '.vb-dropzone, .vb-helper, .vb-container-empty, .vb-drop-marker'),
            },
            classes: {
                draggingSource: readClass(source, 'draggingSource', 'is-dragging-widget'),
                canvasDragActive: readClass(source, 'canvasDragActive', 'is-drag-active'),
                bodyDragActive: readClass(source, 'bodyDragActive', 'is-builder-dragging'),
                validTarget: readClass(source, 'validTarget', 'is-drop-target'),
                activeTarget: readClass(source, 'activeTarget', 'is-active-drop-target'),
                invalidTarget: readClass(source, 'invalidTarget', 'is-invalid-target'),
                emptyTarget: readClass(source, 'emptyTarget', 'is-empty-container'),
                markerActiveContainer: readClass(source, 'markerActiveContainer', 'has-drop-marker'),
                ghost: readClass(source, 'ghost', 'vb-drag-ghost'),
                ghostImage: readClass(source, 'ghostImage', 'vb-drag-ghost--image'),
            },
            ghostOffset: {
                x: source.ghostOffset && Number.isFinite(source.ghostOffset.x) ? source.ghostOffset.x : 14,
                y: source.ghostOffset && Number.isFinite(source.ghostOffset.y) ? source.ghostOffset.y : 14,
            },
        };
    }

    function readSelector(source, key, fallback) {
        return source.selectors && source.selectors[key] ? source.selectors[key] : fallback;
    }

    function readClass(source, key, fallback) {
        return source.classes && source.classes[key] ? source.classes[key] : fallback;
    }

    function inferContainerNode(containerEl) {
        return { id: readNodeId(containerEl), type: readNodeType(containerEl) || 'container', widgetType: readWidgetType(containerEl) };
    }

    function inferLayout(containerEl, containerNode) {
        if (containerEl && containerEl.dataset) return containerEl.dataset.containerLayout || containerEl.dataset.layout || '';
        return containerNode && containerNode.content ? containerNode.content.layoutMode || '' : '';
    }

    function normalizeLayout(layout) {
        const value = String(layout || '').trim().toLowerCase();
        if (value.indexOf('row') >= 0) return 'row';
        if (value.indexOf('grid') >= 0) return 'grid';
        return 'column';
    }

    function normalizeWidgetType(type) {
        const value = String(type || '').trim().toLowerCase();
        if (value === 'text') return 'paragraph';
        return value === 'heading' || value === 'paragraph' || value === 'button' ? value : '';
    }

    function normalizePlacement(placement) {
        return placement === 'before' || placement === 'after' ? placement : 'inside';
    }

    function isWidgetPayload(payload) {
        return !!(payload && payload.dragType === 'new-widget' && normalizeWidgetType(payload.widgetType));
    }

    function readNodeId(element) {
        return element instanceof Element ? element.dataset.nodeId || '' : '';
    }

    function readNodeType(element) {
        return element instanceof Element ? String(element.dataset.nodeType || '').trim().toLowerCase() : '';
    }

    function readWidgetType(element) {
        return element instanceof Element ? normalizeWidgetType(element.dataset.widgetType || element.dataset.nodeType || '') : '';
    }

    function readPath(element) {
        if (!(element instanceof Element)) return null;
        const raw = element.dataset.nodePath || element.dataset.path || '';
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : null;
        } catch (error) {
            return raw.split('.').map((part) => Number(part)).filter((value) => Number.isFinite(value));
        }
    }

    function textLabel(element) {
        const labelEl = element.querySelector('[data-widget-label], strong, .vb-widget__label');
        return labelEl ? labelEl.textContent.trim() : element.textContent.trim();
    }

    function call(fn) {
        if (typeof fn !== 'function') return undefined;
        return fn.apply(null, Array.prototype.slice.call(arguments, 1));
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function isElement(value) {
        return value instanceof Element;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    window.CMSBuilderDragDropEngine = {
        initDragDropEngine,
        createDragDropEngine: initDragDropEngine,
    };
})();
