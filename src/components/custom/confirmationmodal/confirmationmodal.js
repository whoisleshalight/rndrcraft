import "./confirmationmodal.scss";

const modalControllers = new WeakMap();

export function createConfirmationModal(dialog) {
	const existingController = modalControllers.get(dialog);

	if (existingController) {
		return existingController;
	}

	const eventController = new AbortController();
	const eventOptions = { signal: eventController.signal };
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	const cancelButton = dialog.querySelector("[data-confirmation-cancel]");
	let openingTrigger = null;
	let isClosing = false;
	let isDestroyed = false;
	let closeVersion = 0;

	function finishClose() {
		if (dialog.open && isClosing) {
			dialog.close();
		}
	}

	function open(trigger = document.activeElement) {
		if (isDestroyed || dialog.open || isClosing || !dialog.isConnected) {
			return false;
		}

		openingTrigger = trigger;
		dialog.showModal();
		return true;
	}

	function close() {
		if (isDestroyed || !dialog.open || isClosing) {
			return;
		}

		isClosing = true;
		const currentCloseVersion = ++closeVersion;

		if (reducedMotion.matches) {
			finishClose();
			return;
		}

		dialog.classList.add("confirmationModal--closing");
		const animations = dialog.getAnimations();

		if (animations.length === 0) {
			finishClose();
			return;
		}

		// Wait for the actual exit animation, including cancellation; no timing fallback is needed.
		Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
			if (!isDestroyed && currentCloseVersion === closeVersion) {
				finishClose();
			}
		});
	}

	cancelButton?.addEventListener("click", () => close(), eventOptions);

	dialog.addEventListener("cancel", (event) => {
		event.preventDefault();
		close();
	}, eventOptions);

	dialog.addEventListener("close", () => {
		closeVersion++;
		isClosing = false;
		dialog.classList.remove("confirmationModal--closing");
		const trigger = openingTrigger;
		openingTrigger = null;

		if (trigger?.isConnected) {
			trigger.focus({ preventScroll: true });
		}
	}, eventOptions);

	reducedMotion.addEventListener("change", () => {
		if (reducedMotion.matches) {
			finishClose();
		}
	}, eventOptions);

	function destroy() {
		isDestroyed = true;
		closeVersion++;
		eventController.abort();
		dialog.close();
		dialog.classList.remove("confirmationModal--closing");
		openingTrigger = null;
		modalControllers.delete(dialog);
	}

	const controller = { open, close, destroy };
	modalControllers.set(dialog, controller);
	return controller;
}
