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
    bodyUnlock(0);
    button?.setAttribute('aria-expanded', 'false');
    button?.focus();
}

if (filter && button && panel && handle && closeButton) {
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', () => {
        if (!bodyLockStatus) return;
        if (root.classList.contains('_filter-menu-open')) return closeFilter();
        bodyLock(0);
        root.classList.add('_filter-menu-open');
        button.setAttribute('aria-expanded', 'true');
        closeButton.focus();
    });
    closeButton.addEventListener('click', closeFilter);
    filter.addEventListener('click', (event) => {
        if (event.target === filter) closeFilter();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && root.classList.contains('_filter-menu-open')) closeFilter();
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
