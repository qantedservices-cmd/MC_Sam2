# MonChantier Backend (PostgreSQL)

Backend Express.js avec Prisma pour gérer les données de chantiers.

## Migration depuis JSON Server

### 1. Prérequis
- Docker et Docker Compose
- Node.js 20+ (pour le développement local)

### 2. Migration des données

Les données existantes dans `data/db.json` seront automatiquement migrées lors du premier démarrage.

### 3. Démarrage avec PostgreSQL

```bash
# Depuis la racine du projet
docker-compose up --build
```

### 4. Commandes utiles

```bash
# Générer le client Prisma
cd backend && npm run db:generate

# Créer une migration
npm run db:migrate

# Pousser le schéma (sans migration)
npm run db:push

# Seed la base de données
npm run db:seed
```

### 5. Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| DATABASE_URL | URL PostgreSQL | - |
| PORT | Port du serveur | 3001 |
| JWT_SECRET | Clé secrète JWT | - |

### 6. Revenir à JSON Server

Si nécessaire, utilisez l'ancienne configuration:
```bash
docker-compose -f docker-compose.json-server.yml up
```
