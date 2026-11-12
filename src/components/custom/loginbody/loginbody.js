import "./loginbody.scss";

// Authentication is supplied separately; the static form must not navigate with credentials.
document.querySelectorAll("[data-fls-loginbody]").forEach((loginSection) => {
	const passwordInput = loginSection.querySelector("#login-password");
	const passwordToggle = loginSection.querySelector("[data-login-password-toggle]");
	const loginForm = loginSection.querySelector("[data-login-form]");

	if (passwordInput && passwordToggle) {
		passwordToggle.addEventListener("click", () => {
			const shouldShowPassword = passwordInput.type === "password";

			passwordInput.type = shouldShowPassword ? "text" : "password";
			passwordToggle.setAttribute("aria-pressed", String(shouldShowPassword));
			passwordToggle.setAttribute("aria-label", shouldShowPassword ? "Hide password" : "Show password");
		});
	}

	if (loginForm) {
		loginForm.addEventListener("submit", (event) => {
			event.preventDefault();
		});
	}
});