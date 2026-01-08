# SPÉCIFICATIONS MONCHANTIER V2.0

> **Document de référence** - Dernière mise à jour : 8 janvier 2026
>
> **Lien GitHub** : https://github.com/qantedservices-cmd/MC_Sam2/blob/main/SPECIFICATIONS_V2.md

---

## TABLE DES MATIÈRES

1. [Vision du Produit](#1-vision-du-produit)
2. [Système de Rôles et Permissions](#2-système-de-rôles-et-permissions)
3. [Entités de Données](#3-entités-de-données)
4. [Dashboards par Rôle](#4-dashboards-par-rôle)
5. [Modules Fonctionnels](#5-modules-fonctionnels)
6. [Workflows](#6-workflows)
7. [Roadmap de Développement](#7-roadmap-de-développement)

---

## 1. VISION DU PRODUIT

### 1.1 Objectif

MonChantier est une application de gestion de chantiers BTP permettant à différents acteurs (entrepreneurs, clients, architectes, collaborateurs) de suivre l'avancement, les coûts et la production de leurs projets de construction.

### 1.2 Utilisateurs Cibles

| Utilisateur | Besoin Principal |
|-------------|------------------|
| **Entrepreneur** | Gérer plusieurs chantiers, personnel, production, facturation |
| **Client/Propriétaire** | Suivre son chantier, valider les avancements, gérer les devis |
| **Architecte/MOA** | Superviser les chantiers en tant que mandataire |
| **Collaborateur terrain** | Saisir pointages, production, photos |

---

## 2. SYSTÈME DE RÔLES ET PERMISSIONS

### 2.1 Hiérarchie des Rôles

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN GÉNÉRAL                               │
│  • Accès total système                                          │
│  • Gestion de tous les utilisateurs et chantiers                │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────────┐ ┌───────────────────┐ ┌───────────────────┐
│   ENTREPRENEUR    │ │  CLIENT-GESTION.  │ │    ARCHITECTE     │
│   (Gestionnaire)  │ │  (Propriétaire)   │ │   (MOA mandaté)   │
│                   │ │                   │ │                   │
│ • Gère SES        │ │ • Gestionnaire de │ │ • Droits          │
│   chantiers       │ │   SON chantier    │ │   gestionnaire    │
│ • Voit personnel  │ │ • Ne voit PAS les │ │ • Vision complète │
│   et coûts        │ │   coûts internes  │ │   du chantier     │
│ • Facture client  │ │   entrepreneur    │ │                   │
│ • Crée comptes    │ │ • Valide avancmt  │ │                   │
│   (max 15/chantier)│ │ • Gère ses devis  │ │                   │
└───────────────────┘ └───────────────────┘ └───────────────────┘
           │                    │
    ┌──────┴──────┐            │
    ▼             ▼            │
┌────────────┐ ┌────────────┐  │
│COLLABORATEUR│ │  CLIENT    │◀┘
│            │ │ (Lecteur)  │
│ Saisie     │ │            │
│ terrain    │ │ Vue finance│
│ pointage   │ │ + avancmt  │
│ production │ │            │
└────────────┘ └────────────┘
```

### 2.2 Définition Détaillée des Rôles

#### ADMIN GÉNÉRAL
- **Accès** : Total sur l'ensemble du système
- **Fonctions** :
  - Gestion de tous les utilisateurs
  - Gestion de tous les chantiers
  - Configuration système
  - Statistiques globales

#### ENTREPRENEUR (Gestionnaire)
- **Accès** : Ses propres chantiers uniquement
- **Fonctions** :
  - Créer/modifier ses chantiers
  - Gérer son personnel (pointage, paiement, absences)
  - Suivre la production et le matériel
  - **Voir le budget payé par le client**
  - **Saisir les prix unitaires par lot**
  - **Calculer le montant facturable selon avancement**
  - Créer des comptes utilisateurs (max 15 par chantier)
  - Générer des PV d'avancement
  - Soumettre les facturations au client

#### CLIENT-GESTIONNAIRE (Propriétaire avec droits)
- **Accès** : Son chantier uniquement
- **Fonctions** :
  - **Droits de gestionnaire sur SON chantier**
  - **NE VOIT PAS** : coûts personnel entrepreneur, marges, infos internes
  - Voir l'avancement global et par lot
  - Voir les coûts par lot (prix client, pas coûts entrepreneur)
  - Gérer ses devis (ajouter, comparer, valider)
  - **Valider les PV d'avancement**
  - **Valider les facturations**
  - Créer des comptes pour ses proches (max 15)

#### ARCHITECTE / MOA
- **Accès** : Chantiers où il est mandaté
- **Fonctions** :
  - Droits équivalents gestionnaire
  - Vue technique et financière complète
  - Validation des avancements
  - Coordination avec entrepreneur et client

#### COLLABORATEUR
- **Accès** : Chantiers assignés (saisie uniquement)
- **Fonctions** :
  - Pointer le personnel
  - Saisir la production quotidienne (métrés)
  - Pointer le matériel utilisé
  - Ajouter des photos d'avancement
  - **NE VOIT PAS** : finances, coûts, marges

#### CLIENT (Lecteur)
- **Accès** : Son chantier (lecture seule)
- **Fonctions** :
  - Voir l'avancement
  - Voir le budget et les coûts par lot
  - Consulter les photos
  - Consulter les PV validés

### 2.3 Matrice des Permissions Complète

| Fonctionnalité | Admin | Entrepreneur | Client-Gest. | Architecte | Collaborateur | Client |
|----------------|:-----:|:------------:|:------------:|:----------:|:-------------:|:------:|
| **CHANTIERS** |
| Voir tous les chantiers | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Créer chantier | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Modifier chantier | ✅ | ✅ | ✅¹ | ✅ | ❌ | ❌ |
| Supprimer chantier | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Configurer accès libre/mdp | ✅ | ✅ | ✅¹ | ❌ | ❌ | ❌ |
| **UTILISATEURS** |
| Gérer tous users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Créer compte (15 max) | ✅ | ✅ | ✅¹ | ❌ | ❌ | ❌ |
| **PERSONNEL** |
| Voir personnel | ✅ | ✅ | ❌ | ✅ | ✅² | ❌ |
| Voir coûts personnel | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Pointer employés | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Gérer absences | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Payer employés | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **MATÉRIEL** |
| Pointer matériel | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Voir coûts matériel | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **PRODUCTION** |
| Saisir métré | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Voir production | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **LOTS & PRIX** |
| Ajouter lots personnalisés | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Définir prix unitaires | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Voir prix unitaires | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **FINANCE CLIENT** |
| Voir budget client | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Voir montant payé | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Voir facturable | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **FINANCE ENTREPRENEUR** |
| Voir coûts internes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Voir marges | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **DEVIS** |
| Ajouter devis | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Valider devis retenu | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **FACTURATION** |
| Saisir facturation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Soumettre facturation | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Valider facturation | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |
| **PV AVANCEMENT** |
| Créer PV | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Ajouter photos | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Soumettre PV | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Valider PV | ✅ | ❌ | ✅ | ✅ | ❌ | ❌ |

> ¹ Sur son propre chantier uniquement
> ² Vue limitée aux noms, pas aux coûts

### 2.4 Limite de Comptes par Chantier

- **Maximum 15 comptes** par chantier (hors Admin)
- Compte entrepreneur/gestionnaire + 6 autres
- Types de comptes créables : Client, Collaborateur, Architecte

### 2.5 Options de Sécurité par Chantier

Le gestionnaire peut configurer :
- **Accès libre** : Visualisation sans mot de passe (lecture seule)
- **Accès protégé** : Mot de passe obligatoire

---

## 3. ENTITÉS DE DONNÉES

### 3.1 Utilisateur (User) - Mis à jour

```typescript
interface User {
  id: string;
  email: string;
  password: string;              // À hasher !
  nom: string;
  prenom: string;
  telephone: string;
  fonction: string;              // Fonction sur le chantier
  role: UserRole;
  chantierIds: string[];
  actif: boolean;
  createdAt: string;
  createdBy?: string;
}

type UserRole =
  | 'admin'           // Admin général
  | 'entrepreneur'    // Gestionnaire multi-chantiers
  | 'client_gestionnaire'  // Client avec droits gestion sur son chantier
  | 'architecte'      // MOA mandaté
  | 'collaborateur'   // Saisie terrain
  | 'client';         // Lecture seule
```

### 3.2 Chantier - Mis à jour

```typescript
interface Chantier {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  codePostal: string;

  // Acteurs
  clientId: string;              // Propriétaire
  entrepreneurId: string;        // Gestionnaire principal
  architecteId?: string;         // MOA si mandaté

  // Budget
  budgetPrevisionnel: number;    // Budget client
  devise: DeviseType;

  // Dates
  dateDebut: string;
  dateFinPrevue: string;
  dateFinReelle?: string;

  // Statut
  statut: 'en_cours' | 'suspendu' | 'termine';

  // Sécurité
  accesLibre: boolean;           // Visualisation sans mdp

  // Timestamps
  createdAt: string;
  updatedAt: string;
}
```

### 3.3 Employé (Personnel)

```typescript
interface Employe {
  id: string;
  nom: string;
  prenom: string;
  telephone: string;
  fonction: EmployeFonction;
  tauxJournalier: number;        // Salaire/jour en DNT
  entrepriseId: string;          // Entrepreneur propriétaire
  actif: boolean;
  createdAt: string;
}

type EmployeFonction =
  | 'chef_equipe'
  | 'macon'
  | 'electricien'
  | 'plombier'
  | 'peintre'
  | 'carreleur'
  | 'ferailleur'
  | 'coffreur'
  | 'manoeuvre'
  | 'conducteur'
  | 'autre';
```

### 3.4 Pointage

```typescript
interface Pointage {
  id: string;
  chantierId: string;
  employeId: string;
  date: string;                  // YYYY-MM-DD
  heureArrivee?: string;         // HH:mm
  heureDepart?: string;          // HH:mm
  statut: PointageStatut;
  commentaire?: string;
  saisieParId: string;           // Collaborateur ou gestionnaire
  createdAt: string;
}

type PointageStatut = 'present' | 'absent' | 'conge' | 'maladie' | 'retard';
```

### 3.5 Paiement Employé

```typescript
interface PaiementEmploye {
  id: string;
  employeId: string;
  chantierId: string;
  periode: string;               // YYYY-MM
  joursTravailes: number;
  montantBrut: number;
  deductions: number;
  montantNet: number;
  datePaiement?: string;
  statut: 'en_attente' | 'paye';
  createdAt: string;
}
```

### 3.6 Matériel

```typescript
interface Materiel {
  id: string;
  nom: string;
  type: MaterielType;
  proprietaire: 'entreprise' | 'location';
  coutJournalier?: number;       // Si location
  immatriculation?: string;      // Si véhicule
  entrepriseId: string;          // Propriétaire
  actif: boolean;
}

type MaterielType =
  | 'vehicule_utilitaire'
  | 'camion'
  | 'betonniere'
  | 'grue'
  | 'echafaudage'
  | 'outillage'
  | 'autre';
```

### 3.7 Utilisation Matériel

```typescript
interface UtilisationMateriel {
  id: string;
  materielId: string;
  chantierId: string;
  date: string;
  employeId?: string;
  deplacement: 'vehicule_perso' | 'vehicule_entreprise' | 'location';
  kilometrage?: number;
  fraisKm?: number;              // Indemnité km si véhicule perso
  coutLocation?: number;
  saisieParId: string;
  createdAt: string;
}
```

### 3.8 Lot de Travaux

```typescript
interface LotTravaux {
  id: string;
  chantierId: string;
  nom: string;
  description?: string;
  unite: Unite;
  quantitePrevue: number;
  prixUnitaire: number;          // Prix client par unité
  montantPrevu: number;          // quantitePrevue × prixUnitaire
  ordre: number;                 // Pour le tri d'affichage
  actif: boolean;
  createdAt: string;
}

type Unite = 'm2' | 'm3' | 'ml' | 'unite' | 'kg' | 'tonne' | 'forfait';

// Lots suggérés par défaut
const LOTS_DEFAUT = [
  { nom: 'Terrassement', unite: 'm3' },
  { nom: 'Fondations', unite: 'm3' },
  { nom: 'Dalle', unite: 'm2' },
  { nom: 'Poteaux', unite: 'unite' },
  { nom: 'Poutres', unite: 'ml' },
  { nom: 'Murs/Gros œuvre', unite: 'm2' },
  { nom: 'Toiture', unite: 'm2' },
  { nom: 'Cloisons', unite: 'm2' },
  { nom: 'Enduit', unite: 'm2' },
  { nom: 'Carrelage', unite: 'm2' },
  { nom: 'Électricité', unite: 'forfait' },
  { nom: 'Plomberie', unite: 'forfait' },
  { nom: 'Peinture', unite: 'm2' },
  { nom: 'Menuiserie', unite: 'unite' },
  { nom: 'Clôture', unite: 'ml' },
  { nom: 'Travaux supplémentaires', unite: 'forfait' }
];
```

### 3.9 Production (Métré quotidien)

```typescript
interface Production {
  id: string;
  chantierId: string;
  lotId: string;
  date: string;
  quantite: number;
  unite: Unite;
  description?: string;
  photosUrls?: string[];
  saisieParId: string;
  createdAt: string;
}
```

### 3.10 Facturation

```typescript
interface Facturation {
  id: string;
  chantierId: string;
  numero: string;                // FAC-2026-001
  date: string;
  periode: {
    debut: string;
    fin: string;
  };
  lignes: LigneFacturation[];
  montantHT: number;
  tva: number;
  montantTTC: number;
  statut: FacturationStatut;
  soumisLe?: string;
  valideLe?: string;
  valideParId?: string;
  commentaire?: string;
  createdAt: string;
}

interface LigneFacturation {
  lotId: string;
  lotNom: string;
  quantiteRealisee: number;      // Production cumulée
  quantiteFacturee: number;      // Déjà facturé avant
  quantiteAFacturer: number;     // Cette facture
  prixUnitaire: number;
  montant: number;
}

type FacturationStatut =
  | 'brouillon'      // En préparation
  | 'soumis'         // Envoyé au client
  | 'valide'         // Approuvé par client
  | 'refuse'         // Rejeté par client
  | 'paye';          // Paiement reçu
```

### 3.11 PV d'Avancement

```typescript
interface PVAvancement {
  id: string;
  chantierId: string;
  numero: number;                // PV n°1, n°2...
  date: string;
  periode: {
    debut: string;
    fin: string;
  };
  lots: LotAvancement[];
  avancementGlobal: number;      // Pourcentage global
  montantCumule: number;         // Total réalisé
  photosUrls: string[];
  statut: PVStatut;
  soumisLe?: string;
  valideLe?: string;
  valideParId?: string;
  commentaires?: string;
  createdAt: string;
}

interface LotAvancement {
  lotId: string;
  lotNom: string;
  quantitePrevue: number;
  quantiteRealisee: number;
  pourcentage: number;
  montant: number;
}

type PVStatut = 'brouillon' | 'soumis' | 'valide' | 'refuse';
```

### 3.12 Paiement Client

```typescript
interface PaiementClient {
  id: string;
  chantierId: string;
  facturationId?: string;        // Lié à une facture
  date: string;
  montant: number;
  modePaiement: 'virement' | 'cheque' | 'especes' | 'autre';
  reference?: string;
  commentaire?: string;
  createdAt: string;
}
```

---

## 4. DASHBOARDS PAR RÔLE

### 4.1 Dashboard ENTREPRENEUR

```
┌─────────────────────────────────────────────────────────────────┐
│  TABLEAU DE BORD ENTREPRENEUR                    Bonjour, Ahmed │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 SYNTHÈSE GLOBALE                                            │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ Chantiers  │ │ Personnel  │ │ À facturer │ │ Encaissé   │   │
│  │     5      │ │    28      │ │  45,000 DNT│ │ 180,000 DNT│   │
│  │   actifs   │ │  employés  │ │  en attente│ │  ce mois   │   │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘   │
│                                                                  │
│  📋 MES CHANTIERS                           [+ Nouveau chantier]│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Villa Dupont     │ 65% │ ████████████░░░░ │ 3 employés    │ │
│  │ Résidence Lac    │ 30% │ ██████░░░░░░░░░░ │ 8 employés    │ │
│  │ Entrepôt Zone X  │ 90% │ ██████████████░░ │ 5 employés    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  👷 POINTAGE DU JOUR                                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Présents: 24/28  │  Absents: 3  │  Retards: 1             │ │
│  │ Coût journalier estimé: 2,800 DNT                         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  💰 FACTURATION EN ATTENTE                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Villa Dupont    │ PV#4 soumis   │ 15,000 DNT │ ⏳ Attente  │ │
│  │ Résidence Lac   │ PV#2 validé   │ 30,000 DNT │ ✅ À payer  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📈 PRODUCTION AUJOURD'HUI                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Dalle: 45m²  │ Murs: 25m²  │ Carrelage: 60m²  │ ...       │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Dashboard CLIENT-GESTIONNAIRE

```
┌─────────────────────────────────────────────────────────────────┐
│  MON CHANTIER: Villa Dupont                    Bonjour, M. Dupont│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📊 AVANCEMENT GLOBAL                                           │
│  ████████████████████░░░░░░░░░░  65%                           │
│                                                                  │
│  💰 SITUATION FINANCIÈRE                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Budget prévu      │ 150,000 DNT                            │ │
│  │ Montant facturé   │  85,000 DNT (57%)                      │ │
│  │ Montant payé      │  70,000 DNT                            │ │
│  │ Reste à payer     │  15,000 DNT                            │ │
│  │ ──────────────────│────────────────────                    │ │
│  │ Facturable (PV)   │  12,500 DNT  [Voir détail]             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📋 AVANCEMENT PAR LOT                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Lot            │ Prévu  │ Réalisé │ %   │ Montant         │ │
│  │────────────────│────────│─────────│─────│─────────────────│ │
│  │ Fondations     │ 100m³  │ 100m³   │100% │ 15,000 DNT  ✓   │ │
│  │ Dalle          │ 120m²  │ 100m²   │ 83% │ 10,000 DNT      │ │
│  │ Murs           │ 200m²  │ 140m²   │ 70% │ 21,000 DNT      │ │
│  │ Toiture        │ 130m²  │   0m²   │  0% │      0 DNT      │ │
│  │ Carrelage      │ 150m²  │  45m²   │ 30% │  4,500 DNT      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📄 MES DEVIS                                   [+ Ajouter devis]│
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Carrelage - 3 devis comparés                               │ │
│  │ • Devis A: 12,000 DNT  │ • Devis B: 14,500 DNT            │ │
│  │ • Devis C: 11,800 DNT ✓ RETENU                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📸 PHOTOS D'AVANCEMENT              [Voir toutes les photos]   │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                               │
│  │ 📷  │ │ 📷  │ │ 📷  │ │ 📷  │  +12 photos                  │
│  │07/01│ │05/01│ │02/01│ │28/12│                               │
│  └─────┘ └─────┘ └─────┘ └─────┘                               │
│                                                                  │
│  ⏳ À VALIDER                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ PV Avancement #4 - Période: 01/01 au 07/01                 │ │
│  │ Montant: 12,500 DNT         [Voir] [✓ Valider] [✗ Refuser] │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Dashboard COLLABORATEUR

```
┌─────────────────────────────────────────────────────────────────┐
│  SAISIE TERRAIN - 08/01/2026                   Chantier: Villa  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  👷 POINTAGE DU JOUR                              [+ Pointer]   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ ✓ Ahmed Ben Ali      │ 08:00 │ Maçon        │ Présent      │ │
│  │ ✓ Mohamed Trabelsi   │ 08:15 │ Maçon        │ Présent      │ │
│  │ ✗ Sami Gharbi        │   -   │ Électricien  │ Absent       │ │
│  │ ⚠ Karim Bouazizi     │ 09:30 │ Chef équipe  │ Retard       │ │
│  └────────────────────────────────────────────────────────────┘ │
│  Résumé: 3 présents, 1 absent, 1 retard                         │
│                                                                  │
│  🚗 MATÉRIEL / DÉPLACEMENTS                       [+ Ajouter]   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Bétonnière (Location)      │ Sur site                      │ │
│  │ Véhicule Ahmed (Perso)     │ 45 km                         │ │
│  │ Camion location            │ Livraison matériaux           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📏 PRODUCTION DU JOUR                            [+ Saisir]    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Lot           │ Quantité  │ Unité │ Note                   │ │
│  │───────────────│───────────│───────│────────────────────────│ │
│  │ Dalle béton   │    15     │  m²   │ Zone cuisine           │ │
│  │ Murs parpaing │     8     │  m²   │ Façade nord            │ │
│  │ Ferraillage   │    45     │  kg   │ Poteaux P3, P4         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  📸 PHOTOS                                        [+ Ajouter]   │
│  ┌─────┐ ┌─────┐ ┌─────────────────────────────────────────┐   │
│  │ 📷  │ │ 📷  │ │  Glisser ou cliquer pour ajouter       │   │
│  └─────┘ └─────┘ └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. MODULES FONCTIONNELS

### 5.1 Module Pointage Personnel

**Fonctionnalités :**
- Liste des employés assignés au chantier
- Pointage arrivée/départ
- Gestion des statuts (présent, absent, congé, maladie, retard)
- Historique des pointages
- Calcul automatique des heures/jours travaillés

### 5.2 Module Paiement Personnel

**Fonctionnalités :**
- Calcul automatique : jours travaillés × taux journalier
- Gestion des déductions
- Historique des paiements
- Export pour comptabilité

### 5.3 Module Matériel

**Fonctionnalités :**
- Inventaire du matériel (propriété, location)
- Pointage utilisation quotidienne
- Suivi des déplacements (véhicule perso/entreprise/location)
- Calcul des coûts (location, indemnités km)

### 5.4 Module Production (Métré)

**Fonctionnalités :**
- Saisie quotidienne par lot
- Unités configurables par lot
- Photos associées à la production
- Cumul automatique
- Pourcentage d'avancement calculé

### 5.5 Module Lots et Prix

**Fonctionnalités :**
- Lots par défaut + lots personnalisés
- Définition des quantités prévues
- **Prix unitaire par lot** (pour facturation)
- Calcul automatique du montant par lot
- Suivi avancement vs prévu

### 5.6 Module Facturation

**Fonctionnalités :**
- Calcul automatique : quantité réalisée × prix unitaire
- Déduction des montants déjà facturés
- Workflow de validation client
- Historique des factures
- Suivi des paiements

### 5.7 Module PV d'Avancement

**Fonctionnalités :**
- Génération basée sur la production
- Photos obligatoires
- Workflow : Brouillon → Soumis → Validé/Refusé
- Export PDF
- Historique

### 5.8 Module Devis

**Fonctionnalités :**
- Upload de devis (PDF, images)
- Comparaison par lot
- Sélection du devis retenu
- Liaison avec les lots

---

## 6. WORKFLOWS

### 6.1 Workflow Inscription/Création de Compte

```
┌──────────────┐     ┌────────────────┐     ┌──────────────────┐
│ Gestionnaire │────▶│ Crée compte    │────▶│ Email invitation │
│ ou Client-G. │     │ (email, rôle)  │     │ envoyé           │
└──────────────┘     └────────────────┘     └──────────────────┘
                                                     │
                     ┌────────────────┐              ▼
                     │ Compte actif   │     ┌──────────────────┐
                     │                │◀────│ Utilisateur      │
                     │                │     │ complète profil  │
                     └────────────────┘     │ + mot de passe   │
                                            └──────────────────┘
```

### 6.2 Workflow Production → Facturation

```
┌────────────┐     ┌──────────────┐     ┌─────────────┐
│ Collab.    │────▶│ Production   │────▶│ Cumul auto  │
│ saisit     │     │ quotidienne  │     │ par lot     │
└────────────┘     └──────────────┘     └─────────────┘
                                               │
      ┌────────────────────────────────────────┘
      ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Entrepreneur│────▶│ Génère       │────▶│ Soumet au   │
│ vérifie     │     │ Facturation  │     │ client      │
└─────────────┘     └──────────────┘     └─────────────┘
                                               │
      ┌────────────────────────────────────────┘
      ▼
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│ Client      │────▶│ Valide ou    │────▶│ Paiement    │
│ reçoit      │     │ refuse       │     │             │
└─────────────┘     └──────────────┘     └─────────────┘
```

### 6.3 Workflow PV d'Avancement

```
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ Entrepreneur   │────▶│ Crée PV        │────▶│ Ajoute photos  │
│                │     │ (période)      │     │                │
└────────────────┘     └────────────────┘     └────────────────┘
                                                     │
                                                     ▼
┌────────────────┐     ┌────────────────┐     ┌────────────────┐
│ Validé         │◀────│ Client/MOA     │◀────│ Soumet au      │
│ → Facturable   │     │ examine        │     │ client         │
└────────────────┘     └────────────────┘     └────────────────┘
        │                     │
        │              ┌──────┴──────┐
        │              ▼             ▼
        │      ┌────────────┐ ┌────────────┐
        │      │ ✓ Valider  │ │ ✗ Refuser  │
        │      └────────────┘ └────────────┘
        │                            │
        │                            ▼
        │                   ┌────────────────┐
        │                   │ Entrepreneur   │
        │                   │ corrige        │
        │                   └────────────────┘
        ▼
┌────────────────┐
│ Génération     │
│ facture        │
└────────────────┘
```

---

## 7. ROADMAP DE DÉVELOPPEMENT

### PHASE 0 : NETTOYAGE ET REFACTORING (Pré-requis)
**Durée estimée : Sprint 1**

| Tâche | Priorité | Fichiers concernés |
|-------|----------|-------------------|
| Sécuriser authentification (hash + JWT) | 🔴 CRITIQUE | AuthContext, api.ts |
| Supprimer DashboardEnrichi (fusionner) | 🟠 HAUTE | Dashboard.tsx, DashboardEnrichi.tsx |
| Créer factory CRUD API | 🟠 HAUTE | services/api.ts → services/api/*.ts |
| Fusionner ChantierCard + ChantierListItem | 🟡 MOYEN | components/ |
| Fusionner ActorSelector variants | 🟡 MOYEN | components/ |
| Supprimer formatMontant dupliqué | 🟡 MOYEN | exportPdf.ts |

### PHASE 1 : SYSTÈME DE RÔLES ÉTENDU
**Durée estimée : Sprint 2**

| Tâche | Description |
|-------|-------------|
| 1.1 | Mise à jour interface User avec nouveaux rôles |
| 1.2 | Mise à jour ROLE_PERMISSIONS avec matrice complète |
| 1.3 | Ajout champ `fonction` et `telephone` au profil |
| 1.4 | Limite 15 comptes par chantier |
| 1.5 | Option accès libre/protégé par chantier |
| 1.6 | Formulaire inscription complet |

### PHASE 2 : MODULE PERSONNEL
**Durée estimée : Sprint 3**

| Tâche | Description |
|-------|-------------|
| 2.1 | Entité Employe + CRUD |
| 2.2 | Entité Pointage + formulaire saisie |
| 2.3 | Dashboard pointage quotidien |
| 2.4 | Historique et statistiques présence |
| 2.5 | Entité PaiementEmploye + calcul auto |
| 2.6 | Interface paiement et historique |

### PHASE 3 : MODULE MATÉRIEL
**Durée estimée : Sprint 4**

| Tâche | Description |
|-------|-------------|
| 3.1 | Entité Materiel + CRUD |
| 3.2 | Entité UtilisationMateriel |
| 3.3 | Formulaire pointage matériel quotidien |
| 3.4 | Gestion déplacements (perso/entreprise/location) |
| 3.5 | Calcul coûts et indemnités |

### PHASE 4 : MODULE PRODUCTION & LOTS
**Durée estimée : Sprint 5**

| Tâche | Description |
|-------|-------------|
| 4.1 | Entité LotTravaux + lots par défaut |
| 4.2 | Interface gestion lots par chantier |
| 4.3 | **Prix unitaire par lot** |
| 4.4 | Entité Production (métré) |
| 4.5 | Formulaire saisie production quotidienne |
| 4.6 | Calcul automatique avancement |
| 4.7 | Dashboard production par chantier |

### PHASE 5 : MODULE FACTURATION
**Durée estimée : Sprint 6**

| Tâche | Description |
|-------|-------------|
| 5.1 | Entité Facturation + lignes |
| 5.2 | **Calcul montant facturable** (quantité × prix unitaire) |
| 5.3 | Interface génération facture |
| 5.4 | Workflow validation client |
| 5.5 | Entité PaiementClient |
| 5.6 | Suivi paiements et encaissements |
| 5.7 | Export PDF facture |

### PHASE 6 : MODULE PV AVANCEMENT
**Durée estimée : Sprint 7**

| Tâche | Description |
|-------|-------------|
| 6.1 | Entité PVAvancement |
| 6.2 | Génération PV depuis production |
| 6.3 | Upload photos avancement |
| 6.4 | Workflow validation (soumis → validé/refusé) |
| 6.5 | Liaison PV → Facturation |
| 6.6 | Export PDF PV |

### PHASE 7 : DASHBOARDS PAR RÔLE
**Durée estimée : Sprint 8**

| Tâche | Description |
|-------|-------------|
| 7.1 | Dashboard Entrepreneur (multi-chantiers, personnel, facturation) |
| 7.2 | Dashboard Client-Gestionnaire (avancement, finance, validation) |
| 7.3 | Dashboard Collaborateur (saisie terrain) |
| 7.4 | Dashboard Client lecture seule |
| 7.5 | Dashboard Architecte/MOA |

### PHASE 8 : AMÉLIORATIONS
**Durée estimée : Sprint 9+**

| Tâche | Description |
|-------|-------------|
| 8.1 | Notifications push/email |
| 8.2 | Mode hors-ligne (PWA) |
| 8.3 | Rapports et exports avancés |
| 8.4 | Historique et audit trail |
| 8.5 | Intégration comptabilité |

---

## ANNEXES

### A. Schéma Base de Données

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │────▶│  Chantier   │◀────│   Client    │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │  LotTravaux │   │   Employe   │   │  Materiel   │
  └─────────────┘   └─────────────┘   └─────────────┘
         │                 │                 │
         ▼                 ▼                 ▼
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │ Production  │   │  Pointage   │   │ Utilisation │
  └─────────────┘   └─────────────┘   └─────────────┘
         │                 │
         ▼                 ▼
  ┌─────────────┐   ┌─────────────┐
  │PVAvancement │   │  Paiement   │
  └─────────────┘   │  Employe    │
         │          └─────────────┘
         ▼
  ┌─────────────┐     ┌─────────────┐
  │ Facturation │────▶│  Paiement   │
  └─────────────┘     │   Client    │
                      └─────────────┘
```

### B. Glossaire

| Terme | Définition |
|-------|------------|
| **PV** | Procès-Verbal (d'avancement) |
| **MOA** | Maîtrise d'Ouvrage (client/propriétaire) |
| **MOE** | Maîtrise d'Œuvre (architecte/BET) |
| **Lot** | Catégorie de travaux (fondations, toiture, etc.) |
| **Métré** | Mesure des quantités réalisées |
| **DNT** | Dinar Tunisien |

---

**Document maintenu par** : Équipe MonChantier
**Version** : 2.0
**Dernière mise à jour** : 8 janvier 2026
