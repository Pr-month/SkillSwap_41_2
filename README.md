# SkillSwap — платформа для обмена навыками

**SkillSwap** — это веб-приложение, которое позволяет пользователям обмениваться навыками:
предлагать свои умения и находить тех, кто может научить чему-то новому.
Проект включает полноценный backend на NestJS, frontend на React + Redux Toolkit
и развертывание через Docker Compose.

## Оглавление

- [Стек технологий](#стек-технологий)
- [Архитектура проекта](#архитектура-проекта)
- [Функциональность](#функциональность)
- [Запуск проекта](#запуск-проекта)
  - [Требования](#требования)
  - [Локальный запуск (без Docker)](#локальный-запуск-без-docker)
  - [Запуск через Docker Compose](#запуск-через-docker-compose)
- [Переменные окружения](#переменные-окружения)
- [Скрипты и команды](#скрипты-и-команды)
- [Тестирование](#тестирование)
- [Структура проекта](#структура-проекта)
- [Лицензия](#лицензия)
- [Контакты](#контакты)

---

## Стек технологий

### Backend

- **NestJS 11** — фреймворк
- **TypeORM** — ORM
- **PostgreSQL** — база данных
- **Passport JWT** — аутентификация
- **Socket.io** — веб-сокеты (чат/уведомления)
- **Swagger** — документация API
- **Jest** — unit/e2e тесты

### Frontend

- **React 18** + **TypeScript**
- **Redux Toolkit** — управление состоянием
- **React Hook Form** + **Yup** — формы и валидация
- **Vite** — сборка
- **React Router DOM v7** — маршрутизация
- **Vitest + Testing Library** — unit-тесты
- **Cypress** — e2e тесты
- **Storybook** — компонентная песочница

### DevOps

- **Docker** + **Docker Compose**
- **Nginx** — reverse proxy (в production)
- **GitHub Pages** — деплой frontend

---

## Архитектура проекта

```.
├── backend/             # NestJS API + WebSockets
│ ├── src/               # Исходный код
│ ├── test/              # e2e тесты
│ └── Dockerfile
├── frontend/            # React SPA
│ ├── src/               # Исходный код
│ ├── cypress/           # e2e тесты
│ ├── public/            # Статика
│ └── Dockerfile
├── nginx/               # Конфигурация Nginx (продакшен)
├── docker-compose.yml   # Оркестрация всех сервисов
└── README.md
```

---

## Функциональность

### Реализовано

- Регистрация / вход (JWT access + refresh токены)
- OAuth2 через **Yandex** и **Google**
- Роли: **пользователь** и **администратор**
- CRUD навыков (skills)
- Поиск и фильтрация пользователей по навыкам/городам
- Личный кабинет с редактированием профиля
- Чат (WebSocket) между пользователями
- Загрузка аватарок
- Swagger документация API (`/api/docs`)

### В планах

- Система отзывов и рейтинга
- Уведомления (email + in-app)
- Модерация объявлений админом

---

## Запуск проекта

### Требования

- **Node.js** 18+ (20+ лучше)
- **npm** 9+
- **PostgreSQL** 14+ (если запускаете без Docker)
- **Docker** и **Docker Compose** (опционально, но рекомендуется)

---

### Локальный запуск (без Docker)

#### 1. Клонировать репозиторий

```bash
git clone https://github.com/Pr-month/SkillSwap_41_2.git
cd SkillSwap_41_2
```

#### 2. Настроить backend

```bash
cd backend
cp .env.example .env   # отредактируйте .env под вашу БД
npm install
npm run migration:run  # создание таблиц в БД
npm run seed:all       # заполнение тестовыми данными (опционально)
npm run start:dev
```

Ссылка API <http://localhost:3000>

Swagger UI: <http://localhost:3000/api/docs>

#### 2. Настроить frontend

```bash
cd ../frontend
cp .env.example .env   # проверьте VITE_SKILLSWAP_API_URL
npm install
npm run dev
```

Ссылка на приложение <http://localhost:5173>

---

### Запуск через Docker Compose

```bash
# Из корня проекта
docker-compose up --build
```

После запуска будут доступны:

Frontend: <http://localhost:8080>

Backend API: <http://localhost:3000>

Swagger: <http://localhost:3000/api/docs>

PostgreSQL: localhost:5432

Остановка:

```bash
docker-compose down
# с удалением томов (чистая БД)
docker-compose down -v
```

---

## Переменные окружения

Backend (.env)

```env
PORT=3000
DATABASE_HOST=postgres   # при Docker: postgres, при локальном: localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=skillswap

JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:8080

# OAuth
YANDEX_CLIENT_ID=...
YANDEX_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

Frontend (.env)

```env
VITE_SKILLSWAP_API_URL=http://localhost:3000
```

---

## Скрипты и команды

Backend

| Команда | Описание |
| ------- | -------- |
| `npm run start:dev` | Запуск в режиме разработки (watch) |
| `npm run build` | Сборка проекта в `dist/` |
| `npm run start:prod` | Запуск production-сборки |
| `npm run test` | Unit-тесты (Jest) |
| `npm run test:e2e` | End-to-end тесты |
| `npm run migration:run` | Применить миграции |
| `npm run migration:generate` | Сгенерировать миграцию |
| `npm run seed:all` | Заполнить БД тестовыми данными |
| `npm run seed:admin` | Создать администратора |
| `npm run db:clean` | Очистить базу данных |

---
Frontend

| Команда | Описание |
| ------- | -------- |
| `npm run dev` | Запуск dev-сервера (Vite) |
| `npm run build` | Production сборка |
| `npm run preview` | Предпросмотр сборки |
| `npm run test` | Unit-тесты (Vitest) |
| `npm run cypress:open` | Открыть Cypress Test Runner |
| `npm run storybook` | Запустить Storybook (порт 6006) |
| `npm run lint` | Проверка кода ESLint |
| `npm run prettier` | Автоформатирование |

## Тестирование

Backend

```bash
cd backend
npm run test           # unit-тесты
npm run test:cov       # покрытие
npm run test:e2e       # e2e тесты
```

---
Frontend

```bash
cd frontend
npm run test           # Vitest + Coverage
npm run cypress:open   # интерактивный режим Cypress
npm run storybook      # ручное тестирование UI-компонентов
```

## Структура проекта

```text
backend/
├── src/
│   ├── modules/             # бизнес-модули
│   │   ├── auth/
│   │   ├── users/
│   │   ├── skills/
│   │   ├── categories/
│   │   ├── cities/
│   │   ├── requests/
│   │   ├── file-upload/
│   │   └── notification/
│   │
│   ├── common/              # shared: guards, decorators, pipes, filters
│   ├── config/              # конфигурация (env, jwt, oauth, etc.)
│   ├── database/
│   │   ├── migrations/      # TypeORM migrations
│   │   └── seeding/         # seeding (тестовые данные)
│   │
│   ├── main.ts              # entrypoint
│   └── app.module.ts
│
└── test/                    # e2e тесты

frontend/
├── src/
│   ├── api/                 # базовые API клиенты / RTK Query base
│   ├── app/                 # инициализация приложения (providers, router, store)
│   ├── entities/            # доменные сущности (user, skill, etc.)
│   ├── features/            # бизнес-функции (login, search, etc.)
│   ├── pages/               # страницы (route-level)
│   ├── services/            # внешние сервисы (если не в RTK Query)
│   ├── shared/              # переиспользуемое (ui, lib, api, config, hooks)
│   ├── widgets/             # крупные UI-блоки (layout sections)
│   └── index.tsx
│
└── cypress/                 # e2e тесты
```

## Лицензия

Проект является учебным и не предназначен для коммерческого использования.

## Контакты

Контакты

---
> [Примечание]
> Для работы OAuth (Google/Yandex) необходимо зарегистрировать приложения в соответствующих консолях разработчика
> и указать корректные redirect_uri.
