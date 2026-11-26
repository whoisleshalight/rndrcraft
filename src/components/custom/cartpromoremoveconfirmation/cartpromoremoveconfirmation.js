import { createConfirmationModal } from "../confirmationmodal/confirmationmodal.js";

document.querySelectorAll("[data-fls-cartpromoremoveconfirmation]").forEach((dialog) => {
	const summary = dialog.closest("[data-fls-cartsummary]");
	const trigger = summary?.querySelector("[data-cart-promo-remove]");

	if (!trigger) {
		return;
	}

	const eventController = new AbortController();
	const confirmation = createConfirmationModal(dialog);

	trigger.addEventListener("click", (event) => {
		if (event.defaultPrevented) {
			return;
		}

		event.preventDefault();
		confirmation.open(trigger);
	}, { signal: eventController.signal });

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			eventController.abort();
			confirmation.destroy();
		});
	}
});
