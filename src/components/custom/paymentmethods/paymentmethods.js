import Inputmask from "inputmask/lib/inputmask.js";
import "inputmask/lib/extensions/inputmask.date.extensions.js";

import { formValidate } from "@components/forms/_functions.js";

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
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	confirmationDialogs.forEach(({ element: dialog, action }) => {
		if (!dialog) {
			return;
		}

		let confirmationContext = null;

		function getActionUrl(trigger) {
			const rawUrl = trigger.dataset.paymentActionUrl || trigger.getAttribute("href");

			if (!rawUrl || rawUrl === "#") {
				return null;
			}

			try {
				const actionUrl = new URL(rawUrl, window.location.href);

				if (!/^https?:$/.test(actionUrl.protocol) || actionUrl.origin !== window.location.origin) {
					console.warn("Payment method actions must use a WooCommerce URL on this site.");
					return null;
				}

				return actionUrl.href;
			} catch {
				console.warn("The payment method action URL is invalid.");
				return null;
			}
		}

		function closeConfirmation(result = "cancel") {
			if (!dialog.open || dialog.classList.contains("paymentMethods__confirmation--closing")) {
				return;
			}

			dialog.returnValue = result;

			if (reducedMotion.matches) {
				dialog.close(result);
				return;
			}

			dialog.classList.add("paymentMethods__confirmation--closing");
		}

		component.addEventListener("click", (event) => {
			const trigger = event.target instanceof Element
				? event.target.closest('button[data-payment-action="' + action + '"], a[data-payment-action="' + action + '"]')
				: null;

			if (!trigger || event.defaultPrevented) {
				return;
			}

			// Prevent the native WooCommerce link from running before confirmation.
			event.preventDefault();

			if (dialog.open) {
				return;
			}

			confirmationContext = {
				action,
				tokenId: trigger.dataset.paymentTokenId || trigger.closest("[data-payment-token-id]")?.dataset.paymentTokenId || null,
				actionUrl: getActionUrl(trigger),
				trigger,
			};
			dialog.returnValue = "";
			dialog.showModal();
		}, eventOptions);

		dialog.querySelector("[data-payment-dialog-cancel]").addEventListener("click", () => {
			closeConfirmation();
		}, eventOptions);

		dialog.querySelector("[data-payment-dialog-confirm]").addEventListener("click", () => {
			closeConfirmation("confirm");
		}, eventOptions);

		dialog.addEventListener("cancel", (event) => {
			event.preventDefault();
			closeConfirmation();
		}, eventOptions);

		dialog.addEventListener("animationend", (event) => {
			if (event.target === dialog && event.animationName === "paymentConfirmationExit") {
				dialog.close(dialog.returnValue);
			}
		}, eventOptions);

		dialog.addEventListener("close", () => {
			dialog.classList.remove("paymentMethods__confirmation--closing");
			const confirmedContext = confirmationContext;
			confirmationContext = null;

			if (confirmedContext?.trigger.isConnected) {
				confirmedContext.trigger.focus({ preventScroll: true });
			}

			if (dialog.returnValue !== "confirm" || !confirmedContext) {
				return;
			}

			// An AJAX adapter can preventDefault synchronously and handle the real action itself.
			const shouldNavigate = component.dispatchEvent(new CustomEvent("paymentMethodConfirm", {
				bubbles: true,
				cancelable: true,
				detail: confirmedContext,
			}));

			if (shouldNavigate && confirmedContext.actionUrl) {
				window.location.assign(confirmedContext.actionUrl);
			}
		}, eventOptions);

		reducedMotion.addEventListener("change", () => {
			if (reducedMotion.matches && dialog.classList.contains("paymentMethods__confirmation--closing")) {
				dialog.close(dialog.returnValue);
			}
		}, eventOptions);
	});

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			eventController.abort();
			confirmationDialogs.forEach(({ element }) => element?.close());

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

	function setFormExpanded(isExpanded) {
		if (!isExpanded) {
			toggleButton.focus({ preventScroll: true });

			if (isPreview) {
				form.reset();
				inputs.forEach((input) => formValidate.removeError(input));
			}
		}

		formPanel.inert = !isExpanded;
		formPanel.setAttribute("aria-hidden", String(!isExpanded));
		formPanel.classList.toggle("paymentMethods__formPanel--expanded", isExpanded);
		toggleButton.setAttribute("aria-expanded", String(isExpanded));

		if (isExpanded) {
			form.querySelector('input:not([type="hidden"]):not(:disabled), iframe')?.focus({ preventScroll: true });
		}
	}

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
