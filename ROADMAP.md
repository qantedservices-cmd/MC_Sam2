# ROADMAP - Application Suivi Chantiers BTP

## Phase 1 : Initialisation du Projet

### 1.1 Création du projet React
- [x] Ouvrir le terminal dans le dossier `Monchantier`
- [x] Exécuter `npm create vite@latest . -- --template react-ts`
- [x] Installer les dépendances : `npm install`
- [x] Vérifier que le projet démarre : `npm run dev`
- [x] Nettoyer les fichiers par défaut (App.css, assets inutiles)

### 1.2 Configuration de Tailwind CSS
- [x] Installer Tailwind : `npm install -D tailwindcss postcss autoprefixer`
- [x] Initialiser Tailwind : `npx tailwindcss init -p`
- [x] Configurer `tailwind.config.js`
- [x] Ajouter les directives Tailwind dans `src/index.css`
- [x] Tester que Tailwind fonctionne

### 1.3 Installation des dépendances supplémentaires
- [x] Installer React Router : `npm install react-router-dom`
- [x] Installer JSON Server : `npm install -D json-server`
- [x] Installer les icônes : `npm install lucide-react`

### 1.4 Configuration de JSON Server (base de données)
- [x] Créer le fichier `db.json` à la racine du projet
- [x] Ajouter la structure initiale des données
- [x] Ajouter un script dans `package.json`
- [x] Tester que le serveur démarre : `npm run server`
- [x] Vérifier l'accès à `http://localhost:3001/chantiers`

---

## Phase 2 : Structure de Base

### 2.1 Création de la structure des dossiers
- [x] Créer le dossier `src/components/`
- [x] Créer le dossier `src/pages/`
- [x] Créer le dossier `src/services/`
- [x] Créer le dossier `src/types/`

### 2.2 Définition des types TypeScript
- [x] Créer le fichier `src/types/index.ts`
- [x] Définir le type `Chantier`
- [x] Définir le type `Depense`
- [x] Définir les constantes `CATEGORIES_DEPENSE` et `STATUTS_CHANTIER`

### 2.3 Service API
- [x] Créer le fichier `src/services/api.ts`
- [x] Créer les fonctions CRUD pour les chantiers
- [x] Créer les fonctions CRUD pour les dépenses

---

## Phase 3 : Layout et Navigation

### 3.1 Composant Layout
- [x] Créer le fichier `src/components/Layout.tsx`
- [x] Créer le header avec logo/titre "MonChantier"
- [x] Ajouter lien vers le tableau de bord
- [x] Ajouter bouton "Nouveau chantier"
- [x] Créer le conteneur principal pour le contenu
- [x] Ajouter un style responsive (mobile-first)

### 3.2 Configuration du Router
- [x] Modifier `src/App.tsx`
- [x] Importer `BrowserRouter`, `Routes`, `Route` de react-router-dom
- [x] Définir les routes (`/`, `/chantiers/nouveau`, `/chantiers/:id`, etc.)
- [x] Envelopper les routes dans le composant Layout

---

## Phase 4 : Tableau de Bord (Dashboard)

### 4.1 Page Dashboard
- [x] Créer le fichier `src/pages/Dashboard.tsx`
- [x] Ajouter les états pour chantiers et dépenses
- [x] Ajouter un état de chargement
- [x] Charger les données au montage avec `useEffect`

### 4.2 Section Résumé Global
- [x] Calculer le budget total de tous les chantiers
- [x] Calculer les dépenses totales
- [x] Calculer le budget restant global
- [x] Afficher les 3 KPIs dans des cartes avec icônes

### 4.3 Liste des Chantiers
- [x] Créer le composant `src/components/ChantierCard.tsx`
- [x] Créer le composant `src/components/ChantierListItem.tsx` (bonus)
- [x] Afficher nom, adresse, budget, dépenses, barre de progression, statut
- [x] Ajouter un lien vers le détail du chantier
- [x] Ajouter toggle vue grille/liste (bonus)

### 4.4 Gestion de l'état vide
- [x] Afficher un message d'accueil pour les nouveaux utilisateurs
- [x] Proposer de créer un premier chantier

---

## Phase 5 : Formulaire Chantier

### 5.1 Page ChantierForm
- [x] Créer le fichier `src/pages/ChantierForm.tsx`
- [x] Récupérer le paramètre `id` depuis l'URL (si édition)
- [x] Créer un état pour le formulaire
- [x] Si `id` existe, charger les données du chantier existant

### 5.2 Champs du formulaire
- [x] Champ "Nom du chantier" (input text, requis)
- [x] Champ "Adresse" (textarea)
- [x] Champ "Budget prévisionnel" (input number, requis, min 0)
- [x] Champ "Statut" (select avec options)
- [x] Validation des champs obligatoires

### 5.3 Soumission du formulaire
- [x] Créer la fonction `handleSubmit`
- [x] Si création : appeler `createChantier()`
- [x] Si édition : appeler `updateChantier()`
- [x] Gérer les erreurs (try/catch)
- [x] Afficher un message de succès (toast)
- [x] Rediriger vers le tableau de bord après succès

### 5.4 UX du formulaire
- [x] Ajouter un bouton "Annuler" qui redirige vers le dashboard
- [x] Désactiver le bouton "Enregistrer" pendant la soumission
- [x] Afficher un indicateur de chargement pendant la soumission

---

## Phase 6 : Détail d'un Chantier

### 6.1 Page ChantierDetail
- [x] Créer le fichier `src/pages/ChantierDetail.tsx`
- [x] Récupérer le paramètre `id` depuis l'URL
- [x] Charger les données du chantier
- [x] Charger les dépenses liées au chantier
- [x] Gérer le cas où le chantier n'existe pas (404)

### 6.2 En-tête du chantier
- [x] Afficher le nom du chantier
- [x] Afficher l'adresse
- [x] Afficher le statut (badge)
- [x] Bouton "Modifier" (lien vers formulaire édition)
- [x] Bouton "Supprimer" (avec confirmation)

### 6.3 Section Finances
- [x] Afficher le budget prévisionnel
- [x] Calculer et afficher le total des dépenses
- [x] Calculer et afficher le budget restant
- [x] Afficher une barre de progression visuelle
- [x] Changer la couleur si dépassement (rouge)

### 6.4 Liste des dépenses
- [x] Afficher description, montant, date, catégorie, bouton supprimer
- [x] Trier les dépenses par date (plus récentes en premier)
- [x] Afficher un message si aucune dépense

### 6.5 Bouton Ajouter une dépense
- [x] Ajouter un bouton "Nouvelle dépense"
- [x] Le bouton redirige vers `/chantiers/:id/depenses/nouveau`

### 6.6 Suppression du chantier
- [x] Créer une modale de confirmation
- [x] Supprimer toutes les dépenses liées avant de supprimer le chantier
- [x] Rediriger vers le dashboard après suppression

---

## Phase 7 : Formulaire Dépense

### 7.1 Page DepenseForm
- [x] Créer le fichier `src/pages/DepenseForm.tsx`
- [x] Récupérer le `chantierId` depuis l'URL
- [x] Créer un état pour le formulaire

### 7.2 Champs du formulaire
- [x] Champ "Description" (input text, requis)
- [x] Champ "Montant" (input number, requis, min 0.01)
- [x] Champ "Date" (input date, requis)
- [x] Champ "Catégorie" (select avec les 6 options)

### 7.3 Soumission du formulaire
- [x] Créer la fonction `handleSubmit`
- [x] Appeler `createDepense()` avec le `chantierId`
- [x] Gérer les erreurs
- [x] Afficher notification toast
- [x] Rediriger vers le détail du chantier après succès

---

## Phase 8 : Améliorations Visuelles

### 8.1 Formatage des données
- [x] Créer un utilitaire `src/utils/format.ts`
- [x] Fonction `formatMontant(montant: number)` → "1 234,56 €"
- [x] Fonction `formatDate(date: string)` → "21 déc. 2025"
- [x] Appliquer le formatage partout dans l'app

### 8.2 États de chargement
- [x] Créer un composant `src/components/Loading.tsx`
- [x] Afficher le spinner pendant le chargement des données
- [x] Ajouter des skeletons pour les cartes

### 8.3 Messages d'erreur
- [x] Créer un composant `src/components/ErrorMessage.tsx`
- [x] Afficher un message user-friendly en cas d'erreur API
- [x] Proposer un bouton "Réessayer"

### 8.4 Notifications de succès
- [x] Créer `src/contexts/ToastContext.tsx`
- [x] Ajouter des notifications toast pour les actions :
  - [x] "Chantier créé avec succès"
  - [x] "Chantier modifié avec succès"
  - [x] "Chantier supprimé avec succès"
  - [x] "Dépense ajoutée avec succès"
  - [x] "Dépense supprimée"

---

## Phase 9 : Tests et Finalisation

### 9.1 Données de test
- [x] Ajouter 5 chantiers de test dans `db.json`
- [x] Ajouter plusieurs dépenses par chantier
- [x] Varier les catégories et les montants

### 9.2 Tests manuels
- [x] Tester la création d'un chantier
- [x] Tester la modification d'un chantier
- [x] Tester la suppression d'un chantier
- [x] Tester l'ajout d'une dépense
- [x] Tester la suppression d'une dépense
- [x] Tester la navigation entre les pages
- [x] Tester sur mobile (responsive)

### 9.3 Corrections et polish
- [x] Corriger les bugs identifiés
- [x] Améliorer l'accessibilité (labels, aria)
- [x] Vérifier la cohérence des styles
- [x] Vérifier que le build fonctionne

---

## Phase 10 : Documentation et Livraison

### 10.1 README
- [x] Mettre à jour le fichier `README.md`
- [x] Décrire le projet
- [x] Expliquer comment installer les dépendances
- [x] Expliquer comment lancer le projet
- [x] Lister les fonctionnalités

### 10.2 Scripts npm
- [x] Vérifier que `npm run dev` fonctionne (frontend)
- [x] Vérifier que `npm run server` fonctionne (backend)
- [x] Ajouter un script `npm run dev:all` pour lancer les deux

---

## Fonctionnalités Bonus Implémentées

- [x] Vue liste/grille pour les chantiers
- [x] Catégorie "Menuiserie" ajoutée
- [x] Statistiques par statut (en cours, terminés, suspendus)
- [x] Icônes dans les KPIs

---

## Futures Évolutions (Backlog)

### Fonctionnalités à ajouter plus tard
- [ ] Authentification utilisateur
- [ ] Gestion des devis
- [ ] Gestion des factures
- [x] Export PDF des données
- [ ] Graphiques et statistiques avancées
- [ ] Mode hors-ligne (PWA)
- [ ] Notifications de dépassement de budget
- [ ] Gestion des sous-traitants
- [ ] Upload de photos/documents
- [ ] Historique des modifications

---

**Légende :**
- [ ] À faire
- [x] Terminé

**Statut : PROJET TERMINÉ** ✅
