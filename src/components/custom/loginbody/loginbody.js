import { formValidate } from "../../forms/_functions.js";
import "../../forms/form/form.js";

import "./loginbody.scss";

const recoveryErrors = {
	request: "We couldn't send a reset link. Please try again.",
	reset: "We couldn't update your password. Please try again.",
};

function setFeedback(view, message = "") {
	const feedback = view.querySelector("[data-login-feedback]");

	if (feedback) {
		feedback.textContent = message;
		feedback.hidden = !message;
	}
}

document.querySelectorAll("[data-fls-loginbody]").forEach((loginSection) => {
	const views = new Map(Array.from(loginSection.querySelectorAll("[data-login-view]")).map((view) => {
		return [view.dataset.loginView, view];
	}));
	const requestForm = loginSection.querySelector('[data-login-recovery-form="request"]');
	const resendButton = loginSection.querySelector("[data-login-resend]");
	const resendStatus = loginSection.querySelector("[data-login-resend-status]");
	let requestedEmail = "";
	let activeRequest = null;
	let currentView = null;

	function showView(viewName, shouldFocus = true) {
		const nextView = views.get(viewName);

		if (!nextView) {
			return;
		}

		activeRequest?.abort();
		activeRequest = null;

		views.forEach((view) => {
			const isActive = view === nextView;
			const isLeaving = view === currentView && !isActive;
			view.toggleAttribute("data-login-leaving", isLeaving);
			view.hidden = !isActive;
			view.inert = !isActive;

			if (isActive) {
				view.removeAttribute("aria-hidden");
			} else {
				view.setAttribute("aria-hidden", "true");
			}

			setFeedback(view);

			// Clear credentials, including revealed passwords, when leaving a card.
			if (view !== nextView) {
				view.querySelectorAll('input[autocomplete$="password"]').forEach((input) => {
					input.value = "";
					input.type = "password";
					formValidate.removeError(input);
					formValidate.removeSuccess(input);
				});
				view.querySelectorAll("[data-login-password-toggle]").forEach((button) => {
					button.setAttribute("aria-pressed", "false");
					button.setAttribute("aria-label", "Show password");
				});
			}
		});

		if (resendStatus) {
			resendStatus.hidden = true;
			resendStatus.textContent = "";
		}

		currentView = nextView;
		const heading = nextView.querySelector("h1");

		if (heading) {
			loginSection.setAttribute("aria-labelledby", heading.id);

			if (shouldFocus) {
				heading.focus({ preventScroll: true });
			}
		}
	}

	function navigateToView(viewName) {
		if (window.location.hash === `#${viewName}`) {
			showView(viewName);
			return;
		}

		window.location.hash = viewName;
	}

	function readRoute(shouldFocus = true) {
		const route = window.location.hash.slice(1);
		const errorRoutes = {
			"forgot-password-request-error": "request",
			"reset-password-update-error": "reset",
		};
		const errorOperation = Object.hasOwn(errorRoutes, route) ? errorRoutes[route] : null;

		if (errorOperation) {
			showView(errorOperation === "request" ? "forgot-password" : "reset-password", shouldFocus);
			setFeedback(currentView, recoveryErrors[errorOperation]);
			return;
		}

		if (views.has(route)) {
			showView(route, shouldFocus);
		} else if (!currentView) {
			showView("login", false);
		}
	}

	async function submitRecovery(form, isResend = false) {
		if (activeRequest) {
			return;
		}

		const operation = form.dataset.loginRecoveryForm;
		const feedbackView = currentView;
		const requestController = new AbortController();
		const formData = new FormData(form);
		const submitButton = form.querySelector('button[type="submit"]');
		const endpoint = form.dataset.loginEndpoint;
		activeRequest = requestController;
		form.classList.add("--sending");
		form.setAttribute("aria-busy", "true");
		submitButton.disabled = true;
		resendButton.disabled = true;
		setFeedback(feedbackView);

		if (resendStatus) {
			resendStatus.hidden = true;
		}

		try {
			if (endpoint) {
				const resetToken = new URLSearchParams(window.location.search).get("token");

				if (operation === "reset" && resetToken) {
					formData.set("token", resetToken);
				}

				// The authentication API owns delivery and password updates; it returns { success: true }.
				const response = await fetch(endpoint, {
					method: "POST",
					body: formData,
					headers: { Accept: "application/json" },
					credentials: "same-origin",
					signal: requestController.signal,
				});

				if (requestController.signal.aborted) {
					return;
				}

				if (operation === "reset" && response.status === 410) {
					activeRequest = null;
					navigateToView("reset-link-expired");
					return;
				}

				if (!response.ok) {
					throw new Error(`Password recovery request failed with status ${response.status}.`);
				}

				const result = await response.json();

				if (!result || typeof result !== "object" || result.success !== true) {
					throw new Error("The authentication API did not confirm success.");
				}
			} else if (!loginSection.hasAttribute("data-login-demo")) {
				throw new Error("A password recovery endpoint has not been configured.");
			}

			if (requestController.signal.aborted) {
				return;
			}

			activeRequest = null;

			if (operation === "request") {
				requestedEmail = String(formData.get("email") || "");

				if (isResend && resendStatus) {
					resendStatus.textContent = "A new reset link has been requested. Check your inbox.";
					resendStatus.hidden = false;
				} else {
					navigateToView("check-email");
				}
			} else {
				navigateToView("password-updated");
			}
		} catch (error) {
			if (!requestController.signal.aborted) {
				setFeedback(feedbackView, recoveryErrors[operation]);
				console.error("Password recovery failed.", error);
			}
		} finally {
			if (activeRequest === requestController) {
				activeRequest = null;
			}

			form.classList.remove("--sending");
			form.removeAttribute("aria-busy");
			submitButton.disabled = false;
			resendButton.disabled = false;
		}
	}

	loginSection.querySelectorAll("[data-login-password-toggle]").forEach((button) => {
		const input = document.getElementById(button.getAttribute("aria-controls"));

		if (!(input instanceof HTMLInputElement) || !loginSection.contains(input)) {
			return;
		}

		button.addEventListener("click", () => {
			const shouldShowPassword = input.type === "password";
			input.type = shouldShowPassword ? "text" : "password";
			button.setAttribute("aria-pressed", String(shouldShowPassword));
			button.setAttribute("aria-label", shouldShowPassword ? "Hide password" : "Show password");
		});
	});

	loginSection.querySelector("[data-login-form]")?.addEventListener("submit", (event) => {
		// Authentication is supplied separately; never navigate with credentials.
		event.preventDefault();
	});

	// The imported form module registers its load handler first, so it validates before submission.
	window.addEventListener("load", () => {
		loginSection.querySelectorAll("[data-login-recovery-form]").forEach((form) => {
			form.addEventListener("submit", (event) => {
				if (event.defaultPrevented) {
					return;
				}

				event.preventDefault();
				void submitRecovery(form);
			});

			form.addEventListener("input", () => {
				setFeedback(form.closest("[data-login-view]"));
			});
		});
	}, { once: true });

	resendButton?.addEventListener("click", () => {
		if (!requestForm || !requestedEmail) {
			navigateToView("forgot-password");
			return;
		}

		requestForm.querySelector('[name="email"]').value = requestedEmail;
		void submitRecovery(requestForm, true);
	});

	window.addEventListener("hashchange", () => readRoute());
	readRoute(false);
});
