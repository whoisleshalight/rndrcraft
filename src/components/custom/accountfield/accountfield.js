import "./accountfield.scss";

document.querySelectorAll("[data-fls-accountfield]").forEach((field) => {
	const toggle = field.querySelector("[data-account-password-toggle]");
	const input = field.querySelector("input");

	if (!toggle || !input) {
		return;
	}

	const eventController = new AbortController();

	toggle.addEventListener("click", () => {
		const shouldShowPassword = input.type === "password";
		input.type = shouldShowPassword ? "text" : "password";
		toggle.setAttribute("aria-pressed", String(shouldShowPassword));
		toggle.setAttribute("aria-label", shouldShowPassword ? "Hide password" : "Show password");
	}, { signal: eventController.signal });

	if (import.meta.hot) {
		import.meta.hot.dispose(() => eventController.abort());
	}
});
