# Backend REKOMA — image de déploiement (Render, Fly, etc.)
FROM node:20-alpine

WORKDIR /app

# Copier d'abord les manifests pour profiter du cache de couches
COPY package.json package-lock.json* ./

# Installer les dépendances de production + outils Prisma
RUN npm install --omit=dev

# Copier le reste du code source
COPY . .

# Générer le client Prisma (obligatoire pour @prisma/client)
RUN npx prisma generate

# Script exécuté au démarrage (migrations + seed + serveur)
RUN chmod +x start.sh

EXPOSE 4000

CMD ["./start.sh"]
