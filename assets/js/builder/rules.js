(function () {
    const DEFAULT_WIDGET_TYPES = ['heading', 'paragraph', 'text', 'button'];
    const DEFAULT_CONTAINER_TYPES = ['container'];
    const DEFAULT_SECTION_TYPES = ['section'];
    const DEFAULT_ROOT_TYPES = ['root', 'page-root', 'canvas-root'];

    function createRules(options) {
        const config = normalizeConfig(options);

        return {
            canParentAcceptChild(parentNode, childNode) {
                return canParentAcceptChild(parentNode, childNode, config);
            },
            canInsertAtPosition(parentNode, childNode, position) {
                return canInsertAtPosition(parentNode, childNode, position, config);
            },
            canDrop(args) {
                return canDrop(args, config);
            },
            getKind(entity) {
                return getKind(entity, config);
            },
            getWidgetType(entity) {
                return normalizeWidgetType(readWidgetType(entity));
            },
            normalizeWidgetType,
        };
    }

    function canParentAcceptChild(parentNode, childNode, options) {
        const config = normalizeConfig(options);
        const parentKind = getKind(parentNode, config);
        const childKind = getKind(childNode, config);

        if (parentKind === 'page-root') return childKind === 'section';
        if (parentKind === 'section') return childKind === 'container';
        if (parentKind === 'container') return childKind === 'widget';
        return false;
    }

    function canDrop(args, options) {
        const config = normalizeConfig(options);
        const data = args || {};
        const dragged = data.draggedNode;
        const target = data.targetNode;
        const position = normalizePlacement(data.position);

        if (!dragged) {
            return result(false, 'Missing dragged payload.');
        }

        const draggedKind = getKind(dragged, config);
        const targetKind = getKind(target, config);

        if (draggedKind !== 'widget') {
            return result(false, 'This drag/drop flow supports widget insertion only.', {
                draggedKind,
                targetKind,
                position,
            });
        }

        if (targetKind !== 'container') {
            return result(false, 'Widgets can only be dropped into containers.', {
                draggedKind,
                targetKind,
                position,
            });
        }

        return canInsertAtPosition(target, dragged, position, config);
    }

    function canInsertAtPosition(parentNode, childNode, position, options) {
        const config = normalizeConfig(options);
        const parentKind = getKind(parentNode, config);
        const childKind = getKind(childNode, config);
        const placement = normalizePlacement(position);

        if (!canParentAcceptChild(parentNode, childNode, config)) {
            return result(false, 'The target container cannot accept this child.', {
                parentKind,
                childKind,
                position: placement,
            });
        }

        return result(true, '', {
            parentKind,
            childKind,
            position: placement,
        });
    }

    function getKind(entity, options) {
        const config = normalizeConfig(options);
        const rawType = normalizeType(readType(entity));
        const widgetType = normalizeWidgetType(readWidgetType(entity));

        if (rawType === 'new-widget' || rawType === 'widget' || widgetType) {
            return 'widget';
        }

        if (config.rootTypes.indexOf(rawType) >= 0) return 'page-root';
        if (config.sectionTypes.indexOf(rawType) >= 0) return 'section';
        if (config.containerTypes.indexOf(rawType) >= 0) return 'container';

        return '';
    }

    function readType(entity) {
        if (!entity) return '';
        if (typeof entity === 'string') return entity;

        if (entity.dragType === 'new-widget') return 'new-widget';
        if (entity.type) return entity.type;
        if (entity.nodeType) return entity.nodeType;

        const dataset = entity.dataset || {};
        return dataset.nodeType || dataset.dragType || '';
    }

    function readWidgetType(entity) {
        if (!entity) return '';
        if (typeof entity === 'string') return normalizeWidgetType(entity);

        if (entity.widgetType) return entity.widgetType;
        if (entity.type && DEFAULT_WIDGET_TYPES.indexOf(normalizeWidgetType(entity.type)) >= 0) {
            return entity.type;
        }

        const dataset = entity.dataset || {};
        return dataset.widgetType || dataset.nodeType || '';
    }

    function normalizeWidgetType(type) {
        const value = normalizeType(type);
        if (value === 'text') return 'paragraph';
        return DEFAULT_WIDGET_TYPES.indexOf(value) >= 0 ? value : '';
    }

    function normalizeType(type) {
        return String(type || '').trim().toLowerCase();
    }

    function normalizePlacement(value) {
        if (value === 'before' || value === 'after' || value === 'inside') {
            return value;
        }
        return 'inside';
    }

    function normalizeConfig(options) {
        const source = options || {};
        return {
            widgetTypes: Array.isArray(source.widgetTypes) && source.widgetTypes.length ? source.widgetTypes.map(normalizeWidgetType).filter(Boolean) : DEFAULT_WIDGET_TYPES.slice(),
            containerTypes: Array.isArray(source.containerTypes) && source.containerTypes.length ? source.containerTypes.map(normalizeType) : DEFAULT_CONTAINER_TYPES.slice(),
            sectionTypes: Array.isArray(source.sectionTypes) && source.sectionTypes.length ? source.sectionTypes.map(normalizeType) : DEFAULT_SECTION_TYPES.slice(),
            rootTypes: Array.isArray(source.rootTypes) && source.rootTypes.length ? source.rootTypes.map(normalizeType) : DEFAULT_ROOT_TYPES.slice(),
        };
    }

    function result(valid, reason, meta) {
        return {
            valid: !!valid,
            reason: reason || '',
            meta: meta || {},
        };
    }

    window.CMSBuilderRules = {
        createRules,
        canParentAcceptChild,
        canInsertAtPosition,
        canDrop,
        getKind,
        normalizeWidgetType,
    };
})();
