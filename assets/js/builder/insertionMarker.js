(function () {
    function createInsertionMarker(options) {
        const config = normalizeOptions(options);
        const state = {
            markerEl: null,
            activeContainerEl: null,
            activeTargetEl: null,
        };

        function show(meta) {
            if (!meta || !meta.containerEl) {
                clear();
                return;
            }

            const markerEl = ensureMarker();
            const placement = meta.placement === 'before' || meta.placement === 'after' ? meta.placement : 'inside';
            const axis = meta.axis === 'horizontal' ? 'horizontal' : 'vertical';

            markerEl.hidden = false;
            markerEl.classList.remove('vb-drop-marker--inside', 'vb-drop-marker--horizontal', 'vb-drop-marker--vertical');

            if (state.activeContainerEl && state.activeContainerEl !== meta.containerEl) {
                state.activeContainerEl.classList.remove(config.activeContainerClass);
            }

            state.activeContainerEl = meta.containerEl;
            state.activeTargetEl = meta.referenceEl || meta.containerEl;
            state.activeContainerEl.classList.add(config.activeContainerClass);

            if (placement === 'inside' || !meta.referenceEl) {
                markerEl.classList.add('vb-drop-marker--inside');
                placeInside(markerEl, meta.containerEl, config);
                return;
            }

            if (axis === 'horizontal') {
                markerEl.classList.add('vb-drop-marker--vertical');
                placeVerticalLine(markerEl, meta.referenceEl, placement, config);
                return;
            }

            markerEl.classList.add('vb-drop-marker--horizontal');
            placeHorizontalLine(markerEl, meta.referenceEl, placement, config);
        }

        function clear() {
            if (state.activeContainerEl) {
                state.activeContainerEl.classList.remove(config.activeContainerClass);
            }
            state.activeContainerEl = null;
            state.activeTargetEl = null;

            if (!state.markerEl) return;
            state.markerEl.hidden = true;
            state.markerEl.style.left = '-9999px';
            state.markerEl.style.top = '-9999px';
            state.markerEl.style.width = '0';
            state.markerEl.style.height = '0';
            state.markerEl.classList.remove('vb-drop-marker--inside', 'vb-drop-marker--horizontal', 'vb-drop-marker--vertical');
        }

        function destroy() {
            clear();
            if (state.markerEl && state.markerEl.parentNode) {
                state.markerEl.parentNode.removeChild(state.markerEl);
            }
            state.markerEl = null;
        }

        function ensureMarker() {
            if (state.markerEl) return state.markerEl;

            const markerEl = document.createElement('div');
            markerEl.className = config.markerClass;
            markerEl.hidden = true;
            config.mount.appendChild(markerEl);
            state.markerEl = markerEl;
            return markerEl;
        }

        return {
            show,
            clear,
            destroy,
        };
    }

    function placeInside(markerEl, containerEl, config) {
        const rect = containerEl.getBoundingClientRect();
        const scroll = getScrollOffsets(config);

        markerEl.style.left = `${Math.round(rect.left + scroll.x)}px`;
        markerEl.style.top = `${Math.round(rect.top + scroll.y)}px`;
        markerEl.style.width = `${Math.round(rect.width)}px`;
        markerEl.style.height = `${Math.round(rect.height)}px`;
    }

    function placeHorizontalLine(markerEl, referenceEl, placement, config) {
        const rect = referenceEl.getBoundingClientRect();
        const scroll = getScrollOffsets(config);
        const thickness = config.lineThickness;
        const top = placement === 'after' ? rect.bottom - (thickness / 2) : rect.top - (thickness / 2);

        markerEl.style.left = `${Math.round(rect.left + scroll.x)}px`;
        markerEl.style.top = `${Math.round(top + scroll.y)}px`;
        markerEl.style.width = `${Math.round(rect.width)}px`;
        markerEl.style.height = `${thickness}px`;
    }

    function placeVerticalLine(markerEl, referenceEl, placement, config) {
        const rect = referenceEl.getBoundingClientRect();
        const scroll = getScrollOffsets(config);
        const thickness = config.lineThickness;
        const left = placement === 'after' ? rect.right - (thickness / 2) : rect.left - (thickness / 2);

        markerEl.style.left = `${Math.round(left + scroll.x)}px`;
        markerEl.style.top = `${Math.round(rect.top + scroll.y)}px`;
        markerEl.style.width = `${thickness}px`;
        markerEl.style.height = `${Math.round(rect.height)}px`;
    }

    function getScrollOffsets(config) {
        if (config.positionMode === 'fixed') {
            return { x: 0, y: 0 };
        }

        return {
            x: window.scrollX || window.pageXOffset || 0,
            y: window.scrollY || window.pageYOffset || 0,
        };
    }

    function normalizeOptions(options) {
        const source = options && typeof options === 'object' ? options : {};
        return {
            mount: source.mount instanceof Element ? source.mount : document.body,
            markerClass: source.markerClass || 'vb-drop-marker',
            activeContainerClass: source.activeContainerClass || 'has-drop-marker',
            lineThickness: Number.isFinite(source.lineThickness) ? Math.max(2, source.lineThickness) : 4,
            positionMode: source.positionMode === 'fixed' ? 'fixed' : 'absolute',
        };
    }

    window.CMSInsertionMarker = {
        createInsertionMarker,
    };
})();
