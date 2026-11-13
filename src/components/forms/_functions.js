// Підключення функціоналу "Чортоги Фрілансера"
import { FLS } from "@js/common/functions.js"

// Валідація форм
export let formValidate = {
	getErrors(form) {
		FLS(`_FLS_FORM_VALIDATE`);
		let error = 0;
		let formRequiredItems = form.querySelectorAll('[required]');
		if (formRequiredItems.length) {
			formRequiredItems.forEach(formRequiredItem => {
				if ((formRequiredItem.offsetParent !== null || formRequiredItem.tagName === "SELECT") && !formRequiredItem.disabled) {
					error += this.validateInput(formRequiredItem);
				}
			});
		}
		return error;
	},
	validateInput(formRequiredItem) {
		let error = 0;
		const matchingFieldName = formRequiredItem.dataset.flsFormMatch;

		if (matchingFieldName && formRequiredItem.value.trim()) {
			const matchingField = formRequiredItem.form?.elements.namedItem(matchingFieldName);

			if (!matchingField || formRequiredItem.value !== matchingField.value) {
				this.addError(formRequiredItem, formRequiredItem.dataset.flsFormMatchErrtext);
				this.removeSuccess(formRequiredItem);
				return 1;
			}
		}

		if (formRequiredItem.type === "email") {
			formRequiredItem.value = formRequiredItem.value.trim();
			if (this.emailTest(formRequiredItem)) {
				this.addError(formRequiredItem);
				this.removeSuccess(formRequiredItem);
				error++;
			} else {
				this.removeError(formRequiredItem);
				this.addSuccess(formRequiredItem);
			}
		} else if (formRequiredItem.type === "checkbox" && !formRequiredItem.checked) {
			this.addError(formRequiredItem);
			this.removeSuccess(formRequiredItem);
			error++;
		} else {
			if (!formRequiredItem.value.trim()) {
				this.addError(formRequiredItem);
				this.removeSuccess(formRequiredItem);
				error++;
			} else {
				this.removeError(formRequiredItem);
				this.addSuccess(formRequiredItem);
			}
		}
		return error;
	},
	addError(formRequiredItem, errorMessage = formRequiredItem.dataset.flsFormErrtext) {
		formRequiredItem.classList.add('--form-error');
		formRequiredItem.parentElement.classList.add('--form-error');
		formRequiredItem.setAttribute('aria-invalid', 'true');
		if (formRequiredItem.tagName === 'SELECT') {
			formRequiredItem.parentElement.querySelector('.select__title')?.setAttribute('aria-invalid', 'true');
		}
		let inputError = formRequiredItem.parentElement.querySelector('[data-fls-form-error]');
		if (errorMessage) {
			if (!inputError) {
				inputError = document.createElement('div');
				inputError.setAttribute('data-fls-form-error', '');
				formRequiredItem.parentElement.append(inputError);
			}
			inputError.textContent = errorMessage;
			if (formRequiredItem.id) {
				inputError.id = `${formRequiredItem.id}-error`;
				const describedBy = new Set((formRequiredItem.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean));
				describedBy.add(inputError.id);
				formRequiredItem.setAttribute('aria-describedby', Array.from(describedBy).join(' '));
			}
		}
	},
	removeError(formRequiredItem) {
		formRequiredItem.classList.remove('--form-error');
		formRequiredItem.parentElement.classList.remove('--form-error');
		formRequiredItem.removeAttribute('aria-invalid');
		if (formRequiredItem.tagName === 'SELECT') {
			formRequiredItem.parentElement.querySelector('.select__title')?.removeAttribute('aria-invalid');
		}
		const inputError = formRequiredItem.parentElement.querySelector('[data-fls-form-error]');
		if (inputError) {
			const describedBy = (formRequiredItem.getAttribute('aria-describedby') || '')
				.split(/\s+/)
				.filter((descriptionId) => descriptionId && descriptionId !== inputError.id);
			if (describedBy.length) {
				formRequiredItem.setAttribute('aria-describedby', describedBy.join(' '));
			} else {
				formRequiredItem.removeAttribute('aria-describedby');
			}
			inputError.remove();
		}
	},
	addSuccess(formRequiredItem) {
		formRequiredItem.classList.add('--form-success');
		formRequiredItem.parentElement.classList.add('--form-success');
	},
	removeSuccess(formRequiredItem) {
		formRequiredItem.classList.remove('--form-success');
		formRequiredItem.parentElement.classList.remove('--form-success');
	},
	formClean(form, shouldReset = true) {
		if (shouldReset) {
			form.reset();
			return;
		}

		queueMicrotask(() => {
			let inputs = form.querySelectorAll('input,textarea,select');
			for (let index = 0; index < inputs.length; index++) {
				const el = inputs[index];
				el.parentElement.classList.remove('--form-focus');
				el.classList.remove('--form-focus');
				formValidate.removeError(el);
				formValidate.removeSuccess(el);
			}
			if (window['flsSelect']) {
				let selects = form.querySelectorAll('select[data-fls-select]')
				if (selects.length) {
					selects.forEach(select => {
						window['flsSelect'].selectBuild(select)
					})
				}
			}
		})
	},
	emailTest(formRequiredItem) {
		return !formRequiredItem.validity.valid;
	}
}
