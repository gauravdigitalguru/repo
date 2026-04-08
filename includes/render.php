<?php

declare(strict_types=1);

function render_document_tree(array $nodes, array $context = []): string
{
    $html = '';

    foreach ($nodes as $node) {
        if (!is_array($node) || empty($node['type'])) {
            continue;
        }

        $html .= render_node($node, $context);
    }

    return $html;
}

function render_node(array $node, array $context = []): string
{
    $type = (string) ($node['type'] ?? 'container');
    $id = htmlspecialchars((string) ($node['id'] ?? uniqid('node_')), ENT_QUOTES, 'UTF-8');
    $content = $node['content'] ?? [];
    $styles = render_style_string((array) (($node['styles']['desktop'] ?? $node['styles'] ?? [])), $type);
    $attributes = render_node_attributes($node);
    $children = is_array($node['children'] ?? null) ? $node['children'] : [];
    $inner = render_document_tree($children, $context);

    switch ($type) {
        case 'section':
        case 'container':
        case 'inner-section':
        case 'columns':
            return '<section class="vb-node vb-' . $type . '" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . $inner . '</section>';

        case 'column':
            $width = htmlspecialchars((string) (($node['styles']['desktop']['width'] ?? $node['styles']['width'] ?? '100%')), ENT_QUOTES, 'UTF-8');
            return '<div class="vb-node vb-column" id="' . $id . '" style="' . $styles . ';flex:0 0 ' . $width . '"' . $attributes . '>' . $inner . '</div>';

        case 'heading':
            $level = (int) ($content['level'] ?? 2);
            $level = max(1, min(6, $level));
            $text = htmlspecialchars((string) ($content['text'] ?? 'Heading'), ENT_QUOTES, 'UTF-8');
            $link = trim((string) ($content['link'] ?? ''));
            $body = $link !== '' ? '<a href="' . htmlspecialchars($link, ENT_QUOTES, 'UTF-8') . '">' . $text . '</a>' : $text;
            return "<h{$level} class=\"vb-node vb-heading\" id=\"{$id}\" style=\"{$styles}\"{$attributes}>{$body}</h{$level}>";

        case 'paragraph':
            return '<div class="vb-node vb-paragraph" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . safe_html((string) ($content['html'] ?? '<p>Paragraph</p>')) . '</div>';

        case 'image':
            $src = htmlspecialchars((string) ($content['src'] ?? ''), ENT_QUOTES, 'UTF-8');
            if ($src === '') {
                return '';
            }
            $alt = htmlspecialchars((string) ($content['alt'] ?? ''), ENT_QUOTES, 'UTF-8');
            $title = htmlspecialchars((string) ($content['title'] ?? ''), ENT_QUOTES, 'UTF-8');
            $caption = trim((string) ($content['caption'] ?? ''));
            $image = '<img src="' . $src . '" alt="' . $alt . '" title="' . $title . '" loading="' . (!empty($content['lazy']) ? 'lazy' : 'eager') . '" style="' . $styles . '">';
            if (!empty($content['lightbox'])) {
                $image = '<a href="' . $src . '" class="vb-lightbox-trigger">' . $image . '</a>';
            }
            if ($caption !== '') {
                $image .= '<figcaption>' . htmlspecialchars($caption, ENT_QUOTES, 'UTF-8') . '</figcaption>';
            }
            return '<figure class="vb-node vb-image" id="' . $id . '"' . $attributes . '>' . $image . '</figure>';

        case 'video':
            return render_video_widget($node, $id, $styles, $attributes);

        case 'button':
            $buttonText = htmlspecialchars((string) ($content['text'] ?? 'Button'), ENT_QUOTES, 'UTF-8');
            $href = htmlspecialchars((string) ($content['link'] ?? '#'), ENT_QUOTES, 'UTF-8');
            $icon = !empty($content['icon']) ? '<span class="vb-button__icon">' . safe_html((string) $content['icon']) . '</span>' : '';
            return '<div class="vb-node vb-button-wrap" id="' . $id . '"' . $attributes . '><a class="vb-button" href="' . $href . '" style="' . $styles . '">' . $icon . '<span>' . $buttonText . '</span></a></div>';

        case 'divider':
            return '<hr class="vb-node vb-divider" id="' . $id . '" style="' . $styles . '"' . $attributes . '>';

        case 'spacer':
            return '<div class="vb-node vb-spacer" id="' . $id . '" style="' . $styles . '"' . $attributes . '></div>';

        case 'icon':
            return '<div class="vb-node vb-icon" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . safe_html((string) ($content['icon'] ?? '&#9733;')) . '</div>';

        case 'icon-list':
            $items = $content['items'] ?? [];
            $markup = '<ul class="vb-icon-list">';
            foreach ($items as $item) {
                $markup .= '<li><span class="vb-icon-list__icon">' . safe_html((string) ($item['icon'] ?? '&#10003;')) . '</span><span>' . htmlspecialchars((string) ($item['text'] ?? ''), ENT_QUOTES, 'UTF-8') . '</span></li>';
            }
            $markup .= '</ul>';
            return '<div class="vb-node" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . $markup . '</div>';

        case 'gallery':
            $items = $content['items'] ?? [];
            $markup = '<div class="vb-gallery">';
            foreach ($items as $item) {
                $src = htmlspecialchars((string) ($item['src'] ?? ''), ENT_QUOTES, 'UTF-8');
                if ($src === '') {
                    continue;
                }
                $alt = htmlspecialchars((string) ($item['alt'] ?? ''), ENT_QUOTES, 'UTF-8');
                $caption = trim((string) ($item['caption'] ?? ''));
                $markup .= '<figure><img src="' . $src . '" alt="' . $alt . '">' . ($caption !== '' ? '<figcaption>' . htmlspecialchars($caption, ENT_QUOTES, 'UTF-8') . '</figcaption>' : '') . '</figure>';
            }
            $markup .= '</div>';
            return '<div class="vb-node vb-gallery-wrap" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . $markup . '</div>';

        case 'audio':
            $src = htmlspecialchars((string) ($content['src'] ?? ''), ENT_QUOTES, 'UTF-8');
            return $src !== '' ? '<audio class="vb-node vb-audio" id="' . $id . '" style="' . $styles . '" controls src="' . $src . '"' . $attributes . '></audio>' : '';

        case 'download':
            $src = htmlspecialchars((string) ($content['src'] ?? '#'), ENT_QUOTES, 'UTF-8');
            $label = htmlspecialchars((string) ($content['label'] ?? 'Download file'), ENT_QUOTES, 'UTF-8');
            return '<a class="vb-node vb-download" id="' . $id . '" style="' . $styles . '" href="' . $src . '" download' . $attributes . '>' . $label . '</a>';

        case 'tabs':
            return render_tabs_widget($node, $id, $styles, $attributes);

        case 'accordion':
        case 'toggle':
            return render_accordion_widget($node, $id, $styles, $attributes, $type === 'toggle');

        case 'popup':
            return '<div class="vb-node vb-popup" id="' . $id . '" style="' . $styles . '"' . $attributes . '><button class="vb-popup-trigger" data-popup-target="' . $id . '-modal">' . htmlspecialchars((string) ($content['buttonText'] ?? 'Open popup'), ENT_QUOTES, 'UTF-8') . '</button><div class="vb-popup-modal" id="' . $id . '-modal"><div class="vb-popup-dialog"><button class="vb-popup-close" data-popup-close>&times;</button>' . $inner . '</div></div></div>';

        case 'contact-form':
            return render_form_widget($node, $id, $styles, $attributes);

        case 'menu':
            return render_menu_widget($node, $id, $styles, $attributes, $context);

        case 'site-logo':
            $settings = $context['site_settings'] ?? [];
            $logo = htmlspecialchars((string) ($settings['site_logo'] ?? ''), ENT_QUOTES, 'UTF-8');
            return $logo !== '' ? '<a href="/" class="vb-node vb-site-logo" id="' . $id . '"' . $attributes . '><img src="' . $logo . '" alt="' . htmlspecialchars((string) ($settings['site_name'] ?? 'Site logo'), ENT_QUOTES, 'UTF-8') . '" style="' . $styles . '"></a>' : '';

        case 'site-title':
            return '<div class="vb-node vb-site-title" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . htmlspecialchars((string) (($context['site_settings']['site_name'] ?? 'Site Title')), ENT_QUOTES, 'UTF-8') . '</div>';

        case 'site-tagline':
            return '<div class="vb-node vb-site-tagline" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . htmlspecialchars((string) (($context['site_settings']['site_tagline'] ?? '')), ENT_QUOTES, 'UTF-8') . '</div>';

        case 'search-form':
            return '<form class="vb-node vb-search-form" id="' . $id . '" method="get" action="/" style="' . $styles . '"' . $attributes . '><input type="search" name="q" placeholder="Search"><button type="submit">Search</button></form>';

        case 'breadcrumbs':
            return '<nav class="vb-node vb-breadcrumbs" id="' . $id . '" style="' . $styles . '"' . $attributes . '>Home / ' . htmlspecialchars((string) ($context['document']['title'] ?? 'Page'), ENT_QUOTES, 'UTF-8') . '</nav>';

        case 'archive-list':
            return render_archive_widget($id, $styles, $attributes, $context);

        case 'post-grid':
        case 'post-carousel':
            return render_post_list_widget($node, $id, $styles, $attributes, $context, $type === 'post-carousel');

        case 'author-box':
            return '<div class="vb-node vb-author-box" id="' . $id . '" style="' . $styles . '"' . $attributes . '><strong>' . htmlspecialchars((string) ($content['name'] ?? 'Author Name'), ENT_QUOTES, 'UTF-8') . '</strong><p>' . htmlspecialchars((string) ($content['bio'] ?? 'Author bio'), ENT_QUOTES, 'UTF-8') . '</p></div>';

        case 'comments-list':
            return '<div class="vb-node vb-comments" id="' . $id . '" style="' . $styles . '"' . $attributes . '><p>No comments yet.</p></div>';

        case 'html':
            return '<div class="vb-node vb-html" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . safe_html((string) ($content['html'] ?? '')) . '</div>';

        case 'javascript':
            return '<div class="vb-node vb-js-embed" id="' . $id . '" style="' . $styles . '"' . $attributes . '><div class="vb-js-placeholder">Custom JavaScript embed configured for this page.</div></div>';

        case 'css':
            return '';

        case 'shortcode':
            return '<div class="vb-node vb-shortcode" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . htmlspecialchars((string) ($content['shortcode'] ?? '[shortcode]'), ENT_QUOTES, 'UTF-8') . '</div>';

        case 'map':
            $embed = htmlspecialchars((string) ($content['embed'] ?? ''), ENT_QUOTES, 'UTF-8');
            return $embed !== '' ? '<iframe class="vb-node vb-map" id="' . $id . '" style="' . $styles . '" src="' . $embed . '" loading="lazy"' . $attributes . '></iframe>' : '';

        case 'social-icons':
            $items = $content['items'] ?? [];
            $markup = '<div class="vb-social-icons">';
            foreach ($items as $item) {
                $markup .= '<a href="' . htmlspecialchars((string) ($item['url'] ?? '#'), ENT_QUOTES, 'UTF-8') . '">' . safe_html((string) ($item['icon'] ?? '')) . '</a>';
            }
            $markup .= '</div>';
            return '<div class="vb-node" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . $markup . '</div>';

        case 'countdown':
            return '<div class="vb-node vb-countdown" id="' . $id . '" style="' . $styles . '" data-target-date="' . htmlspecialchars((string) ($content['targetDate'] ?? ''), ENT_QUOTES, 'UTF-8') . '"' . $attributes . '>00d 00h 00m 00s</div>';

        case 'progress':
            $value = (int) ($content['value'] ?? 70);
            return '<div class="vb-node vb-progress" id="' . $id . '" style="' . $styles . '"' . $attributes . '><div class="vb-progress__label">' . htmlspecialchars((string) ($content['label'] ?? 'Progress'), ENT_QUOTES, 'UTF-8') . '</div><div class="vb-progress__track"><span class="vb-progress__bar" style="width:' . $value . '%"></span></div></div>';

        case 'testimonial-slider':
            $items = $content['items'] ?? [];
            $markup = '<div class="vb-testimonial-slider">';
            foreach ($items as $item) {
                $markup .= '<article class="vb-testimonial"><blockquote>' . htmlspecialchars((string) ($item['quote'] ?? ''), ENT_QUOTES, 'UTF-8') . '</blockquote><p>' . htmlspecialchars((string) ($item['name'] ?? ''), ENT_QUOTES, 'UTF-8') . '</p></article>';
            }
            $markup .= '</div>';
            return '<div class="vb-node" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . $markup . '</div>';

        case 'pricing-table':
            return render_pricing_widget($node, $id, $styles, $attributes);

        case 'counter':
            $target = (int) ($content['target'] ?? 100);
            return '<div class="vb-node vb-counter" id="' . $id . '" style="' . $styles . '" data-target="' . $target . '"' . $attributes . '>0</div>';

        case 'table-of-contents':
            return '<nav class="vb-node vb-toc" id="' . $id . '" style="' . $styles . '"' . $attributes . '><div class="vb-toc__title">' . htmlspecialchars((string) ($content['title'] ?? 'On this page'), ENT_QUOTES, 'UTF-8') . '</div><ul data-toc-list></ul></nav>';
    }

    return '<div class="vb-node" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . $inner . '</div>';
}

function render_style_string(array $styles, string $type = ''): string
{
    $flat = [];
    foreach ($styles as $key => $value) {
        if (is_array($value)) {
            continue;
        }
        $flat[$key] = $value;
    }

    $map = [
        'backgroundColor' => 'background-color',
        'backgroundImage' => 'background-image',
        'backgroundSize' => 'background-size',
        'backgroundPosition' => 'background-position',
        'color' => 'color',
        'fontFamily' => 'font-family',
        'fontSize' => 'font-size',
        'fontWeight' => 'font-weight',
        'lineHeight' => 'line-height',
        'letterSpacing' => 'letter-spacing',
        'textAlign' => 'text-align',
        'padding' => 'padding',
        'margin' => 'margin',
        'border' => 'border',
        'borderRadius' => 'border-radius',
        'boxShadow' => 'box-shadow',
        'opacity' => 'opacity',
        'width' => 'width',
        'minHeight' => 'min-height',
        'height' => 'height',
        'gap' => 'gap',
        'justifyContent' => 'justify-content',
        'alignItems' => 'align-items',
        'flexDirection' => 'flex-direction',
        'display' => 'display',
        'position' => 'position',
        'top' => 'top',
        'right' => 'right',
        'bottom' => 'bottom',
        'left' => 'left',
        'zIndex' => 'z-index',
        'overflow' => 'overflow',
    ];

    $parts = ['box-sizing:border-box'];
    foreach ($map as $key => $property) {
        $value = trim((string) ($flat[$key] ?? ''));
        if ($value !== '') {
            $parts[] = $property . ':' . htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
        }
    }

    if (in_array($type, ['container', 'section', 'inner-section', 'columns'], true) && !isset($flat['display'])) {
        $parts[] = 'display:flex';
    }

    if ($type === 'image') {
        $parts[] = 'max-width:100%';
        $parts[] = 'height:auto';
        $parts[] = 'display:block';
    }

    return implode(';', $parts);
}

function render_node_attributes(array $node): string
{
    $advanced = (array) ($node['advanced'] ?? []);
    $attributes = [];
    if (!empty($advanced['cssClass'])) {
        $attributes[] = ' data-user-class="' . htmlspecialchars((string) $advanced['cssClass'], ENT_QUOTES, 'UTF-8') . '"';
    }
    if (!empty($advanced['anchorId'])) {
        $attributes[] = ' data-anchor="' . htmlspecialchars((string) $advanced['anchorId'], ENT_QUOTES, 'UTF-8') . '"';
    }
    if (!empty($advanced['animation'])) {
        $attributes[] = ' data-animation="' . htmlspecialchars((string) $advanced['animation'], ENT_QUOTES, 'UTF-8') . '"';
    }
    if (!empty($advanced['hideDesktop'])) {
        $attributes[] = ' data-hide-desktop="1"';
    }
    if (!empty($advanced['hideTablet'])) {
        $attributes[] = ' data-hide-tablet="1"';
    }
    if (!empty($advanced['hideMobile'])) {
        $attributes[] = ' data-hide-mobile="1"';
    }
    return implode('', $attributes);
}

function build_responsive_css(array $nodes): string
{
    $css = '';
    foreach ($nodes as $node) {
        if (!is_array($node)) {
            continue;
        }
        $nodeId = (string) ($node['id'] ?? '');
        $styles = (array) ($node['styles'] ?? []);
        if ($nodeId !== '') {
            foreach (['tablet' => '@media (max-width: 991px)', 'mobile' => '@media (max-width: 767px)'] as $breakpoint => $media) {
                if (!empty($styles[$breakpoint]) && is_array($styles[$breakpoint])) {
                    $css .= $media . '{#' . $nodeId . '{' . render_style_string($styles[$breakpoint]) . '}}';
                }
            }
        }
        if (!empty($node['children']) && is_array($node['children'])) {
            $css .= build_responsive_css($node['children']);
        }
    }
    return $css;
}

function collect_custom_code(array $nodes, string $type): string
{
    $content = '';
    foreach ($nodes as $node) {
        if (($node['type'] ?? '') === $type) {
            $content .= (string) (($node['content']['code'] ?? $node['content']['css'] ?? $node['content']['javascript'] ?? ''));
        }
        if (!empty($node['children']) && is_array($node['children'])) {
            $content .= collect_custom_code($node['children'], $type);
        }
    }
    return $content;
}

function render_tabs_widget(array $node, string $id, string $styles, string $attributes): string
{
    $items = $node['content']['items'] ?? [];
    if (!$items) {
        return '';
    }
    $nav = '<div class="vb-tabs__nav">';
    $panes = '<div class="vb-tabs__panes">';
    foreach ($items as $index => $item) {
        $active = $index === 0 ? ' is-active' : '';
        $nav .= '<button type="button" class="vb-tabs__tab' . $active . '" data-tab-target="' . $id . '-pane-' . $index . '">' . htmlspecialchars((string) ($item['label'] ?? 'Tab'), ENT_QUOTES, 'UTF-8') . '</button>';
        $panes .= '<div class="vb-tabs__pane' . $active . '" id="' . $id . '-pane-' . $index . '">' . safe_html((string) ($item['content'] ?? '')) . '</div>';
    }
    $nav .= '</div>';
    $panes .= '</div>';
    return '<div class="vb-node vb-tabs" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . $nav . $panes . '</div>';
}

function render_accordion_widget(array $node, string $id, string $styles, string $attributes, bool $single = false): string
{
    $items = $node['content']['items'] ?? [];
    $markup = '<div class="vb-accordion" data-single="' . ($single ? '1' : '0') . '">';
    foreach ($items as $index => $item) {
        $markup .= '<div class="vb-accordion__item"><button type="button" class="vb-accordion__button" data-accordion-target="' . $id . '-panel-' . $index . '">' . htmlspecialchars((string) ($item['label'] ?? 'Item'), ENT_QUOTES, 'UTF-8') . '</button><div class="vb-accordion__panel" id="' . $id . '-panel-' . $index . '">' . safe_html((string) ($item['content'] ?? '')) . '</div></div>';
    }
    $markup .= '</div>';
    return '<div class="vb-node" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . $markup . '</div>';
}

function render_video_widget(array $node, string $id, string $styles, string $attributes): string
{
    $content = (array) ($node['content'] ?? []);
    $sourceType = (string) ($content['sourceType'] ?? 'self');
    $source = trim((string) ($content['src'] ?? ''));
    if ($source === '') {
        return '';
    }

    if (in_array($sourceType, ['youtube', 'vimeo'], true)) {
        return '<div class="vb-node vb-video-embed" id="' . $id . '" style="' . $styles . '"' . $attributes . '><iframe src="' . htmlspecialchars($source, ENT_QUOTES, 'UTF-8') . '" allowfullscreen loading="lazy"></iframe></div>';
    }

    $attrs = [];
    foreach (['autoplay', 'loop', 'controls', 'muted'] as $flag) {
        if (!empty($content[$flag])) {
            $attrs[] = $flag;
        }
    }

    $poster = trim((string) ($content['poster'] ?? ''));
    if ($poster !== '') {
        $attrs[] = 'poster="' . htmlspecialchars($poster, ENT_QUOTES, 'UTF-8') . '"';
    }

    return '<video class="vb-node vb-video" id="' . $id . '" style="' . $styles . '" src="' . htmlspecialchars($source, ENT_QUOTES, 'UTF-8') . '" ' . implode(' ', $attrs) . $attributes . '></video>';
}

function render_form_widget(array $node, string $id, string $styles, string $attributes): string
{
    $content = (array) ($node['content'] ?? []);
    $fields = $content['fields'] ?? [];
    $formName = htmlspecialchars((string) ($content['formName'] ?? 'contact_form'), ENT_QUOTES, 'UTF-8');
    $pageSlug = htmlspecialchars((string) ($GLOBALS['vb_page_slug'] ?? 'home'), ENT_QUOTES, 'UTF-8');
    $markup = '<form class="vb-form" data-form-name="' . $formName . '" data-page-slug="' . $pageSlug . '" enctype="multipart/form-data">';
    foreach ($fields as $field) {
        $fieldType = htmlspecialchars((string) ($field['type'] ?? 'text'), ENT_QUOTES, 'UTF-8');
        $fieldName = htmlspecialchars((string) ($field['name'] ?? 'field'), ENT_QUOTES, 'UTF-8');
        $fieldLabel = htmlspecialchars((string) ($field['label'] ?? ucfirst($fieldName)), ENT_QUOTES, 'UTF-8');
        $markup .= '<label><span>' . $fieldLabel . '</span>';
        if ($fieldType === 'select') {
            $markup .= '<select name="' . $fieldName . '">';
            foreach (($field['options'] ?? []) as $option) {
                $markup .= '<option value="' . htmlspecialchars((string) $option, ENT_QUOTES, 'UTF-8') . '">' . htmlspecialchars((string) $option, ENT_QUOTES, 'UTF-8') . '</option>';
            }
            $markup .= '</select>';
        } elseif ($fieldType === 'checkbox') {
            $markup .= '<div class="vb-form__choices">';
            foreach ((array) ($field['options'] ?? []) as $option) {
                $optionValue = htmlspecialchars((string) $option, ENT_QUOTES, 'UTF-8');
                $markup .= '<label class="vb-form__choice"><input type="checkbox" name="' . $fieldName . '" value="' . $optionValue . '"><span>' . $optionValue . '</span></label>';
            }
            $markup .= '</div>';
        } elseif ($fieldType === 'radio') {
            $markup .= '<div class="vb-form__choices">';
            foreach ((array) ($field['options'] ?? []) as $option) {
                $optionValue = htmlspecialchars((string) $option, ENT_QUOTES, 'UTF-8');
                $markup .= '<label class="vb-form__choice"><input type="radio" name="' . $fieldName . '" value="' . $optionValue . '"><span>' . $optionValue . '</span></label>';
            }
            $markup .= '</div>';
        } elseif ($fieldType === 'textarea' || $fieldName === 'message') {
            $markup .= '<textarea name="' . $fieldName . '" rows="4"></textarea>';
        } else {
            $markup .= '<input type="' . $fieldType . '" name="' . $fieldName . '">';
        }
        $markup .= '</label>';
    }
    $markup .= '<button type="submit">' . htmlspecialchars((string) ($content['submitText'] ?? 'Submit'), ENT_QUOTES, 'UTF-8') . '</button><div class="vb-form__message" hidden></div></form>';
    return '<div class="vb-node vb-contact-form" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . $markup . '</div>';
}

function render_menu_widget(array $node, string $id, string $styles, string $attributes, array $context): string
{
    $menuId = (int) (($node['content']['menuId'] ?? 0));
    $menus = $context['menus'] ?? [];
    $menu = null;
    foreach ($menus as $candidate) {
        if ((int) $candidate['id'] === $menuId) {
            $menu = $candidate;
            break;
        }
    }
    if (!$menu) {
        return '';
    }

    $orientation = htmlspecialchars((string) ($node['content']['orientation'] ?? 'horizontal'), ENT_QUOTES, 'UTF-8');
    $html = '<nav class="vb-node vb-menu vb-menu--' . $orientation . '" id="' . $id . '" style="' . $styles . '"' . $attributes . '>';
    $html .= '<button class="vb-menu__toggle" type="button" data-menu-toggle>&#9776;</button>';
    $html .= render_menu_list($menu['items']);
    $html .= '</nav>';
    return $html;
}

function render_menu_list(array $items): string
{
    $html = '<ul class="vb-menu__list">';
    foreach ($items as $item) {
        $label = htmlspecialchars((string) ($item['label'] ?? 'Menu item'), ENT_QUOTES, 'UTF-8');
        $url = htmlspecialchars((string) ($item['url'] ?? '#'), ENT_QUOTES, 'UTF-8');
        $html .= '<li><a href="' . $url . '">' . $label . '</a>';
        if (!empty($item['children']) && is_array($item['children'])) {
            $html .= render_menu_list($item['children']);
        }
        $html .= '</li>';
    }
    $html .= '</ul>';
    return $html;
}

function render_archive_widget(string $id, string $styles, string $attributes, array $context): string
{
    $posts = $context['posts'] ?? [];
    $html = '<ul class="vb-archive-list">';
    foreach ($posts as $post) {
        $html .= '<li><a href="/post/' . htmlspecialchars((string) $post['slug'], ENT_QUOTES, 'UTF-8') . '">' . htmlspecialchars((string) $post['title'], ENT_QUOTES, 'UTF-8') . '</a></li>';
    }
    $html .= '</ul>';
    return '<div class="vb-node" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . $html . '</div>';
}

function render_post_list_widget(array $node, string $id, string $styles, string $attributes, array $context, bool $carousel = false): string
{
    $posts = array_slice($context['posts'] ?? [], 0, (int) (($node['content']['limit'] ?? 6)));
    $class = $carousel ? 'vb-post-list vb-post-list--carousel' : 'vb-post-list';
    $html = '<div class="' . $class . '">';
    foreach ($posts as $post) {
        $html .= '<article class="vb-post-card">';
        if (!empty($post['featured_image'])) {
            $html .= '<img src="' . htmlspecialchars((string) $post['featured_image'], ENT_QUOTES, 'UTF-8') . '" alt="">';
        }
        $html .= '<h3>' . htmlspecialchars((string) $post['title'], ENT_QUOTES, 'UTF-8') . '</h3>';
        $html .= '<p>' . htmlspecialchars((string) ($post['excerpt'] ?? ''), ENT_QUOTES, 'UTF-8') . '</p>';
        $html .= '</article>';
    }
    $html .= '</div>';
    return '<div class="vb-node" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . $html . '</div>';
}

function render_pricing_widget(array $node, string $id, string $styles, string $attributes): string
{
    $content = (array) ($node['content'] ?? []);
    $features = $content['features'] ?? [];
    $html = '<div class="vb-pricing"><h3>' . htmlspecialchars((string) ($content['title'] ?? 'Plan'), ENT_QUOTES, 'UTF-8') . '</h3>';
    $html .= '<div class="vb-pricing__price">' . htmlspecialchars((string) ($content['price'] ?? '$99'), ENT_QUOTES, 'UTF-8') . '</div><ul>';
    foreach ($features as $feature) {
        $html .= '<li>' . htmlspecialchars((string) $feature, ENT_QUOTES, 'UTF-8') . '</li>';
    }
    $html .= '</ul></div>';
    return '<div class="vb-node" id="' . $id . '" style="' . $styles . '"' . $attributes . '>' . $html . '</div>';
}
