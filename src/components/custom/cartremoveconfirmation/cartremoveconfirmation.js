import { createConfirmationModal } from "../confirmationmodal/confirmationmodal.js";

document.querySelectorAll("[data-fls-cartremoveconfirmation]").forEach((dialog) => {
	const cart = dialog.closest("[data-fls-curtsinglesection]");
	const description = dialog.querySelector("[data-confirmation-description]");

	if (!cart || !description) {
		return;
	}

	const eventController = new AbortController();
	const eventOptions = { signal: eventController.signal };
	const confirmation = createConfirmationModal(dialog);

	cart.addEventListener("click", (event) => {
		const trigger = event.target instanceof Element ? event.target.closest("[data-cart-remove]") : null;
		const product = trigger?.closest("[data-fls-cartproduct]");

		if (!trigger || !product || event.defaultPrevented || dialog.open) {
			return;
		}

		event.preventDefault();
		const productName = product.querySelector(".cartProduct__title")?.textContent.trim() || "this product";
		description.textContent = `Are you sure you want to remove ${productName} from your cart?`;
		confirmation.open(trigger);
	}, eventOptions);

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			eventController.abort();
			confirmation.destroy();
		});
	}
});
