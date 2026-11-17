import "./accountsidebar.scss";

document.querySelectorAll("[data-fls-accountsidebar]").forEach((sidebar) => {
	const navigation = sidebar.querySelector(".dashboard-nav");
	const navigationToggle = sidebar.querySelector("[data-dashboard-menu-toggle]");
	const navigationPanel = sidebar.querySelector(".dashboard-nav__panel");
	const currentPageLink = sidebar.querySelector(".dashboard-nav__current .dashboard-nav__link");

	if (!navigation || !navigationToggle || !navigationPanel || !currentPageLink) {
		return;
	}

	const mobileNavigation = window.matchMedia("(max-width: 991.98px)");
	const eventController = new AbortController();
	const eventOptions = { signal: eventController.signal };
	let isNavigationExpanded = false;

	function updateNavigation() {
		const isMobile = mobileNavigation.matches;
		const shouldShowNavigation = !isMobile || isNavigationExpanded;
		const shouldRestoreToggleFocus = !shouldShowNavigation && navigationPanel.contains(document.activeElement);
		const shouldRestoreLinkFocus = !isMobile && document.activeElement === navigationToggle;

		// On mobile the whole current-page row acts as the menu button.
		currentPageLink.inert = isMobile;

		if (shouldRestoreLinkFocus) {
			currentPageLink.focus({ preventScroll: true });
		}

		if (shouldRestoreToggleFocus) {
			navigationToggle.focus({ preventScroll: true });
		}

		navigation.classList.toggle("dashboard-nav--expanded", isMobile && isNavigationExpanded);
		navigation.classList.toggle("dashboard-nav--collapsed", isMobile && !isNavigationExpanded);
		navigationToggle.hidden = !isMobile;
		navigationToggle.setAttribute("aria-expanded", String(shouldShowNavigation));
		navigationToggle.setAttribute("aria-label", shouldShowNavigation ? `${currentPageLink.textContent.trim()}: collapse account navigation` : `${currentPageLink.textContent.trim()}: expand account navigation`);
		navigationPanel.inert = !shouldShowNavigation;

		if (shouldShowNavigation) {
			navigationPanel.removeAttribute("aria-hidden");
		} else {
			navigationPanel.setAttribute("aria-hidden", "true");
		}
	}

	updateNavigation();
	mobileNavigation.addEventListener("change", updateNavigation, eventOptions);

	navigationToggle.addEventListener("click", () => {
		isNavigationExpanded = !isNavigationExpanded;
		updateNavigation();
	}, eventOptions);

	navigation.addEventListener("keydown", (event) => {
		if (event.key !== "Escape" || !mobileNavigation.matches || !isNavigationExpanded) {
			return;
		}

		isNavigationExpanded = false;
		updateNavigation();
		navigationToggle.focus();
	}, eventOptions);

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			eventController.abort();
		});
	}
});
