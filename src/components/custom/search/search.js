import './search.scss';

import { bodyLock, bodyUnlock, bodyLockStatus } from '@js/common/functions.js';

const root = document.documentElement;
const search = document.querySelector('[data-fls-search]');
const openButton = document.querySelector('.search-open-btn');
const closeButton = search?.querySelector('.search-close-btn');
let previousFocus;

function closeSearch() {
    if (!root.classList.contains('search-open')) return;
    root.classList.remove('search-open');
    bodyUnlock(0);
    openButton?.setAttribute('aria-expanded', 'false');
    previousFocus?.focus();
}

if (search && openButton && closeButton) {
    openButton.setAttribute('aria-expanded', 'false');
    openButton.addEventListener('click', () => {
        if (!bodyLockStatus || root.classList.contains('search-open')) return;
        previousFocus = document.activeElement;
        root.removeAttribute('data-fls-menu-open');
        if (!root.hasAttribute('data-fls-scrolllock')) bodyLock(0);
        root.classList.add('search-open');
        openButton.setAttribute('aria-expanded', 'true');
        setTimeout(() => {
            if (root.classList.contains('search-open')) {
                search.querySelector('input')?.focus({ preventScroll: true });
            }
        }, 50);
    });
    closeButton.addEventListener('click', closeSearch);
    document.addEventListener('keydown', (event) => {
        if (!root.classList.contains('search-open')) return;
        if (event.key === 'Escape') closeSearch();
        if (event.key === 'Tab') {
            const controls = [...search.querySelectorAll('a[href], button, input, [tabindex="0"]')];
            const first = controls[0];
            const last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first?.focus();
            }
        }
    });
}
