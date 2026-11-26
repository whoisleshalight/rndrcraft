import gsap from "gsap";

import "./cartsummary.scss";

document.querySelectorAll("[data-fls-cartsummary]").forEach((summary) => {
	const promo = summary.querySelector("[data-cart-promo]");
	const toggle = promo?.querySelector("summary");
	const panel = promo?.querySelector(".cartSummary__promoPanel");
	const form = panel?.querySelector("form");

	if (!promo || !toggle || !panel || !form) {
		return;
	}

	const eventController = new AbortController();
	const eventOptions = { signal: eventController.signal };
	const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
	let isExpanded = promo.open;
	let panelAnimation = null;

	toggle.setAttribute("aria-expanded", String(isExpanded));
	panel.inert = !isExpanded;

	function completeTransition() {
		promo.open = isExpanded;
		panel.inert = !isExpanded;
		gsap.set(panel, { clearProps: "height,opacity" });
		panelAnimation = null;
	}

	function animatePanel() {
		panelAnimation?.kill();
		toggle.setAttribute("aria-expanded", String(isExpanded));

		if (!isExpanded && panel.contains(document.activeElement)) {
			toggle.focus({ preventScroll: true });
		}

		panel.inert = !isExpanded;

		if (reducedMotion.matches) {
			completeTransition();
			return;
		}

		if (isExpanded) {
			const wasOpen = promo.open;
			promo.open = true;

			if (!wasOpen) {
				gsap.set(panel, { height: 0, opacity: 0 });
			}
		}

		panelAnimation = gsap.to(panel, {
			height: isExpanded ? "auto" : 0,
			opacity: isExpanded ? 1 : 0,
			duration: 0.36,
			ease: "power2.inOut",
			onComplete: completeTransition,
		});
	}

	toggle.addEventListener("click", (event) => {
		event.preventDefault();
		isExpanded = !isExpanded;
		animatePanel();
	}, eventOptions);

	reducedMotion.addEventListener("change", () => {
		panelAnimation?.kill();
		completeTransition();
	}, eventOptions);

	// The shared form component owns validation; the preview never submits a coupon.
	form.addEventListener("submit", (event) => {
		if (!form.hasAttribute("data-ui-preview-form")) {
			return;
		}

		event.preventDefault();
		queueMicrotask(() => form.querySelector('[aria-invalid="true"]')?.focus());
	}, eventOptions);

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			eventController.abort();
			panelAnimation?.kill();
			completeTransition();
			toggle.removeAttribute("aria-expanded");
			panel.inert = false;
		});
	}
});
