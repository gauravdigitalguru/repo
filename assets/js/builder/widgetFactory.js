(function () {
    const DEFAULT_ADVANCED = {
        cssClass: '',
        anchorId: '',
        animation: '',
        customCss: '',
        hideDesktop: false,
        hideTablet: false,
        hideMobile: false,
    };

    const DEFAULT_TYPOGRAPHY = {
        heading: 'heading-lg',
        paragraph: 'body-md',
        button: 'button-md',
    };

    function createDefaultWidget(widgetType, options) {
        const config = normalizeOptions(options);
        const type = normalizeWidgetType(widgetType);

        if (!type) return null;

        const widget = {
            id: createId(type, config),
            type,
            content: buildContent(type),
            props: {
                typography: buildTypography(type),
            },
            styles: {
                desktop: buildDesktopStyles(type),
                tablet: {},
                mobile: {},
            },
            advanced: clone(DEFAULT_ADVANCED),
            children: [],
        };

        if (typeof config.createNode === 'function') {
            return config.createNode(type, clone(widget));
        }

        if (typeof config.adapt === 'function') {
            return config.adapt(clone(widget), type);
        }

        return widget;
    }

    function buildContent(type) {
        if (type === 'heading') {
            return {
                text: 'Your Heading',
                level: 2,
                link: '',
            };
        }

        if (type === 'button') {
            return {
                text: 'Click Me',
                link: '#',
                newTab: false,
                icon: '',
            };
        }

        return {
            html: '<p>Start typing your text...</p>',
        };
    }

    function buildTypography(type) {
        return {
            token: DEFAULT_TYPOGRAPHY[type] || 'body-md',
            overrides: {
                fontSize: '',
                fontWeight: '',
                lineHeight: '',
                letterSpacing: '',
                textTransform: '',
                color: '',
            },
        };
    }

    function buildDesktopStyles(type) {
        if (type === 'button') {
            return {
                width: '',
                justifyContent: 'center',
                alignSelf: 'flex-start',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                borderWidth: '0px',
                borderStyle: 'solid',
                borderColor: '',
                borderRadius: '12px',
                paddingTop: '12px',
                paddingRight: '20px',
                paddingBottom: '12px',
                paddingLeft: '20px',
                hoverBackgroundColor: '',
            };
        }

        if (type === 'heading') {
            return {
                margin: '0',
            };
        }

        return {
            margin: '0',
        };
    }

    function createId(type, config) {
        if (typeof config.createId === 'function') {
            return config.createId(type);
        }

        const seed = Math.random().toString(36).slice(2, 10);
        return `${type}-${seed}`;
    }

    function normalizeWidgetType(type) {
        const value = String(type || '').trim().toLowerCase();
        if (value === 'text') return 'paragraph';
        if (value === 'heading' || value === 'paragraph' || value === 'button') {
            return value;
        }
        return '';
    }

    function normalizeOptions(options) {
        return options && typeof options === 'object' ? options : {};
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    window.CMSWidgetFactory = {
        createDefaultWidget,
        normalizeWidgetType,
    };
})();
