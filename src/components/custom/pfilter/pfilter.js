// Підключення функціоналу "Чортоги Фрілансера"
// import { addTouchAttr, addLoadedAttr, isMobile, FLS } from "@js/common/functions.js"

import "./pfilter.scss"

const filters = document.querySelectorAll('.pfilter');

filters.forEach((filterElement) => {
	const mainButton = filterElement.querySelector('.pfilter__button');

	if (!mainButton) {
		return;
	}

	mainButton.addEventListener('click', () => {
		filterElement.classList.toggle('_open');
	});

	const buttonText = mainButton.querySelector('span');
	const selectionInfo = filterElement.querySelector('.header-pfilter__info');

	const updateSelectedCount = () => {
		if (filterElement.dataset.pfilterType !== 'chk' || !selectionInfo) {
			return;
		}

		const selectedCount = filterElement.querySelectorAll('input[type="checkbox"]:checked').length;

		selectionInfo.textContent = `${selectedCount} selected`;
	};

	const updateButtonText = () => {
		if (!buttonText) {
			return;
		}

		const selectedOption = filterElement.querySelector('input[type="radio"]:checked');

		if (!selectedOption) {
			return;
		}

		const selectedOptionContainer = selectedOption.closest('.options__item');

		if (!selectedOptionContainer) {
			return;
		}

		const selectedOptionText = selectedOptionContainer.querySelector('.options__text');

		if (!selectedOptionText || !selectedOptionText.textContent) {
			return;
		}

		const selectedText = selectedOptionText.textContent.trim();

		if (!selectedText) {
			return;
		}

		buttonText.textContent = selectedText.replace(/\s+/g, ' ');
	};

	filterElement.addEventListener('change', (event) => {
		const changedInput = event.target;

		if (!(changedInput instanceof HTMLInputElement)) {
			return;
		}

		if (changedInput.type === 'radio') {
			updateButtonText();
		}

		if (changedInput.type === 'checkbox') {
			updateSelectedCount();
		}
	});

	filterElement.addEventListener('reset', () => {
		// Read checked states on the next frame, after the native reset completes.
		requestAnimationFrame(() => {
			updateSelectedCount();
		});
	});

	updateButtonText();
	updateSelectedCount();
});

if (filters.length > 0) {
	document.addEventListener('click', (event) => {
		const clickedTarget = event.target;

		if (!(clickedTarget instanceof Node)) {
			return;
		}

		filters.forEach((filterElement) => {
			if (!filterElement.contains(clickedTarget)) {
				filterElement.classList.remove('_open');
			}
		});
	});
}
