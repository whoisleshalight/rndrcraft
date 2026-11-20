# Billing Details — інтеграція WordPress / WooCommerce

Передати цей документ разом зі збіркою. Вихідний файл: `src/files/billing-integration.md`; після build: `dist/files/billing-integration.md`. Сторінка для перегляду: `billing.html`.

Верстка містить готові панелі, select, preview-валідацію та три модалки. WP-розробник підключає профіль, серверну валідацію, збереження адреси, gateway та повідомлення результату. Remove / Make default уже зв’язані з підтвердженням: переданий WooCommerce action URL виконається тільки після нього. Власних backend endpoints у верстці немає.

## 1. Файли та підключення

| Призначення | Вихідний компонент |
| --- | --- |
| Сторінка, header/footer, пошук | `src/billing.html`, `src/components/pages/billing/` |
| Billing, Company, модалка виходу | `src/components/custom/billingsection/billingsection.html`, `.js`, `.scss` |
| Картки, додавання, платіжні модалки | `src/components/custom/paymentmethods/paymentmethods.html`, `.js`, `.scss` |
| Спільні поля й форма | `src/components/custom/accountfield/`, `accountform/` |
| Select і валідація | `src/components/forms/select/`, `src/components/forms/_functions.js` |
| Країни | `select/plugins/countries.js`, `select/data/countries-en.json`, `select/helpers/country-accessibility.js` |
| Навігація кабінету | `src/components/custom/accountsidebar/` |

Підключити зібрані JS/CSS та assets зі збереженням залежностей. У WP Vite вже не додає модулі за `data-fls-*`: потрібні реальні enqueue. JS має виконатися після появи DOM; модуль select потрібно завантажити до `window.load`, на якому він ініціалізується. Не відкладати його lazy loading за цю подію.

Контролери ініціалізуються один раз на наявному DOM. Заміна всього компонента через AJAX сама не ініціалізує нові форми й модалки. Краще оновлювати список карток та notices усередині наявного payment-компонента: його кліки делеговані й працюють для нових карток.

Зберегти класи, `data-*`, IDs, label/ARIA-зв’язки та дві окремі форми. Не вкладати gateway-форму в іншу форму. Усі IDs мають бути унікальними, кожна модалка — в одному екземплярі. Зберегти фон кабінету, спільні стилі та готове мобільне меню; замінити account URLs і активний пункт Billing Details. Logout підключити до штатного URL виходу.

## 2. Повний перелік прихованих станів

| Стан | Де / як відкривається | Що підключає WP |
| --- | --- | --- |
| Company-поля | Вибір Company | Дані, VAT-плагін, серверні правила |
| Помилки полів | Preview blur/submit, `[data-fls-form-error]` | Реальна валідація й текст помилки |
| Billing success/error | `[data-billing-notices]`, спочатку `hidden` | Результат реального збереження |
| Порожній список карток | `[data-payment-empty]` | Серверний empty state |
| Збережені методи | `[data-payment-list]`, спочатку `hidden` | Токени поточного користувача |
| Default / Make default | Бейдж / дія картки | Реальний `is_default`, дозволені дії |
| Панель додавання | Add payment method | Hosted fields і submit gateway |
| Remove confirmation | `[data-payment-remove-dialog]` | Готовий Woo URL або AJAX-адаптер |
| Make default confirmation | `[data-payment-default-dialog]` | Готовий Woo URL або AJAX-адаптер |
| Leave without saving | Змінений billing + посилання | Зберегти guard або підключити повний власний |
| Reload / вихід із вкладки | `beforeunload` | Стандартне попередження браузера |
| Payment success/error/processing | Після справжньої платіжної дії | Notices і стан запиту gateway |

Add payment method — розгортана панель, не четверта модалка. Окремої success-модалки немає: успіх показується повідомленням.

## 3. Billing-форма

Стандартні `name`: `billing_first_name`, `billing_last_name`, `billing_company`, `billing_email`, `billing_phone`, `billing_country`, `billing_address_1`, `billing_address_2`, `billing_city`, `billing_state`, `billing_postcode`. Замінити Alex / Morgan / адресу / email на профіль користувача; після невдалого submit повернути введені значення.

Для стандартного збереження використовувати billing edit-address flow. Усередині форми потрібні nonce та action:

```php
<?php wp_nonce_field( 'woocommerce-edit_address', 'woocommerce-edit-address-nonce' ); ?>
<input type="hidden" name="action" value="edit_address">
```

Кнопка вже має `name="save_address"`. Route/action/hooks звірити зі встановленою версією та [офіційним form-edit-address.php](https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/templates/myaccount/form-edit-address.php). Override робити в дочірній темі, враховуючи версію шаблону.

Перед production прибрати `data-ui-preview-form` з billing-форми. Він вмикає `preventDefault()` і лише демонструє помилки: навіть заповнена preview-форма не зберігає дані. Після видалення атрибута preview-валідація не діє — підключити Woo-обробку й показ її помилок. Не покладатися на browser validation прихованого native select: штатний Woo-шаблон використовує `novalidate`; забезпечити повідомлення та фокус на видимому контролі.

Required, label, формат індексу/телефону, тип і доступність `billing_state` визначає країна та налаштування магазину. Текст «optional» і текстовий state у макеті не задають правил WooCommerce.

### Company / Individual

`billing_customer_type` (`individual` / `company`) і `billing_tax_id` — додаткові поля. Зіставити їх із плагіном реквізитів/VAT, валідувати й зберігати явно. При Individual `[data-billing-company]` має `disabled`, панель — `inert`/`aria-hidden`; ці поля не надсилаються у FormData. Узгодити очищення або збереження попередніх реквізитів при Company → Individual. Початковий checked має відповідати профілю.

Якщо Company-блок прибирається, адаптувати `billingsection.js`: відсутність form/company-fieldset/company-panel зараз зупиняє весь billing-контролер, включно з guard.

### Повідомлення

- Успіх: `[data-billing-notices]`, зняти `hidden`, додати `billingsection__feedback--success`, `role="status"`.
- Помилка: цей контейнер із `billingsection__feedback--error`; для оголошення помилки можна використати `role="alert"`.
- Submit і закриття панелі не є успіхом. На помилці не скидати введене.
- `[data-fls-form-error]` — абсолютне позиціонування у відносно позиціонованій обгортці. Зберегти `--form-error`, `aria-invalid`, `aria-describedby`; помилки не зсувають поля.
- Notices Woo можна оформити тут або окремим штатним блоком. Не вкладати готовий `<ul>` notices у поточний `<p>` і не дублювати повідомлення.

## 4. Country select: один механізм

### Компонент верстки

`name="billing_country"`, значення — ISO alpha-2. `data-fls-select-countries-auto` підключає локальний англомовний список 249 країн/територій та визначення початкової країни через [Country.is](https://country.is/). Таймаут — 8 секунд; при помилці залишається `Select your country`, список працює. Збережене значення, ручний вибір і розпочатий пошук не перезаписуються. GPS і мова браузера не використовуються. Автовибір стає початковим значенням reset і не створює незбережену зміну.

Плагін ЗАМІНЮЄ опції повним локальним списком. При обмеженні країн магазину прибрати `data-fls-select-countries-auto` та `data-fls-select-countries-locale`, вивести дозволені країни сервером. Backend завжди перевіряє дозволену країну.

- Після ініціалізації `id="billing_country"` переноситься на wrapper `.select`. Native поле шукати через `select[name="billing_country"]`; `#billing_country` поверне wrapper.
- Ручний UI-вибір викликає `selectCallback` на `document`, поле — `event.detail.select`. Native `change` сам не створюється.
- Програмна зміна: встановити native `.value`, викликати `window.flsSelect.selectBuild(select)` для оновлення UI.
- IP-автовибір викликає bubbling-подію `selectCountryInitialized` на native select. Вона оновлює baseline guard; не викликати її для ручних змін.
- Якщо Woo потребує native/jQuery `change`, підключити адаптер для ручного й IP-вибору. Потрібен захист від рекурсії: native `change` також викликає `selectCallback` через компонент.

### Select WooCommerce

Якщо країною керує WooCommerce, вивести його країни/state, прибрати `data-fls-select` та всі пов’язані атрибути, включно з auto/locale. Не запускати одночасно FLS і selectWoo/Select2. Зберегти оформлення, label та коректну початкову країну; геолокацією має керувати один механізм.

## 5. Список платіжних методів

Дані отримувати для поточного користувача, наприклад через `wc_get_customer_saved_methods_list( get_current_user_id() )`; орієнтир — [payment-methods.php](https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/templates/myaccount/payment-methods.php).

`<template data-payment-card-template>` — зразок структури; він сам не створює картки. Сервер виводить `<li class="paymentMethods__card">` у `[data-payment-list]`. Показувати реальні бренд/назву, masked last4 і expiry, якщо він є. Visa 4242 / 08/2028 — демонстрація; для не-карткового токена не вигадувати expiry.

| Серверний стан | Empty | List | Default |
| --- | --- | --- | --- |
| Методів немає | Видимий | `hidden`, порожній | Немає |
| Методи є | `hidden` | Видимий | За реальним `is_default` |
| Останній метод успішно видалено | Видимий | `hidden`, порожній | Немає |
| Помилка запиту | Без змін | Зберегти підтверджений список | Без змін |

Для основного методу показати `[data-payment-default-badge]`, сховати Make default. Для решти — навпаки, якщо сервер дозволяє дію. Зберегти додаткові gateway actions, якщо вони є. Не змінювати список і Default до серверного успіху.

## 6. Remove / Make default — готова інтеграція підтвердження

### A. Штатні WooCommerce action links

Окремий JS-запит не потрібен. У серверному циклі методів замінити preview-кнопки на посилання:

```php
<?php if ( ! empty( $method['actions']['delete']['url'] ) ) : ?>
	<a class="paymentMethods__textButton"
		href="<?php echo esc_url( $method['actions']['delete']['url'] ); ?>"
		data-payment-action="remove">Remove</a>
<?php endif; ?>

<?php if ( ! empty( $method['actions']['default']['url'] ) ) : ?>
	<a class="paymentMethods__textButton"
		href="<?php echo esc_url( $method['actions']['default']['url'] ); ?>"
		data-payment-action="default">Make default</a>
<?php endif; ?>
```

`remove` — HTML action, `delete` — ключ дії Woo. URL вже містить nonce: брати його з Woo, не збирати вручну. Див. [wc-account-functions.php](https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/includes/wc-account-functions.php).

Можна залишити `<button type="button">`, передавши URL через `data-payment-action-url`. Дозволені HTTP(S) URL поточного origin. Для AJAX-контексту передати `data-payment-token-id` на картці `<li>` або самій дії. При звичайному переході додатковий ID не потрібен: він є у штатному URL.

Не припускати наявність `$method['id']`: для AJAX отримати ID зі справжнього Woo token-об’єкта на сервері й явно вивести атрибут. Не використовувати last4 або індекс картки як ID.

Готовий порядок:

1. Клік по `a` або `button[data-payment-action]` перехоплюється; Woo URL ще не виконується.
2. Запам’ятовується конкретна дія, URL, ID і trigger; відкривається потрібна модалка.
3. Cancel / Escape → `returnValue="cancel"`, без запиту, переходу й зміни списку.
4. Підтвердження → `returnValue="confirm"`; після анімації закриття відправляється `paymentMethodConfirm`.
5. Якщо подію не скасовано і URL валідний, JS переходить за ним. Реальну дію виконує WooCommerce.

Сервер перевіряє користувача, належність токена і nonce. Штатні дії Woo повертають на endpoint `payment-methods`: для об’єднаного Billing Details endpoint узгодити повернення та notices. Орієнтир — [WC_Form_Handler](https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/includes/class-wc-form-handler.php).

**Не прибирати `data-payment-action` із посилань: інакше підтвердження буде обійдено. Не виконувати запит на первинному кліку Remove / Make default або паралельно на confirm-кнопці.**

### B. AJAX-інтеграція плагіна

`paymentMethodConfirm` — bubbling/cancelable подія на `[data-fls-paymentmethods]` після підтвердженого закриття. Можна слухати на компоненті або `document`.

| `event.detail` | Значення |
| --- | --- |
| `action` | `remove` / `default` |
| `tokenId` | Рядок із `data-payment-token-id` або `null` |
| `actionUrl` | Нормалізований Woo URL поточного origin або `null` |
| `trigger` | Конкретний натиснутий DOM-елемент |

Адаптер має синхронно викликати `event.preventDefault()` ДО першого `await`, щоб скасувати штатний перехід, і використати реальний API встановленого плагіна. Сам `preventDefault()` дію не виконує. Довільного AJAX endpoint у верстці немає.

Під час запиту заблокувати повторні дії й показати processing. На успіху оновити серверний список, Default / Make default, empty state та notice. На помилці зберегти список, відновити кнопки й показати помилку. Billing-поля не скидати разом зі списком карток. Після видалення trigger-картки перевести фокус на наступну дію або Add payment method.

Preview-кнопки без URL/ID лише відкривають модалку й відправляють подію з `null`; реальних методів вони не змінюють. Не підключати одночасно AJAX на `paymentMethodConfirm` і окремий запит на `dialog.close`.

## 7. Три модалки

| Модалка | Selector | Підтвердження | Відмова |
| --- | --- | --- | --- |
| Видалення | `[data-payment-remove-dialog]` | `confirm`, подія з action `remove` | `cancel`, без дії |
| Основний метод | `[data-payment-default-dialog]` | `confirm`, подія з action `default` | `cancel`, без дії |
| Незбережені дані | `[data-billing-leave-dialog]` | `leave`, перехід за запам’ятованим посиланням | `stay`, лишитися |

Зберегти `<dialog>`, заголовки, label/description IDs, кнопки. Відкривати через `showModal()`, не ручний `open`: потрібні top layer, backdrop і блокування фону. Початковий фокус у payment-модалках — Cancel, у leave-модалці — Keep editing. Escape означає відмову. Клік по backdrop сам не закриває і не підтверджує дію.

Закриття payment-модалок чекає `paymentConfirmationExit`, leave-модалки — `billingLeaveExit`. Не прибирати ці CSS-анімації без зміни JS. При reduced motion закриття негайне. Після відмови фокус повертається на trigger, якщо він є. Не заміняти модалки на `window.confirm()` і не додавати друге підтвердження на ту саму дію.

## 8. Незбережені billing-дані

`data-billing-unsaved-guard` на `[data-billing-form]` вмикає порівняння FormData з початковими даними. Server defaults і hidden nonce мають бути в DOM до запуску JS; динамічна зміна named-службового поля також може виглядати як редагування.

- Зміна billing / customer type / країни вручну робить форму зміненою. Повернення всіх значень до початкових прибирає цей стан.
- Звичайне посилання в цій вкладці відкриває Leave without saving. Keep editing / Escape зберігають введене, Leave page переходить до запам’ятованого URL.
- Same-document anchors, download, модифіковані кліки, інші target, `mailto:` / `tel:` не перехоплюються.
- Reload / закриття вкладки можуть показати браузерний `beforeunload`; його вигляд/текст і умови показу визначає браузер.
- Прийнятий native submit billing-форми дозволяє перехід. Preview / AJAX `preventDefault()` не означає збереження.
- IP-автовибір оновлює початкову країну, зберігаючи інші незбережені редагування.

Межі реалізації: guard стосується лише billing-форми; незавершені hosted fields картки не відстежує. Programmatic navigation, Back і submit іншої форми не відкривають кастомну leave-модалку; при виході з документа може спрацювати браузерне попередження. Зокрема, підтверджений Woo payment action URL при зміненому billing може викликати браузерне попередження. Не вимикати захист автоматично: можна втратити адресу. AJAX-дія без переходу дозволяє зберегти billing на сторінці.

Для AJAX-збереження billing готового методу reset baseline немає: реалізувати оновлення baseline ПІСЛЯ серверного успіху або прибрати атрибут і підключити повний guard плагіна. Просто вимкнути його після першого успіху недостатньо: наступне редагування знову має захищатися. На помилці guard лишається активним. Для навігації без reload потрібна інтеграція роутера.

## 9. Add payment method

Зберегти `[data-payment-form]`, `[data-payment-panel]`, `[data-payment-toggle]`, `[data-payment-cancel]`, `aria-controls` і ID панелі. Add payment method перемикає expanded-клас, ARIA/inert і фокусує перше поле або iframe. Cancel / Escape закривають панель і повертають фокус.

Прибрати `data-ui-preview-form` із payment-форми. Замінити `[data-payment-provider-fields]` на штатні hosted fields/iframe gateway. У демонстраційних карткових полів навмисно немає `name`: не додавати їх для звичайного надсилання номера/CVC.

Inputmask працює лише в preview: групування номера, `MM / YY`, CVC 3–4 цифри. Перевіряє заповнення, не валідність картки. Після видалення preview-атрибута маски та preview-submit handler не ініціалізуються. Tokenization, додаткові перевірки, підтвердження провайдера й результат виконує gateway.

Для штатної add-payment форми зберегти потрібні gateway IDs/класи, payment method input, nonce, hidden `woocommerce_add_payment_method=1`, hooks і скрипти; орієнтир — [form-add-payment-method.php](https://github.com/woocommerce/woocommerce/blob/trunk/plugins/woocommerce/templates/myaccount/form-add-payment-method.php) встановленої версії. Має бути один form-елемент із потрібними атрибутами обох інтеграцій.

Перевірити ініціалізацію iframe у прихованій панелі й підтримку inline-додавання gateway. Якщо він працює лише на штатному endpoint, адаптувати flow й погодити вигляд цього переходу. Після помилки/reload знову розгорнути панель expanded-класом та ARIA/inert-станами, щоб поля й notice не залишилися прихованими. Production Cancel сам не очищає hosted fields і не скасовує запит — це завдання gateway-адаптера. Escape усередині cross-origin iframe може обробляти лише провайдер.

Якщо додавання не підтримується, сховати або не виводити add-кнопку й панель та пояснити доступність збереження на checkout. Remove / Make default і їхні модалки ініціалізуються незалежно від наявності add-форми, тому керування збереженими токенами працює й у цьому випадку.

Payment notices виводити біля Payment methods штатним блоком Woo/gateway; не підміняти їх текстом «Billing details saved». Після успіху додавання перечитати серверні токени. Не створювати фіктивну картку локально. Processing, повторний submit, network errors і повернення від провайдера має обробляти інтеграція.

## 10. Чекліст приймання WP-інтеграції

Перевірити вже на встановленому WooCommerce та реальному gateway:

- [ ] Реальний профіль, успішне збереження, повернення введеного при помилці.
- [ ] Обидва preview-атрибути прибрані; nonce/action/hooks підключені; немає вкладених форм.
- [ ] Company/Individual після reload; disabled-поля й попередні реквізити обробляються правильно.
- [ ] Країни/state/required відповідають магазину; один select enhancement.
- [ ] IP success/error/timeout, saved country, ручний вибір до відповіді API, пошук.
- [ ] Порожній список, одна/кілька карток, Default, недоступні дії.
- [ ] Remove і Make default: правильна картка, Cancel, Escape, confirm; немає дії до підтвердження.
- [ ] Останнє видалення показує empty state; зміна Default оновлює всі картки після серверного успіху.
- [ ] Link flow дає один перехід; AJAX скасовує подію до `await` і дає один запит.
- [ ] Прострочений nonce, чужий/видалений токен, network/gateway error не показуються як успіх.
- [ ] Додавання: панель, hosted fields, Cancel, помилка, успіх, повторний submit, повернення від gateway.
- [ ] Після помилки поля/notices видимі; billing не скидається платіжними діями.
- [ ] Незбережений billing: Keep editing/Escape/Leave, reload, Back, payment action і payment submit; без мовчазної втрати введеного.
- [ ] AJAX billing оновлює baseline лише після успіху; наступна зміна знову захищається.
- [ ] Клавіатура select, усі модалки, початковий і повернений фокус; видалений trigger не ламає фокус.
- [ ] Анімації/reduced motion не залишають dialog відкритим; backdrop не підтверджує дію.
- [ ] Mobile/desktop, довгі назви/notices, скролл select, стабільний фон при зміні висоти сторінки.
- [ ] Пошук/header/footer, мобільне меню та активний пункт збережені; немає подвійних notices/обробників.
- [ ] Production assets завантажуються; перевірені встановлені версії WooCommerce та gateway.

Посилання на офіційні вихідні файли вище ведуть на поточний `trunk`; при реалізації звіряти їх саме з версією плагіна на сайті.
