# MonChantier - Application de Suivi de Chantiers BTP

Application web de gestion et suivi de chantiers pour les professionnels du BTP. Permet de suivre les budgets, les dépenses et l'avancement de vos projets de construction.

## Fonctionnalités

- **Tableau de bord** : Vue d'ensemble avec KPIs (budget total, dépenses, reste)
- **Gestion des chantiers** : Création, modification, suppression de chantiers
- **Suivi des dépenses** : Ajout de dépenses par catégorie (main d'oeuvre, matériaux, location, sous-traitance, menuiserie, autre)
- **Barres de progression** : Visualisation du budget consommé
- **Alertes de dépassement** : Indication visuelle quand le budget est dépassé
- **Vue liste/grille** : Affichage des chantiers en mode carte ou liste compacte
- **Notifications toast** : Confirmations visuelles des actions
- **Interface responsive** : Adaptée mobile et desktop

## Technologies

- **Frontend** : React 19, TypeScript, Vite
- **Style** : Tailwind CSS v4
- **Routing** : React Router v7
- **Icônes** : Lucide React
- **Backend** : JSON Server (API REST simulée)

## Installation

1. **Cloner le projet**
   ```bash
   git clone <url-du-repo>
   cd Monchantier
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

## Lancement

### Option 1 : Lancer les deux serveurs en une commande
```bash
npm run dev:all
```

### Option 2 : Lancer les serveurs séparément

**Terminal 1 - Backend (API JSON Server)**
```bash
npm run server
```
Le serveur API sera disponible sur : http://localhost:3001

**Terminal 2 - Frontend (Vite)**
```bash
npm run dev
```
L'application sera disponible sur : http://localhost:5173

## Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance le serveur de développement Vite |
| `npm run server` | Lance le serveur JSON Server (API) |
| `npm run dev:all` | Lance les deux serveurs simultanément |
| `npm run build` | Compile le projet pour la production |
| `npm run preview` | Prévisualise le build de production |
| `npm run lint` | Vérifie le code avec ESLint |

## Structure du projet

```
src/
├── components/          # Composants réutilisables
│   ├── Layout.tsx       # Layout principal avec header
│   ├── ChantierCard.tsx # Carte de chantier (vue grille)
│   ├── ChantierListItem.tsx # Ligne de chantier (vue liste)
│   ├── Loading.tsx      # Composant de chargement
│   └── ErrorMessage.tsx # Composant d'erreur
├── contexts/            # Contextes React
│   └── ToastContext.tsx # Système de notifications
├── pages/               # Pages de l'application
│   ├── Dashboard.tsx    # Tableau de bord
│   ├── ChantierForm.tsx # Formulaire chantier
│   ├── ChantierDetail.tsx # Détail d'un chantier
│   └── DepenseForm.tsx  # Formulaire dépense
├── services/            # Services API
│   └── api.ts           # Fonctions d'appel API
├── types/               # Types TypeScript
│   └── index.ts         # Interfaces et constantes
├── utils/               # Utilitaires
│   └── format.ts        # Fonctions de formatage
├── App.tsx              # Configuration des routes
├── main.tsx             # Point d'entrée
└── index.css            # Styles globaux
```

## API Endpoints

L'API JSON Server expose les endpoints suivants :

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/chantiers` | Liste tous les chantiers |
| GET | `/chantiers/:id` | Récupère un chantier |
| POST | `/chantiers` | Crée un chantier |
| PATCH | `/chantiers/:id` | Modifie un chantier |
| DELETE | `/chantiers/:id` | Supprime un chantier |
| GET | `/depenses` | Liste toutes les dépenses |
| GET | `/depenses?chantierId=:id` | Dépenses d'un chantier |
| POST | `/depenses` | Crée une dépense |
| DELETE | `/depenses/:id` | Supprime une dépense |

## Catégories de dépenses

- Main d'oeuvre
- Matériaux
- Location
- Sous-traitance
- Menuiserie
- Autre

## Statuts des chantiers

- **En cours** (bleu)
- **Terminé** (vert)
- **Suspendu** (jaune)

## Licence

Projet privé - Tous droits réservés
