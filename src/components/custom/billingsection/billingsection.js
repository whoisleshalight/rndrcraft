import { formValidate } from "@components/forms/_functions.js";
import { createConfirmationModal } from "../confirmationmodal/confirmationmodal.js";

import "@components/custom/accountform/accountform.scss";
import "./billingsection.scss";

document.querySelectorAll("[data-fls-billingsection]").forEach((section) => {
	const form = section.querySelector("[data-billing-form]");
	const companyFields = section.querySelector("[data-billing-company]");
	const companyPanel = section.querySelector("[data-billing-company-panel]");

	if (!form || !companyFields || !companyPanel) {
		return;
	}

	const eventController = new AbortController();
	const eventOptions = { signal: eventController.signal };

	function updateCompanyFields() {
		const selectedCustomerType = form.querySelector('[name="billing_customer_type"]:checked');
		const isCompany = selectedCustomerType?.value === "company";

		if (!isCompany && companyFields.contains(document.activeElement)) {
			selectedCustomerType?.focus({ preventScroll: true });
		}

		companyPanel.hidden = false;
		companyPanel.inert = !isCompany;
		companyPanel.setAttribute("aria-hidden", String(!isCompany));
		companyPanel.classList.toggle("billingsection__collapsible--expanded", isCompany);
		companyFields.disabled = !isCompany;
	}

	form.addEventListener("change", (event) => {
		if (event.target instanceof HTMLInputElement && event.target.name === "billing_customer_type") {
			updateCompanyFields();
		}
	}, eventOptions);

	form.addEventListener("reset", () => {
		queueMicrotask(updateCompanyFields);
	}, eventOptions);

	// Removing this attribute hands submission and validation to WooCommerce.
	if (form.hasAttribute("data-ui-preview-form")) {
		const fields = Array.from(form.querySelectorAll('input:not([type="radio"]), select'));
		form.noValidate = true;

		function validateField(field) {
			let errorMessage = "";

			if (!field.matches(":disabled")) {
				if (field.required && !field.value.trim()) {
					errorMessage = "This field is required.";
				} else if (field.type === "email" && field.value && !field.validity.valid) {
					errorMessage = "Enter a valid email address.";
				}
			}

			if (errorMessage) {
				formValidate.addError(field, errorMessage);
				return false;
			}

			formValidate.removeError(field);
			return true;
		}

		form.addEventListener("submit", (event) => {
			event.preventDefault();
			const invalidFields = fields.filter((field) => !validateField(field));
			const firstInvalidField = invalidFields[0];

			if (firstInvalidField) {
				const focusTarget = firstInvalidField.hidden
					? firstInvalidField.parentElement.querySelector(".select__input") || firstInvalidField.parentElement.querySelector(".select__title")
					: firstInvalidField;
				focusTarget?.focus();
			}
		}, eventOptions);

		form.addEventListener("focusout", (event) => {
			if (fields.includes(event.target)) {
				validateField(event.target);
			}
		}, eventOptions);

		form.addEventListener("input", (event) => {
			if (fields.includes(event.target) && event.target.hasAttribute("aria-invalid")) {
				validateField(event.target);
			}
		}, eventOptions);

		form.addEventListener("change", () => {
			fields.filter((field) => field.matches(":disabled")).forEach((field) => formValidate.removeError(field));
		}, eventOptions);

		document.addEventListener("selectCallback", (event) => {
			if (fields.includes(event.detail.select)) {
				validateField(event.detail.select);
			}
		}, eventOptions);

		form.addEventListener("reset", () => {
			fields.forEach((field) => formValidate.removeError(field));
		}, eventOptions);
	}

	updateCompanyFields();
	const leaveDialog = section.querySelector("[data-billing-leave-dialog]");
	let leaveConfirmation = null;

	if (leaveDialog && form.hasAttribute("data-billing-unsaved-guard")) {
		leaveConfirmation = createConfirmationModal(leaveDialog);
		let shouldAllowNavigation = false;

		function getFormSnapshot() {
			return JSON.stringify(Array.from(new FormData(form).entries()));
		}

		let initialSnapshot = getFormSnapshot();

		form.addEventListener("selectCountryInitialized", (event) => {
			const countrySelect = event.target;
			// Update only the initialized country; retain any other unsaved edits.
			const initialEntries = JSON.parse(initialSnapshot).map(([name, value]) => {
				return [name, name === countrySelect.name ? countrySelect.value : value];
			});
			initialSnapshot = JSON.stringify(initialEntries);
		}, eventOptions);

		function hasUnsavedChanges() {
			return form.hasAttribute("data-billing-unsaved-guard") && getFormSnapshot() !== initialSnapshot;
		}

		document.addEventListener("click", (event) => {
			if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || !hasUnsavedChanges()) {
				return;
			}

			const link = event.target instanceof Element ? event.target.closest("a[href]") : null;

			if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) {
				return;
			}

			const destination = new URL(link.href, window.location.href);

			if (!/^https?:$/.test(destination.protocol)) {
				return;
			}

			if (destination.origin === window.location.origin && destination.pathname === window.location.pathname && destination.search === window.location.search) {
				return;
			}

			event.preventDefault();

			if (leaveDialog.open) {
				return;
			}

			leaveConfirmation.open(link);
		}, eventOptions);

		form.addEventListener("submit", (event) => {
			// An accepted native submit navigates to WooCommerce; prevented preview/AJAX submits keep the guard active.
			queueMicrotask(() => {
				const target = event.submitter?.formTarget || form.target || "_self";
				shouldAllowNavigation = !event.defaultPrevented && target === "_self";
			});
		}, eventOptions);

		window.addEventListener("beforeunload", (event) => {
			if (!shouldAllowNavigation && hasUnsavedChanges()) {
				event.preventDefault();
				event.returnValue = "";
			}
		}, eventOptions);
	}

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			eventController.abort();
			leaveConfirmation?.destroy();
		});
	}
});
