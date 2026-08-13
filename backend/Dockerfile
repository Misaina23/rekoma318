FROM node:20-slim

WORKDIR /app

# Run migrations at container startup by default (controlled by MIGRATE env var)
ENV MIGRATE=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN chmod +x start.sh

EXPOSE 4000

CMD ["./start.sh"]