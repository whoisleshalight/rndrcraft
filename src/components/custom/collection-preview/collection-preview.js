import Swiper from 'swiper';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

window.addEventListener('load', () => {
    document.querySelectorAll('[data-fls-collection-preview]').forEach((element) => {
        new Swiper(element, {
            modules: [Navigation, Pagination, Autoplay],
            observer: true,
            observeParents: true,
            slidesPerView: 1,
            spaceBetween: 0,
            speed: 800,
            loop: true,
            autoplay: { delay: 8000, disableOnInteraction: false },
            pagination: { el: '.collection-preview-pagination', clickable: true },
            navigation: {
                prevEl: '.collection-preview-button-prev',
                nextEl: '.collection-preview-button-next',
            },
            breakpoints: {
                640: { slidesPerView: 1, autoHeight: true },
                768: { slidesPerView: 2 },
            },
        });
    });
});
