# BlushCo Commerce Platform

BlushCo is a cloud-native e-commerce application built for academic work in cloud architecture, security, and UI/UX fundamentals. The project uses real production patterns with simulation-first payment handling for safe demonstrations.

## Project Scope

- Real auth, database, APIs, and order lifecycle
- Simulated checkout outcomes (`success`, `failed`, `pending`, `cancelled`)
- No live money processing
- User profile capture for personalization (age, preferences, shipping address)

## Core Features

- Next.js App Router storefront (`/`, `/shop`, `/product/[id]`)
- Clerk authentication (email/password + social login)
- Supabase PostgreSQL via Prisma ORM
- Cart drawer with protected add-to-cart and checkout rules
- Account center for profile and address management
- Personalized product recommendations from saved profile data
- Admin-ready product/category/order APIs

## Technology Stack

| Layer | Service/Tool | Purpose |
|---|---|---|
| Frontend + Backend | Next.js 16 | UI, server rendering, API routes |
| Authentication | Clerk | Sign-in/sign-up, session identity |
| Database | Supabase PostgreSQL | Persistent commerce data |
| ORM | Prisma | Schema, migrations, typed DB access |
| Media | Cloudinary (configured) | Product/media delivery |
| Payments | Stripe test keys + simulation API | Academic payment simulation |
| Hosting target | Vercel-ready + Docker | Flexible deployment options |

## Architecture Notes

- `src/proxy.ts` enforces Clerk middleware at the edge.
- API routes run in Next.js server runtime.
- Checkout creates a `PaymentSession`, then `/api/payments/simulate` transitions state and writes orders.
- Add-to-cart and checkout require signed-in users with profile + shipping details.

## Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (Postgres)
- Clerk app configuration

## Quick Start

1. Install dependencies.

```bash
npm install
```

2. Create local environment file.

```bash
cp .env.example .env
```

3. Fill all keys/secrets in `.env`.

4. Generate Prisma client and apply migrations.

```bash
npm run db:generate
npm run db:migrate:deploy
```

5. Seed demo catalog.

```bash
npm run db:seed
```

6. Run development server.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Use `.env.example` as the source of truth. Required groups:

- Clerk: publishable key, secret key, webhook secret
- Supabase: URL, publishable key, service role key
- Postgres: `DATABASE_URL` (pooler) and `DIRECT_URL` (migration path)
- Cloudinary keys
- Stripe test keys

## Scripts

- `npm run dev` - start local development server
- `npm run build` - production build
- `npm run start` - run production build
- `npm run lint` - ESLint checks
- `npm run db:generate` - Prisma client generation
- `npm run db:migrate:dev` - local migration workflow
- `npm run db:migrate:deploy` - apply migrations to target DB
- `npm run db:seed` - seed starter catalog

## API Surface

### Catalog

- `GET /api/products`
- `POST /api/products` (admin)
- `GET /api/products/[id]`
- `PATCH /api/products/[id]` (admin)
- `DELETE /api/products/[id]` (admin)
- `GET /api/categories`
- `POST /api/categories` (admin)
- `PATCH /api/categories/[id]` (admin)
- `DELETE /api/categories/[id]` (admin)

### Account

- `GET /api/account/profile`
- `PUT /api/account/profile`
- `GET /api/account/addresses`
- `POST /api/account/addresses`
- `PATCH /api/account/addresses/[id]`
- `DELETE /api/account/addresses/[id]`

### Orders and checkout

- `POST /api/checkout`
- `POST /api/payments/simulate`
- `GET /api/orders`
- `GET /api/orders/[id]`
- `PATCH /api/admin/orders/[id]/status` (admin)

### Webhooks

- `POST /api/webhooks/clerk`

## Docker (Production)

This repository includes a multi-stage Docker build with Next.js standalone output.

Build:

```bash
docker build -t blushco:latest .
```

Run:

```bash
docker run --name blushco -p 3000:3000 --env-file .env blushco:latest
```

## Security and Repo Hygiene

- `.env`, `.env.local`, and all `.env.*` files are ignored
- `.env.example` is tracked for onboarding
- `.codex/` is ignored and will not be pushed
- Rotate secrets if they were ever shared outside trusted channels


## Academic Disclaimer

This project is intentionally configured for simulated payments and learning workflows. It is not a PCI-compliant production payment deployment.
