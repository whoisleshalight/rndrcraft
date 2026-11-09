import './scroll.scss';

export function headerScroll() {
	const header = document.querySelector('[data-fls-header-scroll]');

	if (!header) {
		return;
	}

	const shouldShowHeader = header.hasAttribute('data-fls-header-scroll-show');
	const headerShowDelay = Number(header.dataset.flsHeaderScrollShow || 500);
	const scrollStartPoint = Number(header.dataset.flsHeaderScroll || 1);
	let previousScrollTop = window.scrollY;
	let headerShowTimeout;

	function updateHeaderState() {
		const scrollTop = window.scrollY;
		const isScrolled = scrollTop >= scrollStartPoint;

		clearTimeout(headerShowTimeout);
		header.classList.toggle('--header-scroll', isScrolled);

		if (shouldShowHeader) {
			if (isScrolled) {
				header.classList.toggle('--header-show', scrollTop <= previousScrollTop);
				headerShowTimeout = setTimeout(() => {
					header.classList.add('--header-show');
				}, headerShowDelay);
			} else {
				header.classList.remove('--header-show');
			}
		}

		previousScrollTop = Math.max(scrollTop, 0);
	}

	document.addEventListener('scroll', updateHeaderState, { passive: true });
	// Browsers can restore the scroll position without another scroll event.
	window.addEventListener('pageshow', updateHeaderState);
	updateHeaderState();
}

if (document.querySelector('[data-fls-header-scroll]')) {
	if (document.readyState === 'complete') {
		headerScroll();
	} else {
		window.addEventListener('load', headerScroll, { once: true });
	}
}
