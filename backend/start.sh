#!/usr/bin/env sh
set -e

# Run migrations on startup by default. Set MIGRATE=0 to skip.
if [ "${MIGRATE:-1}" != "0" ]; then
	echo "==> Applying database migrations (deploy)"
	if npx prisma migrate deploy; then
		echo "==> Migrations applied"
	else
		echo "==> Migration deploy failed, falling back to prisma db push"
		npx prisma db push --accept-data-loss
	fi
else
	echo "==> Skipping migrations (MIGRATE=0)"
fi

echo "==> Seeding database"
npm run seed

echo "==> Starting API server"
exec node ./src/server.js