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
    search.inert = true;
    search.setAttribute('aria-hidden', 'true');
    bodyUnlock(0);
    openButton?.setAttribute('aria-expanded', 'false');
    previousFocus?.focus();
}

if (search && openButton && closeButton) {
    search.inert = true;
    search.setAttribute('aria-hidden', 'true');
    openButton.setAttribute('aria-expanded', 'false');
    openButton.addEventListener('click', () => {
        if (!bodyLockStatus || root.classList.contains('search-open')) return;
        previousFocus = document.activeElement;
        root.removeAttribute('data-fls-menu-open');
        if (!root.hasAttribute('data-fls-scrolllock')) bodyLock(0);
        root.classList.add('search-open');
        search.inert = false;
        search.setAttribute('aria-hidden', 'false');
        openButton.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(() => {
            if (root.classList.contains('search-open')) {
                search.querySelector('input')?.focus({ preventScroll: true });
            }
        });
    });
    closeButton.addEventListener('click', closeSearch);
    document.addEventListener('keydown', (event) => {
        if (!root.classList.contains('search-open')) return;
        if (event.key === 'Escape') closeSearch();
    });
}
