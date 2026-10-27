# Rekoma Backend

Quick start:

1. Install deps

```bash
cd backend
npm install
```

2. Copy `.env.example` to `.env` and set `DATABASE_URL` and `JWT_SECRET`.

3. Generate Prisma client, run migrations and seed:

```bash
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
```

4. Run dev server:

```bash
npm run dev
```

Deployment notes:
- Use PostgreSQL (Render, Supabase). Set `DATABASE_URL` on the service.
- Ensure `JWT_SECRET` is set to a strong secret and `NODE_ENV=production`.
# Rekoma Backend

Express + Prisma backend for Rekoma.

Features:
- Node.js + Express
- PostgreSQL via Prisma
- JWT authentication
- bcrypt password hashing
- Input validation via Joi
- Logging (morgan), security (helmet), CORS, compression

Quickstart

1. Copy `.env.example` → `.env` and set `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`
2. Install dependencies:

```bash
cd backend
npm install
```

3. Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

4. Start dev server:

```bash
npm run dev
```

Endpoints (examples):

- POST /api/auth/login { email, password }
- GET /api/producteurs
- POST /api/producteurs (protected)
- PUT /api/producteurs/:id (protected)
- DELETE /api/producteurs/:id (protected)
- GET /api/store/products (public REKOMA merchandise catalogue)
- POST /api/store/orders (public order request; current prices are calculated by the server)
- GET /api/store/orders and PATCH /api/store/orders/:id (requires `manage_orders`)
- POST /api/store/products and PATCH /api/store/products/:id (requires `manage_products`)

The store migration adds the initial REKOMA merchandise catalogue. In production, run `npx prisma migrate deploy` before deploying the frontend store, then regenerate the Prisma client when building the backend.

Deployment

- Use Render (Web Service) or any Node host.
- Set environment variables on host: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`.
