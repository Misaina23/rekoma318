#!/usr/bin/env sh
set -e

echo "==> Applying database migrations"
npx prisma migrate deploy

echo "==> Seeding database (super user + sample data)"
npm run seed || echo "Seed skipped/failed (non-blocking)"

echo "==> Starting API server"
exec node ./src/server.js
