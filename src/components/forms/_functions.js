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
	addError(formRequiredItem) {
		formRequiredItem.classList.add('--form-error');
		formRequiredItem.parentElement.classList.add('--form-error');
		formRequiredItem.setAttribute('aria-invalid', 'true');
		if (formRequiredItem.tagName === 'SELECT') {
			formRequiredItem.parentElement.querySelector('.select__title')?.setAttribute('aria-invalid', 'true');
		}
		let inputError = formRequiredItem.parentElement.querySelector('[data-fls-form-error]');
		if (formRequiredItem.dataset.flsFormErrtext) {
			if (!inputError) {
				inputError = document.createElement('div');
				inputError.setAttribute('data-fls-form-error', '');
				formRequiredItem.parentElement.append(inputError);
			}
			inputError.textContent = formRequiredItem.dataset.flsFormErrtext;
		}
	},
	removeError(formRequiredItem) {
		formRequiredItem.classList.remove('--form-error');
		formRequiredItem.parentElement.classList.remove('--form-error');
		formRequiredItem.removeAttribute('aria-invalid');
		if (formRequiredItem.tagName === 'SELECT') {
			formRequiredItem.parentElement.querySelector('.select__title')?.removeAttribute('aria-invalid');
		}
		if (formRequiredItem.parentElement.querySelector('[data-fls-form-error]')) {
			formRequiredItem.parentElement.removeChild(formRequiredItem.parentElement.querySelector('[data-fls-form-error]'));
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
