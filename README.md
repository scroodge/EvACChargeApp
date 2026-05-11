# VoltFlow

![Next.js](https://img.shields.io/badge/Next.js-16.2.6-black?style=for-the-badge&logo=nextdotjs)
![React](https://img.shields.io/badge/React-19.2.4-149eca?style=for-the-badge&logo=react&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20Postgres%20%2B%20Realtime-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-installable-00e676?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-f8fafc?style=for-the-badge)

**VoltFlow** is a mobile-first EV charging cockpit for live session tracking, deterministic ETA, energy delivery, tariff-aware cost estimates, and charging history.

**VoltFlow** — мобильная панель для контроля зарядки электромобиля: живые сессии, точный ETA, расчет энергии, стоимость по тарифу и история зарядок.

---

## Language / Язык

- [English](#english)
- [Русский](#русский)

---

## English

### Overview

VoltFlow helps EV drivers model and track AC charging sessions without talking directly to charger hardware. The app anchors every charging session to timestamps in Postgres, then recomputes battery percent, delivered kWh, estimated cost, and remaining time from wall-clock math. That makes refreshes, reconnects, and PWA restores predictable.

### Highlights

- **Live charging cockpit** with battery progress, elapsed time, remaining time, kWh, cost, and AC power.
- **Vehicle profiles** for usable battery capacity, wallbox power, and AC efficiency.
- **Tariff-aware estimates** with local currency preferences: EUR, USD, BYN, and RUB.
- **Supabase Auth + RLS** so users only read and update their own vehicles and sessions.
- **Realtime session sync** through Supabase updates on `charging_sessions`.
- **Installable PWA** with app manifest, service worker, icons, and iOS home-screen support.
- **Mobile-first shell** optimized for thumb-friendly controls and safe-area navigation.
- **Internationalization** for English, Belarusian, and Russian.

### Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, shadcn-style components, lucide-react |
| State & data | TanStack Query, Zustand |
| Forms & validation | React Hook Form, Zod |
| Backend | Supabase Auth, Postgres, Realtime, Row Level Security |
| PWA | `manifest.ts`, production service worker, generated app icons |
| Deployment target | Vercel or any Node-compatible Next.js host |

### Getting Started

#### Requirements

- Node.js `>=20.9.0`
- npm `10.x`
- Supabase project

#### 1. Install dependencies

```bash
npm install
```

#### 2. Configure environment variables

Copy the example file:

```bash
cp .env.example .env.local
```

Set these values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

The client uses the anon key with RLS. The service role key is reserved for future server-side tooling and should never be exposed to the browser.

#### 3. Prepare Supabase

Run the migration from:

```text
supabase/migrations/20250511000000_init.sql
```

It creates:

- `profiles`
- `cars`
- `charging_sessions`
- RLS policies scoped by `auth.uid()`
- profile creation trigger
- `updated_at` trigger
- Realtime publication for `charging_sessions`

In Supabase, also enable Realtime for the `charging_sessions` table and configure Auth redirect URLs:

```text
http://localhost:3000
https://your-production-domain.com
```

#### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Scripts

```bash
npm run dev       # Start Next.js dev server
npm run build     # Create production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

### Charging Model

VoltFlow stores immutable session inputs such as starting percent, target percent, battery capacity, charger power, efficiency, tariff, and timestamps. Runtime values are recomputed from `started_at` plus the current wall clock:

- current battery percent
- delivered AC energy
- estimated cost
- ETA and remaining duration
- completed or stopped state

Those values are persisted back to Postgres so browser refreshes, realtime subscribers, and restored PWA sessions stay consistent.

### PWA Install

- App manifest: `src/app/manifest.ts`
- Service worker: `public/sw.js`
- Registration component: `src/components/sw-register.tsx`
- SVG brand assets: `public/voltflow-icon.svg`, `public/voltflow-logo.svg`
- PNG icons: `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`

On iOS, install through **Safari -> Share -> Add to Home Screen**. On Android and desktop Chrome, use the browser install prompt when available.

### Project Structure

```text
src/app/                 Routes, layouts, manifest, auth callback
src/actions/             Server actions for cars and sessions
src/components/          UI, brand, dashboard, charging, history, settings
src/hooks/               Query, session, translation, and ticking-clock hooks
src/lib/                 Charging math, i18n, Supabase clients, utilities
src/stores/              Local UI and preference stores
src/types/               Database types
supabase/migrations/     Database schema, RLS, triggers, Realtime setup
public/                  PWA icons, service worker, brand assets
```

### Brand

- Base: `#12151C`
- Card: `#171B24`
- Border: `#273040`
- Text: `#F8FAFC`
- Primary green: `#00E676`
- Cyan: `#00D1FF`
- Accent blue: `#2962FF`
- Typography: Space Grotesk with Inter/system fallback

### License

MIT License. See [LICENSE](LICENSE).

---

## Русский

### Обзор

VoltFlow помогает владельцам электромобилей моделировать и отслеживать AC-зарядку без прямого подключения к зарядной станции. Каждая сессия привязана к временным меткам в Postgres, а процент батареи, переданные кВт·ч, примерная стоимость и оставшееся время пересчитываются по реальному времени. Поэтому обновление страницы, восстановление PWA и повторное подключение остаются предсказуемыми.

### Возможности

- **Живая панель зарядки** с прогрессом батареи, прошедшим временем, ETA, кВт·ч, стоимостью и AC-мощностью.
- **Профили автомобилей** с полезной емкостью батареи, мощностью wallbox и эффективностью AC-зарядки.
- **Расчет стоимости по тарифу** с локальными валютами: EUR, USD, BYN и RUB.
- **Supabase Auth + RLS**, чтобы пользователь видел и менял только свои автомобили и сессии.
- **Realtime-синхронизация** через обновления таблицы `charging_sessions`.
- **Устанавливаемая PWA** с manifest, service worker, иконками и поддержкой iOS Home Screen.
- **Mobile-first интерфейс** с крупными touch-контролами и safe-area навигацией.
- **Локализация** на английский, белорусский и русский языки.

### Стек

| Слой | Технологии |
| --- | --- |
| Фреймворк | Next.js 16 App Router |
| UI | React 19, Tailwind CSS 4, shadcn-style компоненты, lucide-react |
| Состояние и данные | TanStack Query, Zustand |
| Формы и валидация | React Hook Form, Zod |
| Бэкенд | Supabase Auth, Postgres, Realtime, Row Level Security |
| PWA | `manifest.ts`, production service worker, app icons |
| Деплой | Vercel или любой Node-compatible хостинг для Next.js |

### Быстрый старт

#### Требования

- Node.js `>=20.9.0`
- npm `10.x`
- проект Supabase

#### 1. Установите зависимости

```bash
npm install
```

#### 2. Настройте переменные окружения

Скопируйте пример:

```bash
cp .env.example .env.local
```

Заполните значения:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Клиентская часть использует anon key вместе с RLS. Service role key зарезервирован для будущих серверных задач и не должен попадать в браузер.

#### 3. Подготовьте Supabase

Выполните миграцию:

```text
supabase/migrations/20250511000000_init.sql
```

Она создает:

- `profiles`
- `cars`
- `charging_sessions`
- RLS-политики через `auth.uid()`
- триггер создания профиля
- триггер `updated_at`
- Realtime-публикацию для `charging_sessions`

Также включите Realtime для таблицы `charging_sessions` и добавьте Auth Redirect URLs:

```text
http://localhost:3000
https://your-production-domain.com
```

#### 4. Запустите локально

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000).

### Скрипты

```bash
npm run dev       # Запуск Next.js dev server
npm run build     # Production build
npm run start     # Production server
npm run lint      # ESLint
```

### Модель зарядки

VoltFlow хранит неизменяемые входные данные сессии: стартовый процент, цель, емкость батареи, мощность зарядки, эффективность, тариф и временные метки. Текущие значения пересчитываются из `started_at` и текущего времени:

- текущий процент батареи
- переданная AC-энергия
- примерная стоимость
- ETA и оставшееся время
- статус завершения или остановки

Эти значения сохраняются обратно в Postgres, поэтому обновление страницы, realtime-подписчики и восстановленная PWA видят согласованное состояние.

### Установка PWA

- Manifest: `src/app/manifest.ts`
- Service worker: `public/sw.js`
- Регистрация service worker: `src/components/sw-register.tsx`
- SVG-бренд: `public/voltflow-icon.svg`, `public/voltflow-logo.svg`
- PNG-иконки: `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon.png`

На iOS установите приложение через **Safari -> Share -> Add to Home Screen**. На Android и в desktop Chrome используйте браузерную кнопку установки, если она доступна.

### Структура проекта

```text
src/app/                 Роуты, layout-файлы, manifest, auth callback
src/actions/             Server actions для автомобилей и сессий
src/components/          UI, бренд, dashboard, charging, history, settings
src/hooks/               Query, session, translation и ticking-clock hooks
src/lib/                 Charging math, i18n, Supabase clients, utilities
src/stores/              Локальные UI и preference stores
src/types/               Типы базы данных
supabase/migrations/     Схема БД, RLS, triggers, Realtime
public/                  PWA icons, service worker, brand assets
```

### Бренд

- Основа: `#12151C`
- Карточки: `#171B24`
- Границы: `#273040`
- Текст: `#F8FAFC`
- Основной зеленый: `#00E676`
- Cyan: `#00D1FF`
- Accent blue: `#2962FF`
- Типографика: Space Grotesk с fallback на Inter/system

### Лицензия

MIT License. Подробности в [LICENSE](LICENSE).
