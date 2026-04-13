# hookah-web

Фронтенд проекта для управления кальянной. На старте репозиторий задает типизированный UI-каркас под каталог табака, учет остатков и оформление заказов.

## Технологии

- Vue 3
- Composition API
- TypeScript
- Vue Router
- Pinia
- Vite
- Vitest
- Playwright
- ESLint
- Prettier

## Архитектурная идея

Приложение строится как SPA для сотрудников заведения. На первом этапе в интерфейсе закладываются три основных рабочих контура:

- обзор смены и состояния системы;
- учет табака и складских остатков;
- создание и сопровождение заказов.

Контрактом между frontend и backend считается HTTP API. URL для API на локальной машине задается через `VITE_API_BASE_URL`.

## Команды

```bash
npm install
npm run dev
npm run build
npm run check
npm run test:e2e
```

## Docker

Собрать и запустить только frontend:

```bash
docker build -t hookah-web .
docker run --rm -p 8080:80 hookah-web
```

Если нужен явный адрес backend при сборке:

```bash
docker build --build-arg VITE_API_BASE_URL=http://localhost:3000/api/v1 -t hookah-web .
```

Для совместного запуска с API и PostgreSQL используйте корневой `compose.yaml` в главном репозитории.

Для первого запуска e2e-тестов потребуется установить браузеры:

```bash
npx playwright install
```

## Структура

- `src/views` — экраны приложения.
- `src/stores` — Pinia stores с доменным состоянием.
- `src/types` — доменные типы UI-слоя.
- `e2e` — end-to-end проверки пользовательских сценариев.

## Ближайшие шаги

- Подключить авторизацию и роли.
- Добавить API-клиент с генерацией типов из OpenAPI.
- Перевести демо-данные дашборда на реальные ответы backend.
