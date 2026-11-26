# Catalog loader

Лоадер підключений на `all_mockups.html`, `collections.html`, `devices.html` і в обох вкладках `search.html`.

Для показу додайте клас `--loading` до потрібної обгортки `[data-fls-catalogloader]`:

```js
const catalogElement = document.querySelector('[data-fls-catalogloader]');

catalogElement?.classList.add('--loading');

// Після оновлення товарів або завершення обробки помилки:
catalogElement?.classList.remove('--loading');
```

На сторінці пошуку кожна вкладка має власну обгортку, тому вибирайте її в межах потрібної вкладки.

Замінюйте товари всередині `.catalog-loader__content`, зберігаючи саму обгортку контенту та сусідній `.catalog-loader__overlay`. Клас `--loading` показує перекриття та блокує взаємодію мишею з товарами й кнопкою `Load more`. Фільтри залишаються доступними. `catalogloader.js` містить лише імпорт SCSS для наявного механізму підключення компонентів.

Компонент не запускає завантаження самостійно. Додавання й зняття класу підключає WP-розробник у своїй логіці фільтрації та сортування. Для `prefers-reduced-motion` обертання вимкнене.
