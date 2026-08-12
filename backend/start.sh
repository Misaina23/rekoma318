#!/usr/bin/env sh
set -e

echo "==> Applying database migrations"
npx prisma migrate deploy

echo "==> Seeding database"
npm run seed

echo "==> Starting API server"
exec node ./src/server.js