import countries from '../data/countries-en.json';
import { setupCountryAccessibility } from '../helpers/country-accessibility.js';

const countryCodes = new Set(countries.map((country) => country.code));
const eventController = new AbortController();
const eventOptions = { signal: eventController.signal };
const pendingRequests = new Set();

function populateCountries(select) {
	const savedCountry = select.value;
	const placeholder = new Option('Select your country', '', !savedCountry, !savedCountry);
	const options = countries.map((country) => {
		const isSelected = country.code === savedCountry;
		return new Option(country.name, country.code, isSelected, isSelected);
	});

	select.replaceChildren(placeholder, ...options);
	select.value = countryCodes.has(savedCountry) ? savedCountry : '';

	if (select.closest('.select')) {
		window.flsSelect?.selectBuild(select);
	}
}

async function detectInitialCountry(select, hasUserInteracted) {
	const requestController = new AbortController();
	pendingRequests.add(requestController);
	const timeout = window.setTimeout(() => requestController.abort('timeout'), 8000);

	try {
		const response = await fetch('https://api.country.is/', {
			signal: requestController.signal,
			credentials: 'omit',
			referrerPolicy: 'no-referrer',
			headers: { Accept: 'application/json' },
		});

		if (!response.ok) {
			throw new Error(`Country lookup returned HTTP ${response.status}.`);
		}

		const result = await response.json();
		const country = typeof result?.country === 'string' ? result.country.toUpperCase() : '';

		if (!countryCodes.has(country)) {
			throw new Error('Country lookup returned an unsupported country code.');
		}

		// A delayed response must never replace a saved value or ongoing user input.
		if (hasUserInteracted() || select.value || select.disabled || !select.isConnected || requestController.signal.aborted) {
			return;
		}

		select.value = country;
		Array.from(select.options).forEach((option) => {
			option.defaultSelected = option.value === country;
		});

		if (select.closest('.select')) {
			window.flsSelect?.selectBuild(select);
		}

		// Initial detection is a default, not an unsaved edit or a form submission.
		select.dispatchEvent(new CustomEvent('selectCountryInitialized', { bubbles: true }));
	} catch (error) {
		if (!eventController.signal.aborted) {
			console.warn('Could not detect your country. Please select it manually.', error);
		}
	} finally {
		window.clearTimeout(timeout);
		pendingRequests.delete(requestController);
	}
}

document.querySelectorAll('select[data-fls-select][data-fls-select-countries-auto]').forEach((select) => {
	let hasUserInteracted = false;
	const markUserInteraction = () => {
		hasUserInteracted = true;
	};

	setupCountryAccessibility(select, eventOptions);
	populateCountries(select);
	select.addEventListener('change', markUserInteraction, eventOptions);
	select.form?.addEventListener('submit', markUserInteraction, eventOptions);
	select.form?.addEventListener('reset', () => {
		markUserInteraction();
		queueMicrotask(() => {
			if (select.closest('.select')) {
				window.flsSelect?.selectBuild(select);
			}
		});
	}, eventOptions);

	document.addEventListener('selectCallback', (event) => {
		if (event.detail.select === select) {
			markUserInteraction();
		}
	}, eventOptions);

	document.addEventListener('input', (event) => {
		if (event.target === select.closest('.select')?.querySelector('.select__input')) {
			markUserInteraction();
		}
	}, eventOptions);

	document.addEventListener('keydown', (event) => {
		if (['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key) && event.target === select.closest('.select')?.querySelector('.select__input')) {
			markUserInteraction();
		}
	}, { ...eventOptions, capture: true });

	if (!select.value && !select.disabled) {
		void detectInitialCountry(select, () => hasUserInteracted);
	}
});

if (import.meta.hot) {
	import.meta.hot.dispose(() => {
		eventController.abort();
		pendingRequests.forEach((controller) => controller.abort());
	});
}
