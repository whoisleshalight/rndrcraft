import "./searchbody.scss";

const searchPage = document.querySelector('[data-fls-searchbody]');
const mobilePanel = searchPage?.querySelector('.search-page__mobile-panel');

if (searchPage && mobilePanel) {
	const mobileMediaQuery = window.matchMedia('(max-width: 1279.98px)');
	const filters = Array.from(searchPage.querySelectorAll('.catalog__filter .pfilter')).map((filter) => {
		return { element: filter, desktopParent: filter.parentElement };
	});

	const updateFilterLayout = () => {
		const filterButton = searchPage.querySelector('.mobile-filter__btn');

		if (!mobileMediaQuery.matches && filterButton?.getAttribute('aria-expanded') === 'true') {
			searchPage.querySelector('.menu-mobile-filter__close-btn')?.click();
		}

		// Move the same controls so selections and label associations survive resizing.
		filters.forEach(({ element, desktopParent }) => {
			const target = mobileMediaQuery.matches ? mobilePanel : desktopParent;
			target?.append(element);
		});
	};

	updateFilterLayout();
	mobileMediaQuery.addEventListener('change', updateFilterLayout);
}
