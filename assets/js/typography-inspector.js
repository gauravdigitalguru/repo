(function (global) {
    'use strict';

    var TYPOGRAPHY_TOKENS = Object.freeze({
        'heading-xl': freezeToken('Heading XL', '', '56px', '700', '1.1', '-1px', 'none', '#0f172a'),
        'heading-lg': freezeToken('Heading Large', '', '42px', '700', '1.15', '-1px', 'none', '#0f172a'),
        'heading-md': freezeToken('Heading Medium', '', '32px', '600', '1.2', '-0.5px', 'none', '#0f172a'),
        'body-lg': freezeToken('Body Large', '', '20px', '400', '1.7', '0px', 'none', '#334155'),
        'body-md': freezeToken('Body', '', '16px', '400', '1.65', '0px', 'none', '#334155'),
        'button-md': freezeToken('Button', '', '15px', '600', '1', '0.3px', 'none', '#ffffff'),
        'caption-sm': freezeToken('Caption', '', '12px', '500', '1.4', '0.8px', 'uppercase', '#64748b')
    });

    var DEFAULT_WIDGET_TOKENS = Object.freeze({
        heading: 'heading-lg',
        paragraph: 'body-md',
        text: 'body-md',
        'text-editor': 'body-md',
        button: 'button-md'
    });

    var TYPOGRAPHY_FIELDS = Object.freeze({
        heading: ['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'color'],
        paragraph: ['fontSize', 'lineHeight', 'letterSpacing', 'color'],
        button: ['fontSize', 'fontWeight', 'letterSpacing', 'textTransform', 'color']
    });

    var TOKEN_ORDER = Object.freeze([
        'heading-xl',
        'heading-lg',
        'heading-md',
        'body-lg',
        'body-md',
        'button-md',
        'caption-sm'
    ]);

    var FONT_WEIGHT_OPTIONS = Object.freeze(['400', '500', '600', '700']);
    var TEXT_TRANSFORM_OPTIONS = Object.freeze([
        { value: 'none', label: 'None' },
        { value: 'uppercase', label: 'Uppercase' },
        { value: 'lowercase', label: 'Lowercase' },
        { value: 'capitalize', label: 'Capitalize' }
    ]);

    function freezeToken(label, fontFamily, fontSize, fontWeight, lineHeight, letterSpacing, textTransform, color) {
        return Object.freeze({
            label: label,
            fontFamily: fontFamily,
            fontSize: fontSize,
            fontWeight: fontWeight,
            lineHeight: lineHeight,
            letterSpacing: letterSpacing,
            textTransform: textTransform,
            color: color
        });
    }

    function getTypographyTokens() {
        return deepClone(TYPOGRAPHY_TOKENS);
    }

    function getDefaultTypographyForWidget(widgetType) {
        var normalizedType = normalizeWidgetType(widgetType);
        var token = DEFAULT_WIDGET_TOKENS[normalizedType] || 'body-md';

        return {
            token: token,
            overrides: createEmptyTypographyOverrides()
        };
    }

    function ensureTypographyState(widget) {
        if (!widget || typeof widget !== 'object') {
            throw new Error('ensureTypographyState(widget) requires a widget object.');
        }

        if (!widget.props || typeof widget.props !== 'object') {
            widget.props = {};
        }

        var defaults = getDefaultTypographyForWidget(widget.type);
        var current = widget.props.typography && typeof widget.props.typography === 'object'
            ? widget.props.typography
            : {};

        widget.props.typography = {
            token: isKnownToken(current.token) ? current.token : defaults.token,
            overrides: normalizeTypographyOverrides(current.overrides, normalizeWidgetType(widget.type))
        };

        return widget.props.typography;
    }

    function updateTypographyToken(widget, token) {
        var typography = ensureTypographyState(widget);
        typography.token = isKnownToken(token) ? token : getDefaultTypographyForWidget(widget.type).token;
        return typography;
    }

    function updateTypographyOverride(widget, key, value) {
        var typography = ensureTypographyState(widget);
        var widgetType = normalizeWidgetType(widget.type);

        if (!isTypographyFieldAllowed(widgetType, key)) {
            return typography;
        }

        typography.overrides[key] = normalizeTypographyOverrideValue(key, value);
        return typography;
    }

    function resetTypographyOverrides(widget) {
        var typography = ensureTypographyState(widget);
        typography.overrides = createEmptyTypographyOverrides();
        return typography;
    }

    function computeWidgetTypography(widget, tokens) {
        var typography = ensureTypographyState(widget);
        var tokenMap = tokens && typeof tokens === 'object' ? tokens : TYPOGRAPHY_TOKENS;
        var fallbackToken = getDefaultTypographyForWidget(widget.type).token;
        var tokenName = tokenMap[typography.token] ? typography.token : fallbackToken;
        var base = tokenMap[tokenName] || tokenMap[fallbackToken] || TYPOGRAPHY_TOKENS['body-md'];
        var result = {
            token: tokenName,
            label: base.label,
            fontFamily: base.fontFamily,
            fontSize: base.fontSize,
            fontWeight: base.fontWeight,
            lineHeight: base.lineHeight,
            letterSpacing: base.letterSpacing,
            textTransform: base.textTransform,
            color: base.color
        };

        Object.keys(typography.overrides).forEach(function (key) {
            if (typography.overrides[key] !== '') {
                result[key] = typography.overrides[key];
            }
        });

        return result;
    }

    function renderTypographyInspector(widget) {
        var widgetType = normalizeWidgetType(widget && widget.type);
        var typography = ensureTypographyState(widget);
        var tokens = TYPOGRAPHY_TOKENS;
        var baseToken = tokens[typography.token] || tokens[getDefaultTypographyForWidget(widgetType).token];
        var fields = getTypographyFieldsForWidget(widgetType);

        return [
            '<div class="inspector-group inspector-group--typography" data-group="typography" data-widget-type="', escapeAttribute(widgetType), '">',
            '<div class="inspector-group__header">Typography</div>',
            renderTokenField(typography.token),
            fields.indexOf('fontSize') > -1 ? renderNumberField('Font Size', 'fontSize', typography.overrides.fontSize, baseToken.fontSize, 'px', '1') : '',
            fields.indexOf('fontWeight') > -1 ? renderWeightField(typography.overrides.fontWeight, baseToken.fontWeight) : '',
            fields.indexOf('lineHeight') > -1 ? renderNumberField('Line Height', 'lineHeight', typography.overrides.lineHeight, baseToken.lineHeight, '', '0.1') : '',
            fields.indexOf('letterSpacing') > -1 ? renderNumberField('Letter Spacing', 'letterSpacing', typography.overrides.letterSpacing, baseToken.letterSpacing, 'px', '0.1') : '',
            fields.indexOf('textTransform') > -1 ? renderTextTransformField(typography.overrides.textTransform, baseToken.textTransform) : '',
            fields.indexOf('color') > -1 ? renderColorField(typography.overrides.color, baseToken.color, widgetType === 'button' ? 'Text Color' : 'Color') : '',
            '<div class="inspector-actions">',
            '<button type="button" class="inspector-button inspector-button--ghost" data-typo-reset>Reset Typography</button>',
            '</div>',
            '</div>'
        ].join('');
    }

    function bindTypographyInspectorEvents(rootEl, widget, onChange) {
        if (!rootEl || !(rootEl instanceof Element)) {
            throw new Error('bindTypographyInspectorEvents(rootEl, widget, onChange) requires a valid root element.');
        }

        ensureTypographyState(widget);

        var tokenSelect = rootEl.querySelector('[data-typo-token]');
        if (tokenSelect) {
            tokenSelect.addEventListener('change', function () {
                updateTypographyToken(widget, tokenSelect.value);
                notifyChange(widget, onChange, 'token', typographySnapshot(widget), { commit: true, source: 'change' });
            });
        }

        rootEl.querySelectorAll('[data-typo-override]').forEach(function (input) {
            var eventName = input.type === 'number' || input.type === 'text' ? 'input' : 'change';
            input.addEventListener(eventName, function () {
                updateTypographyOverride(widget, input.dataset.typoOverride, input.value);
                notifyChange(widget, onChange, input.dataset.typoOverride, typographySnapshot(widget), { commit: false, source: eventName });
            });
            if (eventName !== 'change') {
                input.addEventListener('change', function () {
                    updateTypographyOverride(widget, input.dataset.typoOverride, input.value);
                    notifyChange(widget, onChange, input.dataset.typoOverride, typographySnapshot(widget), { commit: true, source: 'change' });
                });
            }
        });

        var colorPicker = rootEl.querySelector('[data-typo-color-picker]');
        if (colorPicker) {
            colorPicker.addEventListener('input', function () {
                updateTypographyOverride(widget, 'color', colorPicker.value);
                var textInput = rootEl.querySelector('[data-typo-override="color"]');
                if (textInput) {
                    textInput.value = colorPicker.value;
                }
                notifyChange(widget, onChange, 'color', typographySnapshot(widget), { commit: false, source: 'input' });
            });
            colorPicker.addEventListener('change', function () {
                updateTypographyOverride(widget, 'color', colorPicker.value);
                notifyChange(widget, onChange, 'color', typographySnapshot(widget), { commit: true, source: 'change' });
            });
        }

        rootEl.querySelectorAll('[data-typo-override-segment] [data-value]').forEach(function (button) {
            button.addEventListener('click', function () {
                var group = button.closest('[data-typo-override-segment]');
                var key = group ? group.dataset.typoOverrideSegment : '';
                if (!key) return;

                updateTypographyOverride(widget, key, button.dataset.value || '');
                syncSegmentedState(group, button.dataset.value || '');
                notifyChange(widget, onChange, key, typographySnapshot(widget), { commit: true, source: 'click' });
            });
        });

        var resetButton = rootEl.querySelector('[data-typo-reset]');
        if (resetButton) {
            resetButton.addEventListener('click', function () {
                resetTypographyOverrides(widget);
                notifyChange(widget, onChange, 'reset', typographySnapshot(widget), { commit: true, source: 'click' });
            });
        }
    }

    function getTypographyFieldsForWidget(widgetType) {
        var normalizedType = normalizeWidgetType(widgetType);
        return (TYPOGRAPHY_FIELDS[normalizedType] || TYPOGRAPHY_FIELDS.paragraph).slice();
    }

    function renderTokenField(activeToken) {
        return [
            '<div class="inspector-field">',
            '<label for="typo-token">Text Style</label>',
            '<select id="typo-token" data-typo-token>',
            TOKEN_ORDER.map(function (tokenName) {
                var token = TYPOGRAPHY_TOKENS[tokenName];
                return '<option value="' + escapeAttribute(tokenName) + '"' + (tokenName === activeToken ? ' selected' : '') + '>' +
                    escapeHtml(token.label) + '</option>';
            }).join(''),
            '</select>',
            '</div>'
        ].join('');
    }

    function renderWeightField(overrideValue, inheritedValue) {
        return [
            '<div class="inspector-field" data-override-active="', overrideValue ? 'true' : 'false', '">',
            '<label for="typo-font-weight">Font Weight</label>',
            '<select id="typo-font-weight" data-typo-override="fontWeight">',
            '<option value="">From style', inheritedValue ? ' (' + escapeHtml(inheritedValue) + ')' : '', '</option>',
            FONT_WEIGHT_OPTIONS.map(function (value) {
                return '<option value="' + value + '"' + (value === overrideValue ? ' selected' : '') + '>' + value + '</option>';
            }).join(''),
            '</select>',
            renderFieldMeta(overrideValue, inheritedValue),
            '</div>'
        ].join('');
    }

    function renderTextTransformField(overrideValue, inheritedValue) {
        return [
            '<div class="inspector-field inspector-field--segmented" data-override-active="', overrideValue ? 'true' : 'false', '">',
            '<label>Text Transform</label>',
            '<div class="inspector-segmented" data-typo-override-segment="textTransform">',
            TEXT_TRANSFORM_OPTIONS.map(function (option) {
                var active = option.value === overrideValue;
                return '<button type="button" class="' + (active ? 'is-active' : '') + '" data-value="' + escapeAttribute(option.value) + '">' +
                    escapeHtml(option.label) + '</button>';
            }).join(''),
            '</div>',
            renderFieldMeta(overrideValue, inheritedValue),
            '</div>'
        ].join('');
    }

    function renderColorField(overrideValue, inheritedValue, label) {
        var swatchValue = isHexColor(overrideValue) ? overrideValue : normalizeHexColor(inheritedValue, '#0f172a');

        return [
            '<div class="inspector-field" data-override-active="', overrideValue ? 'true' : 'false', '">',
            '<label>', escapeHtml(label), '</label>',
            '<div class="inspector-color-row">',
            '<input type="color" value="', escapeAttribute(swatchValue), '" data-typo-color-picker>',
            '<input type="text" value="', escapeAttribute(overrideValue), '" placeholder="From style" data-typo-override="color">',
            '</div>',
            renderFieldMeta(overrideValue, inheritedValue),
            '</div>'
        ].join('');
    }

    function renderNumberField(label, key, overrideValue, inheritedValue, unit, step) {
        return [
            '<div class="inspector-field inspector-field--inline" data-override-active="', overrideValue ? 'true' : 'false', '">',
            '<label for="typo-', escapeAttribute(key), '">', escapeHtml(label), '</label>',
            '<div class="inspector-input-unit">',
            '<input id="typo-', escapeAttribute(key), '" type="number" step="', escapeAttribute(step), '" value="', escapeAttribute(displayOverrideValue(key, overrideValue)), '" placeholder="From style" data-typo-override="', escapeAttribute(key), '">',
            unit ? '<span>' + escapeHtml(unit) + '</span>' : '',
            '</div>',
            renderFieldMeta(overrideValue, inheritedValue),
            '</div>'
        ].join('');
    }

    function renderFieldMeta(overrideValue, inheritedValue) {
        return '<div class="inspector-field__meta">' +
            (overrideValue ? 'Override active' : 'From style' + (inheritedValue ? ': ' + escapeHtml(String(inheritedValue)) : '')) +
            '</div>';
    }

    function createEmptyTypographyOverrides() {
        return {
            fontSize: '',
            fontWeight: '',
            lineHeight: '',
            letterSpacing: '',
            textTransform: '',
            color: ''
        };
    }

    function normalizeTypographyOverrides(overrides, widgetType) {
        var normalized = createEmptyTypographyOverrides();
        var incoming = overrides && typeof overrides === 'object' ? overrides : {};
        var allowed = getTypographyFieldsForWidget(widgetType);

        allowed.forEach(function (key) {
            normalized[key] = normalizeTypographyOverrideValue(key, incoming[key]);
        });

        return normalized;
    }

    function normalizeTypographyOverrideValue(key, value) {
        if (value === null || value === undefined) {
            return '';
        }

        var raw = String(value).trim();
        if (!raw) {
            return '';
        }

        if (key === 'fontSize' || key === 'letterSpacing') {
            return normalizePixelValue(raw);
        }

        if (key === 'lineHeight') {
            return normalizeUnitlessNumber(raw);
        }

        if (key === 'fontWeight') {
            return FONT_WEIGHT_OPTIONS.indexOf(raw) > -1 ? raw : '';
        }

        if (key === 'textTransform') {
            return isAllowedTextTransform(raw) ? raw : '';
        }

        if (key === 'color') {
            return normalizeColorValue(raw);
        }

        return raw;
    }

    function normalizePixelValue(value) {
        if (value === '') return '';
        if (/^-?\d+(\.\d+)?px$/i.test(value)) return value.toLowerCase();
        if (/^-?\d+(\.\d+)?$/.test(value)) return value + 'px';
        return '';
    }

    function normalizeUnitlessNumber(value) {
        if (value === '') return '';
        if (/^-?\d+(\.\d+)?$/.test(value)) return value;
        return '';
    }

    function normalizeColorValue(value) {
        if (isHexColor(value)) {
            return normalizeHexColor(value);
        }

        if (/^rgba?\(/i.test(value) || /^hsla?\(/i.test(value) || value === 'transparent') {
            return value;
        }

        return '';
    }

    function normalizeHexColor(value, fallback) {
        if (!value) {
            return fallback || '#000000';
        }

        var raw = String(value).trim();
        if (/^#[0-9a-f]{6}$/i.test(raw)) {
            return raw.toLowerCase();
        }

        if (/^#[0-9a-f]{3}$/i.test(raw)) {
            return ('#' + raw[1] + raw[1] + raw[2] + raw[2] + raw[3] + raw[3]).toLowerCase();
        }

        return fallback || '#000000';
    }

    function isHexColor(value) {
        return /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(String(value || '').trim());
    }

    function isKnownToken(token) {
        return !!TYPOGRAPHY_TOKENS[String(token || '')];
    }

    function isAllowedTextTransform(value) {
        return ['none', 'uppercase', 'lowercase', 'capitalize'].indexOf(String(value || '')) > -1;
    }

    function isTypographyFieldAllowed(widgetType, key) {
        return getTypographyFieldsForWidget(widgetType).indexOf(key) > -1;
    }

    function normalizeWidgetType(widgetType) {
        var type = String(widgetType || '').toLowerCase();
        if (type === 'text' || type === 'text-editor') return 'paragraph';
        if (type === 'paragraph') return 'paragraph';
        if (type === 'heading') return 'heading';
        if (type === 'button') return 'button';
        return 'paragraph';
    }

    function displayOverrideValue(key, value) {
        if (!value) return '';
        if (key === 'fontSize' || key === 'letterSpacing') {
            return String(value).replace(/px$/i, '');
        }
        return String(value);
    }

    function syncSegmentedState(group, activeValue) {
        if (!group) return;
        group.querySelectorAll('[data-value]').forEach(function (button) {
            button.classList.toggle('is-active', button.dataset.value === activeValue);
        });
    }

    function typographySnapshot(widget) {
        return deepClone(ensureTypographyState(widget));
    }

    function notifyChange(widget, onChange, key, typography, meta) {
        if (typeof onChange === 'function') {
            onChange(widget, {
                scope: 'typography',
                key: key,
                typography: typography,
                computed: computeWidgetTypography(widget, TYPOGRAPHY_TOKENS),
                commit: !!(meta && meta.commit),
                source: meta && meta.source ? meta.source : ''
            });
        }
    }

    function deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function escapeHtml(value) {
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttribute(value) {
        return escapeHtml(value);
    }

    var api = {
        TYPOGRAPHY_TOKENS: TYPOGRAPHY_TOKENS,
        getTypographyTokens: getTypographyTokens,
        getDefaultTypographyForWidget: getDefaultTypographyForWidget,
        ensureTypographyState: ensureTypographyState,
        updateTypographyToken: updateTypographyToken,
        updateTypographyOverride: updateTypographyOverride,
        resetTypographyOverrides: resetTypographyOverrides,
        computeWidgetTypography: computeWidgetTypography,
        renderTypographyInspector: renderTypographyInspector,
        bindTypographyInspectorEvents: bindTypographyInspectorEvents
    };

    global.CMSTypographyInspector = api;
}(window));
