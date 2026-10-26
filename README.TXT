RNDRCRAFT — верстка на «Чортогах Фрілансера» 4.0 / Vite

Запуск: npm run dev
Збірка: npm run build
Перегляд збірки: npm run preview

Сторінки:
  index.html / home.html — головна
  all_mockups.html — усі мокапи
  devices.html — пристрої
  collections.html — колекції
  collections-single.html — окрема колекція
  product-single.html — продукт

Структура src:
  components/templates/main — загальний шаблон сторінки
  components/layout — шапка, меню та підвал
  components/pages — компонування кожної сторінки
  components/custom — секції, картка продукту, пошук, підписка,
                      мобільні фільтри, слайдер та галерея
  components/custom/icon — SVG-іконки через CSS mask / currentColor
  assets/img — зображення й SVG
  assets/fonts — Safiro Regular, Medium, SemiBold
  styles/settings.scss — кольори, типографіка та брейкпоінти
  styles/style.scss — підключення стилів компонентів у вихідному порядку
  js/app.js — загальні обробники інтерфейсу

HTML використовує include/template нового шаблону замість @@include.
Меню, селекти, адаптивне переміщення блоків, рядок, що рухається,
та стан шапки при прокручуванні працюють через модулі версії 4.0
і атрибути data-fls-*. Власні модулі також підключаються через data-fls-*.
Стилі підключено централізовано, щоб зберегти вихідний каскад.
Картки каталогу мають спільний HTML-компонент із параметрами locals.

Іконочний шрифт вилучено, його генерацію вимкнено у template.config.js.
Форми залишаються демонстраційною версткою без відправлення на сервер.
PHP та WordPress не змінювалися.
