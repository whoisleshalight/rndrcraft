// Keep the existing select markup, search and slide transitions.
export function setupCountryAccessibility(originalSelect, eventOptions) {
	let activeOption = null;
	let shouldRestoreFocus = false;
	let pendingSelection = null;
	let shouldCloseAfterOpening = false;

	function getWrapper() {
		return originalSelect.closest('.select');
	}

	function clearActiveOption() {
		activeOption?.classList.remove('--select-selected');
		activeOption = null;
		pendingSelection = null;
		getWrapper()?.querySelector('.select__input')?.removeAttribute('aria-activedescendant');
	}

	function updateAccessibility() {
		const wrapper = getWrapper();
		const input = wrapper?.querySelector('.select__input');
		const options = wrapper?.querySelector('.select__options');

		if (!input || !options) {
			return;
		}

		const controlId = wrapper.id || `country-${originalSelect.dataset.flsSelectId}`;
		const label = document.querySelector(`label[for="${CSS.escape(controlId)}"]`);
		options.id = `${controlId}-options`;
		options.setAttribute('role', 'listbox');
		input.setAttribute('role', 'combobox');
		input.setAttribute('aria-autocomplete', 'list');
		input.setAttribute('aria-haspopup', 'listbox');
		input.setAttribute('aria-controls', options.id);
		input.setAttribute('aria-expanded', String(wrapper.classList.contains('--select-open')));
		input.setAttribute('aria-required', String(originalSelect.required));
		input.disabled = originalSelect.disabled;
		['aria-invalid', 'aria-describedby'].forEach((attribute) => {
			if (originalSelect.hasAttribute(attribute)) {
				input.setAttribute(attribute, originalSelect.getAttribute(attribute));
			} else {
				input.removeAttribute(attribute);
			}
		});

		if (label) {
			label.id ||= `${controlId}-label`;
			input.setAttribute('aria-labelledby', label.id);
			options.setAttribute('aria-labelledby', label.id);
		}

		options.querySelectorAll('.select__option').forEach((option, index) => {
			const isSelected = option.dataset.flsSelectValue === originalSelect.value;
			option.id = `${controlId}-option-${index}`;
			option.tabIndex = -1;
			option.setAttribute('role', 'option');
			option.setAttribute('aria-selected', String(isSelected));
			option.hidden = isSelected && !originalSelect.hasAttribute('data-fls-select-show-selected');
		});

		clearActiveOption();
	}

	document.addEventListener('slideDownDone', (event) => {
		const wrapper = getWrapper();

		if (event.detail.target !== wrapper?.querySelector('.select__options')) {
			return;
		}

		if (shouldCloseAfterOpening) {
			shouldCloseAfterOpening = false;
			window.flsSelect.selectsСlose(wrapper.parentElement);
		} else if (pendingSelection) {
			const option = pendingSelection;
			pendingSelection = null;
			shouldRestoreFocus = true;
			window.flsSelect.optionAction(wrapper, originalSelect, option);
		}
	}, eventOptions);

	document.addEventListener('selectBuilt', (event) => {
		if (event.target === originalSelect) {
			updateAccessibility();
		}
	}, eventOptions);

	document.addEventListener('selectCallback', (event) => {
		if (event.detail.select !== originalSelect) {
			return;
		}

		updateAccessibility();

		if (shouldRestoreFocus) {
			getWrapper()?.querySelector('.select__input')?.focus({ preventScroll: true });
			shouldRestoreFocus = false;
		}
	}, eventOptions);

	// Capture keys before the shared select's delegated Escape handler.
	document.addEventListener('keydown', (event) => {
		const wrapper = getWrapper();
		const input = wrapper?.querySelector('.select__input');

		if (event.target !== input || !window.flsSelect || originalSelect.disabled) {
			return;
		}

		const isOpen = wrapper.classList.contains('--select-open');

		if (event.key === 'Tab' || event.key === 'Escape') {
			event.stopPropagation();
			pendingSelection = null;
			if (isOpen) {
				if (wrapper.querySelector('.select__options').classList.contains('--slide')) {
					shouldCloseAfterOpening = true;
				} else {
					window.flsSelect.selectsСlose(wrapper.parentElement);
				}
			}
			clearActiveOption();
			return;
		}

		if (!['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		shouldCloseAfterOpening = false;

		if (event.key === 'Enter') {
			if (isOpen && activeOption && !activeOption.hidden) {
				if (wrapper.querySelector('.select__options').classList.contains('--slide')) {
					pendingSelection = activeOption;
				} else {
					shouldRestoreFocus = true;
					window.flsSelect.optionAction(wrapper, originalSelect, activeOption);
				}
			}
			return;
		}

		if (!isOpen) {
			window.flsSelect.selectAction(wrapper);
		}

		const visibleOptions = Array.from(wrapper.querySelectorAll('.select__option')).filter((option) => !option.hidden);
		const currentIndex = visibleOptions.indexOf(activeOption);
		let nextIndex = currentIndex + (event.key === 'ArrowDown' ? 1 : -1);

		if (currentIndex < 0) {
			nextIndex = event.key === 'ArrowDown' ? 0 : visibleOptions.length - 1;
		}

		clearActiveOption();
		activeOption = visibleOptions[Math.max(0, Math.min(nextIndex, visibleOptions.length - 1))] || null;

		if (activeOption) {
			activeOption.classList.add('--select-selected');
			input.setAttribute('aria-activedescendant', activeOption.id);
			activeOption.scrollIntoView({ block: 'nearest' });
		}
	}, { ...eventOptions, capture: true });

	document.addEventListener('pointerdown', (event) => {
		if (getWrapper()?.querySelector('.select__options')?.contains(event.target)) {
			shouldRestoreFocus = true;
		}
	}, eventOptions);

	document.addEventListener('input', (event) => {
		if (event.target === getWrapper()?.querySelector('.select__input')) {
			clearActiveOption();
		}
	}, eventOptions);

	updateAccessibility();
}
