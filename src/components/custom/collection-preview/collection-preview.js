import './slider.scss';
import './collection-preview.scss';

import Swiper from 'swiper';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';

import { lightbox } from '../lightbox/lightbox.js';

window.addEventListener('load', () => {
    document.querySelectorAll('[data-fls-collection-preview]').forEach((element) => {
        const collectionPreviewSlider = new Swiper(element, {
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
            on: {
                autoplayTimeLeft(slider, _timeLeft, remainingProgress) {
                    const progress = Math.min(1, Math.max(0, 1 - remainingProgress));

                    slider.pagination.el.style.setProperty('--collection-preview-progress', progress);
                },
                autoplayStart(slider) {
                    slider.pagination.el.style.setProperty('--collection-preview-progress', 0);
                },
            },
            breakpoints: {
                640: { slidesPerView: 1, autoHeight: true },
                768: { slidesPerView: 2 },
            },
        });

        let shouldResumeAutoplay = false;

        lightbox.on('open', () => {
            shouldResumeAutoplay = collectionPreviewSlider.autoplay.running;
            collectionPreviewSlider.autoplay.stop();
        });

        lightbox.on('close', () => {
            if (shouldResumeAutoplay && !collectionPreviewSlider.destroyed) {
                collectionPreviewSlider.autoplay.start();
            }

            shouldResumeAutoplay = false;
        });
    });
});
