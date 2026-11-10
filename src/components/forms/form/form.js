import { gotoBlock, FLS } from '@js/common/functions.js';
import { formValidate } from '../_functions.js';

import './form.scss';

function setFormStatus(status, message, isError = false) {
    status.textContent = message;
    status.hidden = message === '';
    status.classList.toggle('form__status--error', isError);
}

function handleFormSent(form, status) {
    document.dispatchEvent(new CustomEvent('formSent', { detail: { form } }));
    formValidate.formClean(form);
    setFormStatus(status, 'Your message has been sent.');

    if (window.flsPopup && form.dataset.flsFormPopup) {
        window.flsPopup.open(form.dataset.flsFormPopup);
    }

    FLS('_FLS_FORM_SEND');
}

async function handleFormSubmit(event, form, status) {
    if (form.classList.contains('--sending')) {
        event.preventDefault();
        return;
    }

    setFormStatus(status, '');
    const errorCount = formValidate.getErrors(form);

    if (errorCount > 0) {
        event.preventDefault();

        if (form.hasAttribute('data-fls-form-gotoerr')) {
            gotoBlock(form.dataset.flsFormGotoerr || '.--form-error');
        }

        return;
    }

    if (form.dataset.flsForm !== 'ajax' && form.dataset.flsForm !== 'dev') {
        return;
    }

    event.preventDefault();

    if (form.dataset.flsForm === 'dev') {
        handleFormSent(form, status);
        return;
    }

    const submitControls = Array.from(form.querySelectorAll(
        'button:not([type]), button[type="submit"], input[type="submit"]',
    )).map((control) => ({ control, wasDisabled: control.disabled }));

    form.classList.add('--sending');
    form.setAttribute('aria-busy', 'true');
    const formData = new FormData(form);
    submitControls.forEach(({ control }) => {
        control.disabled = true;
    });

    try {
        const response = await fetch(form.action, {
            method: form.method.toUpperCase(),
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Form request failed with status ${response.status}.`);
        }

        const result = await response.json();

        if (result && typeof result === 'object' && result.success === false) {
            throw new Error('The server did not accept the form.');
        }

        handleFormSent(form, status);
    } catch (error) {
        setFormStatus(status, 'Your message could not be sent. Please try again.', true);
        console.error('Form submission failed.', error);
    } finally {
        form.classList.remove('--sending');
        form.removeAttribute('aria-busy');
        submitControls.forEach(({ control, wasDisabled }) => {
            control.disabled = wasDisabled;
        });
    }
}

function initializeForms() {
    document.querySelectorAll('form[data-fls-form]').forEach((form) => {
        if (!form.hasAttribute('data-fls-form-novalidate')) {
            form.noValidate = true;
        }

        const status = document.createElement('p');
        status.className = 'form__status';
        status.setAttribute('role', 'status');
        status.hidden = true;
        form.append(status);

        form.addEventListener('submit', (event) => {
            handleFormSubmit(event, form, status);
        });

        form.addEventListener('reset', () => {
            // The native reset event owns cleanup; it must not trigger another reset.
            formValidate.formClean(form, false);
            setFormStatus(status, '');
        });

        form.addEventListener('focusin', ({ target }) => {
            if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
                return;
            }
            if (!target.hasAttribute('data-fls-form-nofocus')) {
                target.classList.add('--form-focus');
                target.parentElement.classList.add('--form-focus');
            }
            formValidate.removeError(target);
        });

        form.addEventListener('focusout', ({ target }) => {
            if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
                return;
            }
            target.classList.remove('--form-focus');
            target.parentElement.classList.remove('--form-focus');
            if (target.hasAttribute('data-fls-form-validatenow')) {
                formValidate.validateInput(target);
            }
        });
    });
}

window.addEventListener('load', initializeForms);
