import "./searchfield.scss";

document.querySelectorAll("[data-fls-searchfield]").forEach((searchField) => {
	const searchInput = searchField.querySelector("[data-search-field-input]");
	const clearButton = searchField.querySelector("[data-search-field-clear]");

	if (!searchInput || !clearButton) {
		return;
	}

	const eventController = new AbortController();

	clearButton.addEventListener("click", () => {
		searchInput.value = "";
		searchInput.focus();
	}, { signal: eventController.signal });

	if (import.meta.hot) {
		import.meta.hot.dispose(() => {
			eventController.abort();
		});
	}
});
