import './webpreloader.scss';

function initializeLoadingProgress() {
	const preloaderElement = document.querySelector('[data-fls-webpreloader]');
	const progressBarElement = preloaderElement?.querySelector('[role="progressbar"]');
	const progressFillElement = progressBarElement?.querySelector('.webpreloader__progressFill');

	if (!progressBarElement || !progressFillElement) {
		return;
	}

	const htmlElement = document.documentElement;
	const eventAbortController = new AbortController();
	const loadingImages = Array.from(document.images).filter((imageElement) => {
		const hasSource = Boolean(imageElement.currentSrc || imageElement.getAttribute('src'));

		return imageElement.loading !== 'lazy' && hasSource;
	});
	// Track eager images, font readiness and the window load event, rather than bytes.
	const totalResourceCount = loadingImages.length + 2;
	let completedResourceCount = 0;
	let isDisposed = false;

	function renderProgress(percentage) {
		progressFillElement.style.transform = `scaleX(${percentage / 100})`;
		progressBarElement.setAttribute('aria-valuenow', String(Math.floor(percentage)));
	}

	function disposeProgress() {
		isDisposed = true;
		eventAbortController.abort();
		loadedAttributeObserver.disconnect();
	}

	function handleLoadedAttribute() {
		if (!htmlElement.hasAttribute('data-fls-loaded')) {
			return;
		}

		renderProgress(100);
		disposeProgress();
	}

	const loadedAttributeObserver = new MutationObserver(handleLoadedAttribute);

	if (htmlElement.hasAttribute('data-fls-loaded')) {
		handleLoadedAttribute();
		return;
	}

	loadedAttributeObserver.observe(htmlElement, {
		attributes: true,
		attributeFilter: ['data-fls-loaded'],
	});

	function handleResourceSettled() {
		if (isDisposed) {
			return;
		}

		completedResourceCount += 1;

		// Reserve the final step for addLoadedAttr() and its minimum loading duration.
		const progressPercentage = completedResourceCount / totalResourceCount * 95;

		renderProgress(progressPercentage);
	}

	for (const imageElement of loadingImages) {
		if (imageElement.complete) {
			handleResourceSettled();
			continue;
		}

		function handleImageSettled() {
			imageElement.removeEventListener('load', handleImageSettled);
			imageElement.removeEventListener('error', handleImageSettled);
			handleResourceSettled();
		}

		imageElement.addEventListener('load', handleImageSettled, {
			signal: eventAbortController.signal,
		});
		imageElement.addEventListener('error', handleImageSettled, {
			signal: eventAbortController.signal,
		});
	}

	document.fonts.ready.then(handleResourceSettled);

	if (document.readyState === 'complete') {
		handleResourceSettled();
	} else {
		window.addEventListener('load', handleResourceSettled, {
			once: true,
			signal: eventAbortController.signal,
		});
	}

	window.addEventListener('pagehide', disposeProgress, {
		once: true,
		signal: eventAbortController.signal,
	});

	if (import.meta.hot) {
		import.meta.hot.dispose(disposeProgress);
	}
}

initializeLoadingProgress();

