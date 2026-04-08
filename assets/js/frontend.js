(function () {
    const config = window.VB_FRONTEND || {};

    document.querySelectorAll('[data-tab-target]').forEach((tab) => {
        tab.addEventListener('click', () => {
            const root = tab.closest('.vb-tabs');
            if (!root) return;
            root.querySelectorAll('.vb-tabs__tab, .vb-tabs__pane').forEach((node) => node.classList.remove('is-active'));
            tab.classList.add('is-active');
            const pane = root.querySelector('#' + CSS.escape(tab.dataset.tabTarget));
            if (pane) pane.classList.add('is-active');
        });
    });

    document.querySelectorAll('[data-accordion-target]').forEach((button) => {
        button.addEventListener('click', () => {
            const target = document.getElementById(button.dataset.accordionTarget);
            const wrapper = button.closest('.vb-accordion');
            if (!target) return;
            if (wrapper?.dataset.single === '1') {
                wrapper.querySelectorAll('.vb-accordion__panel').forEach((panel) => {
                    if (panel !== target) panel.classList.remove('is-open');
                });
            }
            target.classList.toggle('is-open');
        });
    });

    document.querySelectorAll('[data-popup-target]').forEach((button) => {
        button.addEventListener('click', () => {
            const target = document.getElementById(button.dataset.popupTarget);
            if (target) target.classList.add('is-open');
        });
    });

    document.querySelectorAll('[data-popup-close]').forEach((button) => {
        button.addEventListener('click', () => {
            const modal = button.closest('.vb-popup-modal');
            if (modal) modal.classList.remove('is-open');
        });
    });

    document.querySelectorAll('[data-menu-toggle]').forEach((button) => {
        button.addEventListener('click', () => {
            const menu = button.closest('.vb-menu');
            menu?.classList.toggle('is-open');
        });
    });

    document.querySelectorAll('.vb-countdown').forEach((node) => {
        const targetDate = new Date(node.dataset.targetDate || '');
        if (Number.isNaN(targetDate.getTime())) return;
        const tick = () => {
            const distance = targetDate.getTime() - Date.now();
            if (distance <= 0) {
                node.textContent = '00d 00h 00m 00s';
                return;
            }
            const days = Math.floor(distance / 86400000);
            const hours = Math.floor((distance % 86400000) / 3600000);
            const minutes = Math.floor((distance % 3600000) / 60000);
            const seconds = Math.floor((distance % 60000) / 1000);
            node.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        };
        tick();
        window.setInterval(tick, 1000);
    });

    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const node = entry.target;
            const target = Number(node.dataset.target || 0);
            const duration = 1000;
            const startedAt = performance.now();
            const animate = (now) => {
                const progress = Math.min((now - startedAt) / duration, 1);
                node.textContent = Math.round(progress * target).toString();
                if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
            counterObserver.unobserve(node);
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('.vb-counter').forEach((node) => counterObserver.observe(node));

    const tocList = document.querySelector('[data-toc-list]');
    if (tocList) {
        document.querySelectorAll('.vb-heading').forEach((heading) => {
            if (!heading.id) return;
            const item = document.createElement('li');
            item.innerHTML = `<a href="#${heading.id}">${heading.textContent}</a>`;
            tocList.appendChild(item);
        });
    }

    document.querySelectorAll('.vb-form').forEach((form) => {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);
            formData.append('page_slug', form.dataset.pageSlug || 'home');
            formData.append('form_name', form.dataset.formName || 'contact_form');

            const response = await fetch(config.formEndpoint, {
                method: 'POST',
                body: formData,
            });
            const data = await response.json();
            const message = form.querySelector('.vb-form__message');
            if (message) {
                message.hidden = false;
                message.textContent = data.message || 'Thanks, your submission has been received.';
            }
            form.reset();
        });
    });
})();
