import { gotoBlock, FLS } from '@js/common/functions.js';
import { formValidate } from '../_functions.js';

import './form.scss';

function handleFormSent(form) {
    document.dispatchEvent(new CustomEvent('formSent', { detail: { form } }));
    formValidate.formClean(form);

    if (window.flsPopup && form.dataset.flsFormPopup) {
        window.flsPopup.open(form.dataset.flsFormPopup);
    }

    FLS('_FLS_FORM_SEND');
}

async function handleFormSubmit(event, form) {
    if (form.classList.contains('--sending')) {
        event.preventDefault();
        return;
    }

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
        handleFormSent(form);
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

        handleFormSent(form);
    } catch (error) {
        console.error('Form submission failed.', error);
    } finally {
        form.classList.remove('--sending');
        form.removeAttribute('aria-busy');
        submitControls.forEach(({ control, wasDisabled }) => {
            control.disabled = wasDisabled;
        });
    }
}

function getValidationField(target) {
    if (
        target instanceof HTMLInputElement
        || target instanceof HTMLTextAreaElement
        || target instanceof HTMLSelectElement
    ) {
        return target;
    }

    if (target instanceof HTMLElement) {
        return target.closest('.select')?.querySelector('select[data-fls-select]') ?? null;
    }

    return null;
}

function shouldValidateField(field) {
    if (!field || field.disabled) {
        return false;
    }

    return field.hasAttribute('data-fls-form-validatenow')
        || (field.required && field.form?.matches('.form-contacts'))
        || (field.required && (
            field.classList.contains('--form-error')
            || field.classList.contains('--form-success')
        ));
}

function initializeForms() {
    document.querySelectorAll('form[data-fls-form]').forEach((form) => {
        if (!form.hasAttribute('data-fls-form-novalidate')) {
            form.noValidate = true;
        }

        form.addEventListener('submit', (event) => {
            handleFormSubmit(event, form);
        });

        form.addEventListener('reset', () => {
            // The native reset event owns cleanup; it must not trigger another reset.
            formValidate.formClean(form, false);
        });

        form.addEventListener('focusin', ({ target }) => {
            const field = getValidationField(target);

            if (!field) {
                return;
            }
            if (!field.hasAttribute('data-fls-form-nofocus')) {
                field.classList.add('--form-focus');
                field.parentElement.classList.add('--form-focus');
            }

            if (shouldValidateField(field)) {
                formValidate.validateInput(field);
            } else {
                formValidate.removeError(field);
            }
        });

        form.addEventListener('focusout', ({ target, relatedTarget }) => {
            const field = getValidationField(target);

            if (!field) {
                return;
            }

            if (field instanceof HTMLSelectElement && field.parentElement.contains(relatedTarget)) {
                return;
            }

            field.classList.remove('--form-focus');
            field.parentElement.classList.remove('--form-focus');

            if (shouldValidateField(field)) {
                formValidate.validateInput(field);
            }
        });

        const handleFieldChange = ({ target }) => {
            const field = getValidationField(target);

            if (shouldValidateField(field)) {
                formValidate.validateInput(field);
            }
        };

        form.addEventListener('input', handleFieldChange);
        form.addEventListener('change', handleFieldChange);
    });

    document.addEventListener('selectCallback', ({ detail }) => {
        const field = detail.select;

        if (shouldValidateField(field)) {
            formValidate.validateInput(field);
        }
    });
}

window.addEventListener('load', initializeForms);
