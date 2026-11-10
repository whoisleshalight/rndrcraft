import './mobile-filter.scss';

import { bodyLock, bodyUnlock, bodyLockStatus } from '@js/common/functions.js';

const root = document.documentElement;
const filter = document.querySelector('[data-fls-mobile-filter]');
const button = document.querySelector('.mobile-filter__btn');
const panel = filter?.querySelector('.menu-mobile-filter__box');
const handle = filter?.querySelector('.menu-mobile-filter__head');
const closeButton = filter?.querySelector('.menu-mobile-filter__close-btn');

function closeFilter() {
    root.classList.remove('_filter-menu-open');
    filter.inert = true;
    filter.setAttribute('aria-hidden', 'true');
    bodyUnlock(0);
    button?.setAttribute('aria-expanded', 'false');
    button?.focus();
}

if (filter && button && panel && handle && closeButton) {
    filter.inert = true;
    filter.setAttribute('role', 'dialog');
    filter.setAttribute('aria-modal', 'true');
    filter.setAttribute('aria-label', 'Filters');
    filter.setAttribute('aria-hidden', 'true');
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
        if (!bodyLockStatus) return;
        if (root.classList.contains('_filter-menu-open')) return closeFilter();
        bodyLock(0);
        filter.inert = false;
        filter.setAttribute('aria-hidden', 'false');
        root.classList.add('_filter-menu-open');
        button.setAttribute('aria-expanded', 'true');
        closeButton.focus();
    });
    closeButton.addEventListener('click', closeFilter);
    filter.addEventListener('click', (event) => {
        if (event.target === filter) closeFilter();
    });
    document.addEventListener('keydown', (event) => {
        if (!root.classList.contains('_filter-menu-open')) return;
        if (event.key === 'Escape') closeFilter();
    });

    window.matchMedia('(min-width: 1280px)').addEventListener('change', (event) => {
        if (event.matches && root.classList.contains('_filter-menu-open')) closeFilter();
    });

    // Pointer events preserve the original swipe gesture without a CDN dependency.
    handle.style.touchAction = 'none';
    let startY;
    let distance = 0;
    handle.addEventListener('pointerdown', (event) => {
        if (event.target.closest('button')) return;
        startY = event.clientY;
        distance = 0;
        handle.setPointerCapture(event.pointerId);
        panel.style.transition = 'none';
    });
    handle.addEventListener('pointermove', (event) => {
        if (startY === undefined) return;
        distance = Math.max(0, event.clientY - startY);
        panel.style.transform = `translateY(${distance}px)`;
    });
    function finishDrag(event) {
        if (startY === undefined) return;
        startY = undefined;
        // Commit the dragged position before restoring the CSS transition.
        panel.getBoundingClientRect();
        panel.style.removeProperty('transition');
        panel.style.removeProperty('transform');
        if (distance > 100 && event.type !== 'pointercancel') closeFilter();
    }
    handle.addEventListener('pointerup', finishDrag);
    handle.addEventListener('pointercancel', finishDrag);
}
