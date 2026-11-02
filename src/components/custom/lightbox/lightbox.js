import GLightbox from 'glightbox';
import 'glightbox/dist/css/glightbox.min.css';
import './lightbox.scss';

export const lightbox = GLightbox({ selector: '[data-fls-lightbox] .glightbox', zoomable: false });
