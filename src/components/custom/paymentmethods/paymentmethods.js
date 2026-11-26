import Inputmask from "inputmask/lib/inputmask.js";
import "inputmask/lib/extensions/inputmask.date.extensions.js";

import { formValidate } from "@components/forms/_functions.js";
import { createConfirmationModal } from "../confirmationmodal/confirmationmodal.js";

import "./paymentmethods.scss";

document.querySelectorAll("[data-fls-paymentmethods]").forEach((component) => {
	const form = component.querySelector("[data-payment-form]");
	const formPanel = component.querySelector("[data-payment-panel]");
	const toggleButton = component.querySelector("[data-payment-toggle]");
	const cancelButton = component.querySelector("[data-payment-cancel]");
	const confirmationDialogs = [
		{ element: component.querySelector("[data-payment-remove-dialog]"), action: "remove" },
		{ element: component.querySelector("[data-payment-default-dialog]"), action: "default" },
	];

	const eventController = new AbortController();
	const eventOptions = { signal: eventController.signal };
	const isPreview = Boolean(form?.hasAttribute("data-ui-preview-form"));
	const inputs = form ? Array.from(form.querySelectorAll("input")) : [];
	const modalControllers = [];
	confirmationDialogs.forEach(({ element: dialog, action }) => {
		if (!dialog) {
			return;
		}

		const confirmation = createConfirmationModal(dialog);
		modalControllers.push(confirmation);

		component.addEventListener("click", (event) => {
			const trigger = event.target instanceof Element
				? event.target.closest(`button[data-payment-action="${action}"]`)
				: null;

			if (!trigger || event.defaultPrevented) {
				return;
			}

			event.preventDefault();
			confirmation.open(trigger);
		}, eventOptions);
	});

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			eventController.abort();
			modalControllers.forEach((confirmation) => confirmation.destroy());

			if (isPreview) {
				inputs.forEach((input) => input.inputmask?.remove());
				form.reset();
			}
		});
	}

	// Saved-method actions remain available when the gateway has no add-method form.
	if (!form || !formPanel || !toggleButton || !cancelButton) {
		return;
	}

	function setFormExpanded(isExpanded, shouldMoveFocus = true) {
		if (!isExpanded) {
			if (shouldMoveFocus) {
				toggleButton.focus({ preventScroll: true });
			}

			if (isPreview) {
				form.reset();
				inputs.forEach((input) => formValidate.removeError(input));
			}
		}

		formPanel.inert = !isExpanded;
		formPanel.setAttribute("aria-hidden", String(!isExpanded));
		formPanel.classList.toggle("paymentMethods__formPanel--expanded", isExpanded);
		toggleButton.setAttribute("aria-expanded", String(isExpanded));

		if (isExpanded && shouldMoveFocus) {
			form.querySelector('input:not([type="hidden"]):not(:disabled), iframe')?.focus({ preventScroll: true });
		}
	}

	setFormExpanded(toggleButton.getAttribute("aria-expanded") === "true", false);

	toggleButton.addEventListener("click", () => {
		setFormExpanded(toggleButton.getAttribute("aria-expanded") !== "true");
	}, eventOptions);

	cancelButton.addEventListener("click", () => setFormExpanded(false), eventOptions);

	form.addEventListener("keydown", (event) => {
		if (event.key === "Escape") {
			event.preventDefault();
			setFormExpanded(false);
		}
	}, eventOptions);

	// Preview validation demonstrates field states only. WooCommerce/provider code owns real validation and submission.
	if (isPreview) {
		form.noValidate = true;
		const maskOptions = {
			cardNumber: { mask: "9999 9999 9999 9{1,4}[ 9{1,3}]" },
			expiry: { alias: "datetime", inputFormat: "mm / yy", prefillYear: false },
			securityCode: { mask: "999[9]" },
		};

		inputs.forEach((input) => {
			const options = maskOptions[input.dataset.paymentMask];

			if (!options) {
				return;
			}

			Inputmask({
				...options,
				inputmode: "numeric",
				showMaskOnHover: false,
				showMaskOnFocus: false,
				jitMasking: true,
			}).mask(input);
		});

		function validateInput(input) {
			const inputValue = input.inputmask ? input.inputmask.unmaskedvalue() : input.value;

			if (input.required && !inputValue.trim()) {
				formValidate.addError(input, "This field is required.");
				return false;
			}

			if (inputValue && input.inputmask && !input.inputmask.isComplete()) {
				formValidate.addError(input, "Complete this field.");
				return false;
			}

			formValidate.removeError(input);
			return true;
		}

		inputs.forEach((input) => {
			input.addEventListener("blur", () => validateInput(input), eventOptions);
			input.addEventListener("input", () => {
				if (input.hasAttribute("aria-invalid")) {
					validateInput(input);
				}
			}, eventOptions);
		});

		form.addEventListener("submit", (event) => {
			event.preventDefault();
			const invalidInputs = inputs.filter((input) => !validateInput(input));
			invalidInputs[0]?.focus();
		}, eventOptions);
	}

});
