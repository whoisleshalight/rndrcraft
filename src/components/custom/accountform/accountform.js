import { formValidate } from "@components/forms/_functions.js";

import "./accountform.scss";

function validateField(input) {
	let errorMessage = "";
	const matchingField = input.form.elements.namedItem(input.dataset.accountMatch);

	if (!input.value.trim()) {
		errorMessage = "This field is required.";
	} else if (input.type === "email" && !input.validity.valid) {
		errorMessage = "Enter a valid email address.";
	} else if (input.minLength > 0 && input.value.length < input.minLength) {
		errorMessage = `Use at least ${input.minLength} characters.`;
	} else if (matchingField instanceof HTMLInputElement && input.value !== matchingField.value) {
		errorMessage = "Passwords do not match.";
	}

	formValidate.removeError(input);

	if (errorMessage) {
		formValidate.addError(input, errorMessage);
		return false;
	}

	return true;
}

document.querySelectorAll("[data-fls-accountform]").forEach((form) => {
	const submitButton = form.querySelector('button[type="submit"]');
	const feedback = form.querySelector("[data-account-form-feedback]");
	const inputs = Array.from(form.querySelectorAll("input"));
	const eventController = new AbortController();
	const eventOptions = { signal: eventController.signal };
	let activeRequest = null;
	form.noValidate = true;

	function setFeedback(message = "", state = "error") {
		feedback.textContent = message;
		feedback.dataset.state = state;
		feedback.hidden = !message;
	}

	inputs.forEach((input) => {
		input.addEventListener("blur", () => validateField(input), eventOptions);
		input.addEventListener("input", () => {
			setFeedback();

			if (input.hasAttribute("aria-invalid")) {
				validateField(input);
			}

			inputs.forEach((matchingInput) => {
				if (matchingInput.dataset.accountMatch === input.name && matchingInput.value) {
					validateField(matchingInput);
				}
			});
		}, eventOptions);
	});

	form.addEventListener("submit", async (event) => {
		event.preventDefault();

		if (activeRequest) {
			return;
		}

		setFeedback();
		const invalidInputs = inputs.filter((input) => !validateField(input));

		if (invalidInputs.length) {
			invalidInputs[0].focus();
			return;
		}

		const endpoint = form.dataset.accountFormEndpoint;

		// The account API supplies this URL; an unsaved change must never be reported as successful.
		if (!endpoint) {
			setFeedback("Changes have not been saved. Account updates are not connected yet.");
			return;
		}

		const requestController = new AbortController();
		activeRequest = requestController;
		submitButton.disabled = true;
		form.setAttribute("aria-busy", "true");

		try {
			const response = await fetch(endpoint, {
				method: "POST",
				body: new FormData(form),
				headers: { Accept: "application/json" },
				credentials: "same-origin",
				signal: requestController.signal,
			});

			if (!response.ok) {
				throw new Error(`Account update failed with status ${response.status}.`);
			}

			const result = await response.json();

			if (!result || typeof result !== "object" || result.success !== true) {
				throw new Error("The account API did not confirm success.");
			}

			if (form.dataset.accountForm === "password") {
				form.reset();
				inputs.forEach((input) => {
					input.type = "password";
				});
				form.querySelectorAll("[data-account-password-toggle]").forEach((toggle) => {
					toggle.setAttribute("aria-pressed", "false");
					toggle.setAttribute("aria-label", "Show password");
				});
				setFeedback("Your password has been updated.", "success");
			} else {
				setFeedback("Your personal information has been updated.", "success");
			}
		} catch (error) {
			if (!requestController.signal.aborted) {
				setFeedback("We could not save your changes. Please try again.");
				console.error("Account update failed.", error);
			}
		} finally {
			activeRequest = null;
			submitButton.disabled = false;
			form.removeAttribute("aria-busy");
		}
	}, eventOptions);

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			eventController.abort();
			activeRequest?.abort();
		});
	}
});
