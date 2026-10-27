#!/usr/bin/env sh
set -e

# Run migrations on startup by default. Set MIGRATE=0 to skip.
if [ "${MIGRATE:-1}" != "0" ]; then
	attempt=1
	max_attempts=5
	delay=2

	while [ "$attempt" -le "$max_attempts" ]; do
		echo "==> Applying database migrations (attempt $attempt/$max_attempts)"
		if output="$(npx prisma migrate deploy 2>&1)"; then
			printf '%s\n' "$output"
			echo "==> Migrations applied"
			break
		else
			status=$?
			printf '%s\n' "$output" >&2
			case "$output" in
				*P1001*|*P1002*|*P1008*|*P1017*)
					if [ "$attempt" -ge "$max_attempts" ]; then
						echo "==> Database is still unreachable. Verify DATABASE_URL and database availability; on Render, use the internal database URL when services share a region." >&2
						exit "$status"
					fi
					echo "==> Temporary database connection failure. Retrying in ${delay}s..." >&2
					sleep "$delay"
					delay=$((delay * 2))
					attempt=$((attempt + 1))
					;;
				*)
					echo "==> Migration failed. Refusing to modify the schema with prisma db push." >&2
					exit "$status"
					;;
			esac
		fi
	done
else
	echo "==> Skipping migrations (MIGRATE=0)"
fi

echo "==> Seeding database"
npm run seed

echo "==> Starting API server"
exec node ./src/server.js