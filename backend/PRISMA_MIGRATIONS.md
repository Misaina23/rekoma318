# Générer les migrations Prisma pour le composant admin

Ce fichier explique comment générer et versionner les migrations correspondant aux changements de schéma (par ex. tables/colonnes liées à l'admin).

1. Assurez-vous d'avoir mis à jour `prisma/schema.prisma` avec les modèles requis (User, Message, News, Document, etc.).

2. Depuis le dossier `backend`, lancez (en développement) :

```bash
cd backend
npx prisma migrate dev --name add-admin-models
```

Cette commande :
- génère une migration SQL dans `prisma/migrations/`
- applique la migration à la base locale
- régénère le client Prisma

3. Vérifiez que tout fonctionne localement, puis committez les fichiers de migration :

```bash
git add prisma/migrations
git commit -m "prisma: add migrations for admin models"
```

4. En production / CI, les migrations sont appliquées automatiquement au démarrage du conteneur via `start.sh` (exécute `npx prisma migrate deploy`, avec fallback sur `prisma db push` si nécessaire). Si vous souhaitez désactiver l'exécution automatique des migrations dans le conteneur, définissez `MIGRATE=0`.

5. Pour forcer l'exécution des migrations depuis le conteneur (si non activées), vous pouvez lancer :

```bash
docker run -e MIGRATE=1 --network=host <image> ./start.sh
```

Remarques:
- N'exécutez `prisma migrate dev` qu'en développement : en production utilisez `prisma migrate deploy`.
- Vérifiez que la variable `DATABASE_URL` est correctement configurée avant d'exécuter les migrations.
