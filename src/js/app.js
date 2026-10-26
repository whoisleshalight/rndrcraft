import { addTouchAttr, addLoadedAttr } from '@js/common/functions.js';

addTouchAttr();
addLoadedAttr();

function updateViewportHeight() {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
}
updateViewportHeight();
window.addEventListener('resize', updateViewportHeight);

document.addEventListener('input', ({ target }) => {
    if (target.matches('._typed')) target.classList.toggle('_data', target.value.trim() !== '');
});
document.addEventListener('focusin', ({ target }) => {
    if (target.matches('input, textarea')) {
        target.classList.add('_form-focus');
        target.parentElement.classList.add('_form-focus');
    }
});
document.addEventListener('focusout', ({ target }) => {
    if (target.matches('input, textarea')) {
        target.classList.remove('_form-focus');
        target.parentElement.classList.remove('_form-focus');
    }
});
document.addEventListener('submit', (event) => {
    if (event.target.matches('[data-fls-subscribe], .search__form')) event.preventDefault();
});
