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

4. En production / CI, les migrations sont appliquées automatiquement au démarrage du conteneur via `start.sh` avec `npx prisma migrate deploy`. Les erreurs temporaires de connexion sont réessayées jusqu'à cinq fois. Si les migrations échouent, le conteneur s'arrête : le schéma n'est jamais modifié automatiquement par `prisma db push`. Si vous gérez les migrations séparément, définissez `MIGRATE=0`.

5. Pour forcer l'exécution des migrations depuis le conteneur (si non activées), vous pouvez lancer :

```bash
docker run -e MIGRATE=1 --network=host <image> ./start.sh
```

Remarques:
- N'exécutez `prisma migrate dev` qu'en développement : en production utilisez `prisma migrate deploy`.
- Vérifiez que la variable `DATABASE_URL` est correctement configurée avant d'exécuter les migrations.
- Sur Render, utilisez l'URL de connexion interne de la base PostgreSQL lorsque le service web et la base sont dans la même région. Vérifiez aussi que la base est disponible avant de redéployer.
