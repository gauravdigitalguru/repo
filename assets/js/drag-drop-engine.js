(function () {
    function createDragDropEngine(options) {
        const config = options || {};
        const state = {
            payload: null,
            sourceEl: null,
            targetEl: null,
            targetMeta: null,
            ghostEl: null,
            markerEl: null,
            dragImageEl: null,
        };

        document.addEventListener('dragover', handleDocumentDragOver);
        document.addEventListener('drop', handleDocumentDrop, true);

        function bindSource(element, descriptor) {
            if (!element) return;
            element.draggable = true;
            element.addEventListener('dragstart', (event) => handleSourceDragStart(event, descriptor));
            element.addEventListener('dragend', handleDragEnd);
        }

        function bindDropTarget(element, descriptor) {
            if (!element) return;
            element.addEventListener('dragenter', (event) => handleTargetDragEnter(event, element, descriptor));
            element.addEventListener('dragover', (event) => handleTargetDragOver(event, element, descriptor));
            element.addEventListener('dragleave', (event) => handleTargetDragLeave(event, element));
            element.addEventListener('drop', (event) => handleTargetDrop(event, element, descriptor));
        }

        function clear() {
            clearTargetState();
            hideGhost();
            hideMarker();
            clearSourceState();
            state.payload = null;
            state.targetMeta = null;
            document.body.classList.remove('is-builder-dragging');
        }

        function destroy() {
            clear();
            document.removeEventListener('dragover', handleDocumentDragOver);
            document.removeEventListener('drop', handleDocumentDrop, true);
            if (state.ghostEl && state.ghostEl.parentNode) {
                state.ghostEl.parentNode.removeChild(state.ghostEl);
            }
            if (state.markerEl && state.markerEl.parentNode) {
                state.markerEl.parentNode.removeChild(state.markerEl);
            }
        }

        function handleSourceDragStart(event, descriptor) {
            const payload = normalizePayload(resolveDescriptor(descriptor, event));
            if (!payload) {
                event.preventDefault();
                return;
            }

            state.payload = payload;
            state.sourceEl = event.currentTarget;

            if (state.sourceEl) {
                state.sourceEl.classList.add('is-dragging');
            }

            document.body.classList.add('is-builder-dragging');
            showGhost(payload, event.clientX || 0, event.clientY || 0);

            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = payload.source === 'canvas' ? 'move' : 'copy';
                const raw = JSON.stringify(payload);
                event.dataTransfer.setData('application/json', raw);
                event.dataTransfer.setData('text/plain', raw);

                const dragImage = ensureDragImage(payload);
                event.dataTransfer.setDragImage(dragImage, 16, 16);
            }

            if (typeof config.onDragStart === 'function') {
                config.onDragStart(payload, event);
            }
        }

        function handleDocumentDragOver(event) {
            if (!state.payload) return;
            showGhost(state.payload, event.clientX || 0, event.clientY || 0);
        }

        function handleDocumentDrop(event) {
            if (!state.payload) return;
            const target = event.target instanceof Element ? event.target.closest('[data-dnd-target]') : null;
            if (!target) {
                clear();
            }
        }

        function handleTargetDragEnter(event, element, descriptor) {
            if (!state.payload) return;
            const decision = evaluateDrop(element, descriptor, event);
            updateTargetState(element, decision);
        }

        function handleTargetDragOver(event, element, descriptor) {
            if (!state.payload) return;
            const decision = evaluateDrop(element, descriptor, event);
            updateTargetState(element, decision);

            if (decision.valid) {
                event.preventDefault();
                event.stopPropagation();
                if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = state.payload.source === 'canvas' ? 'move' : 'copy';
                }
            }
        }

        function handleTargetDragLeave(event, element) {
            const related = event.relatedTarget;
            if (related instanceof Element && element.contains(related)) {
                return;
            }

            if (state.targetEl === element) {
                clearTargetState();
            } else {
                element.classList.remove('is-drop-valid', 'is-drop-invalid');
            }
        }

        function handleTargetDrop(event, element, descriptor) {
            const payload = state.payload || readPayload(event);
            if (!payload) return;

            const decision = evaluateDrop(element, descriptor, event);
            event.preventDefault();
            event.stopPropagation();

            if (!decision.valid) {
                if (typeof config.onInvalidDrop === 'function') {
                    config.onInvalidDrop(payload, decision.meta, event);
                }
                clear();
                return;
            }

            if (typeof config.onDrop === 'function') {
                config.onDrop(payload, decision.meta, event);
            }

            clear();
        }

        function handleDragEnd() {
            clear();
            if (typeof config.onDragEnd === 'function') {
                config.onDragEnd();
            }
        }

        function evaluateDrop(element, descriptor, event) {
            const payload = state.payload || readPayload(event);
            const meta = resolveDescriptor(descriptor, event) || {};
            meta.targetElement = element;

            const valid = typeof config.canDrop === 'function'
                ? !!config.canDrop(payload, meta, event)
                : true;

            return { valid, meta, payload };
        }

        function updateTargetState(element, decision) {
            if (state.targetEl && state.targetEl !== element) {
                state.targetEl.classList.remove('is-drop-valid', 'is-drop-invalid');
            }

            state.targetEl = element;
            state.targetMeta = decision.meta;

            element.classList.toggle('is-drop-valid', !!decision.valid);
            element.classList.toggle('is-drop-invalid', !decision.valid);

            if (decision.valid) {
                showMarker(decision.meta);
            } else {
                hideMarker();
            }
        }

        function clearTargetState() {
            if (state.targetEl) {
                state.targetEl.classList.remove('is-drop-valid', 'is-drop-invalid');
            }
            state.targetEl = null;
            state.targetMeta = null;
            hideMarker();
        }

        function clearSourceState() {
            if (state.sourceEl) {
                state.sourceEl.classList.remove('is-dragging');
            }
            state.sourceEl = null;
        }

        function readPayload(event) {
            if (state.payload) return state.payload;
            if (!event || !event.dataTransfer) return null;

            const raw = event.dataTransfer.getData('application/json') || event.dataTransfer.getData('text/plain');
            if (!raw) return null;

            try {
                return normalizePayload(JSON.parse(raw));
            } catch (error) {
                return null;
            }
        }

        function normalizePayload(payload) {
            if (!payload || typeof payload !== 'object') return null;
            const next = { ...payload };
            if (Array.isArray(next.path)) next.path = next.path.slice();
            return next;
        }

        function resolveDescriptor(descriptor, event) {
            return typeof descriptor === 'function' ? descriptor(event) : descriptor;
        }

        function ensureGhost() {
            if (state.ghostEl) return state.ghostEl;
            const ghost = document.createElement('div');
            ghost.className = 'vb-drag-ghost';
            ghost.hidden = true;
            document.body.appendChild(ghost);
            state.ghostEl = ghost;
            return ghost;
        }

        function ensureDragImage(payload) {
            if (state.dragImageEl && state.dragImageEl.parentNode) {
                state.dragImageEl.parentNode.removeChild(state.dragImageEl);
            }
            const el = document.createElement('div');
            el.className = 'vb-drag-ghost vb-drag-ghost--image';
            el.innerHTML = `<span class="vb-drag-ghost__icon" aria-hidden="true">${escapeHtml(payload.icon || '+')}</span><span class="vb-drag-ghost__label">${escapeHtml(payload.label || payload.type || 'Item')}</span>`;
            el.style.top = '-9999px';
            el.style.left = '-9999px';
            document.body.appendChild(el);
            state.dragImageEl = el;
            return el;
        }

        function showGhost(payload, x, y) {
            const ghost = ensureGhost();
            ghost.hidden = false;
            ghost.innerHTML = `<span class="vb-drag-ghost__icon" aria-hidden="true">${escapeHtml(payload.icon || '+')}</span><span class="vb-drag-ghost__label">${escapeHtml(payload.label || payload.type || 'Item')}</span>`;
            ghost.style.transform = `translate(${Math.round(x + 14)}px, ${Math.round(y + 14)}px)`;
        }

        function hideGhost() {
            if (!state.ghostEl) return;
            state.ghostEl.hidden = true;
            state.ghostEl.style.transform = 'translate(-9999px, -9999px)';
            if (state.dragImageEl && state.dragImageEl.parentNode) {
                state.dragImageEl.parentNode.removeChild(state.dragImageEl);
            }
            state.dragImageEl = null;
        }

        function ensureMarker() {
            if (state.markerEl) return state.markerEl;
            const marker = document.createElement('div');
            marker.className = 'vb-drop-marker';
            marker.hidden = true;
            document.body.appendChild(marker);
            state.markerEl = marker;
            return marker;
        }

        function showMarker(meta) {
            if (!meta || !meta.targetElement) return;
            const marker = ensureMarker();
            const rect = meta.targetElement.getBoundingClientRect();
            const mode = meta.mode || (meta.kind === 'inside' ? 'inside' : 'line');
            const axis = meta.axis || 'vertical';

            marker.hidden = false;
            marker.classList.toggle('vb-drop-marker--inside', mode === 'inside');
            marker.classList.toggle('vb-drop-marker--line', mode !== 'inside');
            marker.classList.toggle('vb-drop-marker--horizontal', mode !== 'inside' && axis === 'vertical');
            marker.classList.toggle('vb-drop-marker--vertical', mode !== 'inside' && axis === 'horizontal');

            if (mode === 'inside') {
                marker.style.left = `${Math.round(rect.left + window.scrollX)}px`;
                marker.style.top = `${Math.round(rect.top + window.scrollY)}px`;
                marker.style.width = `${Math.round(rect.width)}px`;
                marker.style.height = `${Math.round(rect.height)}px`;
                return;
            }

            if (axis === 'horizontal') {
                const width = 4;
                marker.style.left = `${Math.round(rect.left + window.scrollX + (rect.width / 2) - (width / 2))}px`;
                marker.style.top = `${Math.round(rect.top + window.scrollY)}px`;
                marker.style.width = `${width}px`;
                marker.style.height = `${Math.round(rect.height)}px`;
                return;
            }

            const height = 4;
            marker.style.left = `${Math.round(rect.left + window.scrollX)}px`;
            marker.style.top = `${Math.round(rect.top + window.scrollY + (rect.height / 2) - (height / 2))}px`;
            marker.style.width = `${Math.round(rect.width)}px`;
            marker.style.height = `${height}px`;
        }

        function hideMarker() {
            if (!state.markerEl) return;
            state.markerEl.hidden = true;
            state.markerEl.style.width = '0';
            state.markerEl.style.height = '0';
        }

        return {
            bindSource,
            bindDropTarget,
            clear,
            destroy,
            getPayload: () => state.payload ? { ...state.payload } : null,
        };
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    window.CMSDragDropEngine = {
        createDragDropEngine,
    };
})();
