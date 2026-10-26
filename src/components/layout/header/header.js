import { bodyUnlock } from '@js/common/functions.js';

const root = document.documentElement;
const menuButton = document.querySelector('[data-fls-menu]');
if (menuButton) {
    new MutationObserver(() => {
        menuButton.setAttribute('aria-expanded', String(root.hasAttribute('data-fls-menu-open')));
    }).observe(root, { attributes: true, attributeFilter: ['data-fls-menu-open'] });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && root.hasAttribute('data-fls-menu-open')) {
            root.removeAttribute('data-fls-menu-open');
            bodyUnlock(0);
            menuButton.focus();
        }
    });
}
