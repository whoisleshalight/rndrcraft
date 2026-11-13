import './webpreloader.scss';

function initializeWebpreloader() {
	const preloaderElement = document.querySelector('[data-fls-webpreloader]');

	if (preloaderElement === null) {
		return;
	}

	const preloaderWrapperElement = preloaderElement.querySelector('.webpreloader__wrapper');

	if (preloaderWrapperElement === null) {
		return;
	}

	const progressBarElement = preloaderElement.querySelector('[role="progressbar"]');

	if (progressBarElement === null) {
		return;
	}

	const progressFillElement = progressBarElement.querySelector('span');

	if (progressFillElement === null) {
		return;
	}

	const htmlElement = document.documentElement;
	const pageWrapperElement = document.querySelector('.wrapper');
	const eventAbortController = new AbortController();
	const reducedMotionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
	const loadingImages = [];

	let shouldRestorePageInteraction = false;

	if (pageWrapperElement !== null && pageWrapperElement.inert === false) {
		shouldRestorePageInteraction = true;
		pageWrapperElement.inert = true;
	}

	// Lazy images must remain lazy and cannot hold the preloader open.
	for (const imageElement of document.images) {
		if (imageElement.loading === 'lazy') {
			continue;
		}

		let imageSource = imageElement.currentSrc;

		if (imageSource === '') {
			imageSource = imageElement.getAttribute('src');
		}

		if (imageSource === null || imageSource === '') {
			continue;
		}

		loadingImages.push(imageElement);
	}

	// Page load and font readiness are tracked alongside the images.
	const totalResourceCount = loadingImages.length + 2;
	const progressSmoothingDurationMilliseconds = 240;
	const maximumProgressPerSecond = 70;
	const progressCompletionDurationMilliseconds = 200;

	let completedResourceCount = 0;
	let isPageLoaded = false;
	let areFontsReady = false;
	let isFinishing = false;
	let isDisposed = false;
	let currentProgressPercentage = 0;
	let targetProgressPercentage = 0;
	let previousFrameTimestamp = 0;
	let progressCompletionStartTimestamp = 0;
	let progressCompletionStartPercentage = 0;
	let progressAnimationFrameId = 0;
	let exitAnimation = null;

	htmlElement.setAttribute('data-fls-webpreloader-loading', '');
	htmlElement.setAttribute('data-fls-preloader-loading', '');

	function renderProgress() {
		const progressScale = currentProgressPercentage / 100;
		const accessibleProgressPercentage = Math.floor(currentProgressPercentage);

		progressFillElement.style.transform = `scaleX(${progressScale})`;
		progressBarElement.setAttribute('aria-valuenow', String(accessibleProgressPercentage));
	}

	function disposePreloader() {
		if (isDisposed) {
			return;
		}

		isDisposed = true;
		eventAbortController.abort();
		cancelAnimationFrame(progressAnimationFrameId);

		if (exitAnimation !== null) {
			exitAnimation.onfinish = null;
			exitAnimation.cancel();
		}

		htmlElement.removeAttribute('data-fls-webpreloader-loading');
		htmlElement.removeAttribute('data-fls-preloader-loading');
		htmlElement.setAttribute('data-fls-preloader-loaded', '');
		htmlElement.setAttribute('data-fls-loaded', '');

		if (pageWrapperElement !== null && shouldRestorePageInteraction) {
			pageWrapperElement.inert = false;
		}

		preloaderElement.remove();
	}

	function slidePreloaderUp() {
		if (reducedMotionMediaQuery.matches) {
			disposePreloader();
			return;
		}

		preloaderElement.setAttribute('data-fls-webpreloader-closing', '');

		exitAnimation = preloaderWrapperElement.animate(
			[
				{
					transform: 'translateY(0)',
				},
				{
					transform: 'translateY(-100%)',
				},
			],
			{
				duration: 850,
				easing: 'cubic-bezier(0.76, 0, 0.24, 1)',
				fill: 'forwards',
			},
		);

		exitAnimation.onfinish = disposePreloader;
	}

	function animateProgress(currentFrameTimestamp) {
		if (isFinishing) {
			// Once loading is complete, finish within a fixed duration instead of easing indefinitely.
			const elapsedCompletionTime = currentFrameTimestamp - progressCompletionStartTimestamp;
			const nonNegativeCompletionTime = Math.max(elapsedCompletionTime, 0);
			const completionRatio = Math.min(nonNegativeCompletionTime / progressCompletionDurationMilliseconds, 1);
			const easedCompletionRatio = 1 - Math.pow(1 - completionRatio, 3);
			const remainingProgressToComplete = 100 - progressCompletionStartPercentage;

			currentProgressPercentage = progressCompletionStartPercentage + remainingProgressToComplete * easedCompletionRatio;
			renderProgress();

			if (completionRatio < 1) {
				progressAnimationFrameId = requestAnimationFrame(animateProgress);
				return;
			}

			progressAnimationFrameId = 0;
			slidePreloaderUp();
			return;
		}

		// Follow the latest target without restarting the animation for each resource.
		const elapsedFrameTime = currentFrameTimestamp - previousFrameTimestamp;
		const nonNegativeFrameDuration = Math.max(elapsedFrameTime, 0);
		const frameDurationMilliseconds = Math.min(nonNegativeFrameDuration, 64);
		const frameDurationSeconds = frameDurationMilliseconds / 1000;
		const smoothingExponent = -frameDurationMilliseconds / progressSmoothingDurationMilliseconds;
		const smoothingFactor = 1 - Math.exp(smoothingExponent);
		const remainingProgressPercentage = targetProgressPercentage - currentProgressPercentage;
		const smoothedProgressStep = remainingProgressPercentage * smoothingFactor;
		const maximumProgressStep = maximumProgressPerSecond * frameDurationSeconds;
		const progressStep = Math.min(smoothedProgressStep, maximumProgressStep);

		previousFrameTimestamp = currentFrameTimestamp;
		currentProgressPercentage = currentProgressPercentage + progressStep;

		const remainingProgressAfterStep = targetProgressPercentage - currentProgressPercentage;

		if (remainingProgressAfterStep < 0.1) {
			currentProgressPercentage = targetProgressPercentage;
		}

		renderProgress();

		if (currentProgressPercentage < targetProgressPercentage) {
			progressAnimationFrameId = requestAnimationFrame(animateProgress);
			return;
		}

		progressAnimationFrameId = 0;
	}

	function updateProgress() {
		if (isDisposed || isFinishing) {
			return;
		}

		if (isPageLoaded && areFontsReady) {
			isFinishing = true;
			targetProgressPercentage = 100;
			progressCompletionStartTimestamp = performance.now();
			progressCompletionStartPercentage = currentProgressPercentage;
		} else {
			// The browser exposes resource completion, not the total page size in bytes.
			const completedResourceRatio = completedResourceCount / totalResourceCount;
			const loadedResourcePercentage = completedResourceRatio * 100;

			targetProgressPercentage = Math.min(loadedResourcePercentage, 95);
		}

		if (reducedMotionMediaQuery.matches) {
			cancelAnimationFrame(progressAnimationFrameId);
			progressAnimationFrameId = 0;
			currentProgressPercentage = targetProgressPercentage;

			renderProgress();

			if (isFinishing) {
				disposePreloader();
			}

			return;
		}

		if (progressAnimationFrameId === 0) {
			previousFrameTimestamp = performance.now();
			progressAnimationFrameId = requestAnimationFrame(animateProgress);
		}
	}

	function handlePageLoad() {
		isPageLoaded = true;
		completedResourceCount = completedResourceCount + 1;

		updateProgress();
	}

	function handleFontsReady() {
		areFontsReady = true;
		completedResourceCount = completedResourceCount + 1;

		updateProgress();
	}

	renderProgress();

	for (const imageElement of loadingImages) {
		if (imageElement.complete) {
			completedResourceCount = completedResourceCount + 1;
			continue;
		}

		function handleImageSettled() {
			imageElement.removeEventListener('load', handleImageSettled);
			imageElement.removeEventListener('error', handleImageSettled);
			completedResourceCount = completedResourceCount + 1;

			updateProgress();
		}

		imageElement.addEventListener('load', handleImageSettled, {
			signal: eventAbortController.signal,
		});

		imageElement.addEventListener('error', handleImageSettled, {
			signal: eventAbortController.signal,
		});
	}

	document.fonts.ready.then(handleFontsReady);

	if (document.readyState === 'complete') {
		handlePageLoad();
	} else {
		window.addEventListener('load', handlePageLoad, {
			once: true,
			signal: eventAbortController.signal,
		});

		updateProgress();
	}

	window.addEventListener('pagehide', disposePreloader, {
		once: true,
		signal: eventAbortController.signal,
	});

	const hotModule = import.meta.hot;

	if (hotModule) {
		hotModule.dispose(disposePreloader);
	}
}

initializeWebpreloader();
