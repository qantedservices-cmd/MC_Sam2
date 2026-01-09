// ============ CONTACTS / MANDATAIRES ============
export interface Contact {
  id: string;
  nom: string;
  prenom: string;
  fonction: string;
  email: string;
  telephone: string;
}

// ============ BASE ACTOR INTERFACE ============
export interface BaseActor {
  id: string;
  nom: string;
  adresse: string;
  email: string;
  telephone: string;
  contacts: Contact[];
}

// ============ ACTOR TYPES ============
export interface Client extends BaseActor {}

export interface MOA extends BaseActor {}

export interface MOE extends BaseActor {}

export interface Entreprise extends BaseActor {
  siret: string;
  specialites: string[];
}

export type ActorType = 'client' | 'moa' | 'moe' | 'entreprise';

export type Actor = Client | MOA | MOE | Entreprise;

export const ACTOR_TYPE_LABELS: Record<ActorType, string> = {
  client: 'Client',
  moa: 'Maître d\'ouvrage',
  moe: 'Maître d\'oeuvre',
  entreprise: 'Entreprise'
} as const;

// ============ SPECIALITES ENTREPRISE ============
export const SPECIALITES_ENTREPRISE = {
  maconnerie: 'Maçonnerie',
  gros_oeuvre: 'Gros oeuvre',
  menuiserie: 'Menuiserie',
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  peinture: 'Peinture',
  carrelage: 'Carrelage',
  couverture: 'Couverture',
  chauffage: 'Chauffage',
  isolation: 'Isolation',
  demolition: 'Démolition',
  terrassement: 'Terrassement',
  ravalement: 'Ravalement'
} as const;

export type SpecialiteEntreprise = keyof typeof SPECIALITES_ENTREPRISE;

// ============ CATEGORIES HIERARCHIQUES ============
export interface Categorie {
  id: string;
  nom: string;
  parentId: string | null;
}

export interface CategorieTree extends Categorie {
  children: CategorieTree[];
}

// ============ CHANTIER ============
export interface Chantier {
  id: string;
  nom: string;
  adresse: string;
  budgetPrevisionnel: number;
  statut: 'en_cours' | 'termine' | 'suspendu';
  dateCreation: string;
  devise: DeviseType;
  // Acteurs lies
  clientId?: string | null;
  moaId?: string | null;
  moeId?: string | null;
  entrepriseIds?: string[];
}

export type StatutChantier = Chantier['statut'];

export const STATUTS_CHANTIER: Record<StatutChantier, string> = {
  en_cours: 'En cours',
  termine: 'Terminé',
  suspendu: 'Suspendu'
} as const;

// ============ TYPES ENTREES FINANCIERES ============
export type EntryType = 'depense' | 'devis' | 'transfert';

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  depense: 'Depense',
  devis: 'Devis',
  transfert: 'Transfert'
} as const;

// ============ DEPENSE ============
export interface Depense {
  id: string;
  chantierId: string;
  description: string;
  montant: number;
  date: string;
  categorieId: string;
  // Nouveaux champs pour import Forms
  payeur?: string;
  beneficiaire?: string;
  commentaire?: string;
  photosUrls?: string[];
  validated?: boolean;
}

// ============ DEVIS ============
export type StatutDevis = 'en_attente' | 'accepte' | 'refuse';

export const STATUTS_DEVIS: Record<StatutDevis, string> = {
  en_attente: 'En attente',
  accepte: 'Accepte',
  refuse: 'Refuse'
} as const;

export interface Devis {
  id: string;
  chantierId: string;
  categorieId: string;
  montant: number;
  date: string;
  fournisseur: string;
  description?: string;
  commentaire?: string;
  photosUrls?: string[];
  statut: StatutDevis;
}

// ============ TRANSFERT BUDGET ============
export type DeviseType = 'DNT' | 'EUR' | 'USD';

export const DEVISES: Record<DeviseType, string> = {
  DNT: 'Dinar Tunisien',
  EUR: 'Euro',
  USD: 'Dollar US'
} as const;

export interface TransfertBudget {
  id: string;
  date: string;
  source: string;
  destination: string;
  montant: number;
  devise: DeviseType;
  tauxChange?: number;
  montantConverti?: number;
  commentaire?: string;
  photoUrl?: string;
}

// ============ CONFIGURATION ============
export interface ExchangeRates {
  EUR: number;  // 1 EUR = X DNT
  USD: number;  // 1 USD = X DNT
  DNT: number;  // Toujours 1
}

export interface AppConfig {
  id: string;
  deviseAffichage: DeviseType;
  tauxChange: ExchangeRates;
  lastUpdated: string;
}

// ============ LOTS FORMS (Mapping) ============
export const LOTS_FORMS_MAPPING: Record<string, string> = {
  'Materiel': 'materiel',
  'Matériel': 'materiel',
  'Mounir (Tvx)': 'main_oeuvre',
  'Menuiserie': 'travaux_menuiserie',
  'Peinture': 'travaux_peinture',
  'Carrelage': 'travaux_carrelage',
  'Dalles': 'travaux_maconnerie',
  'Hdid': 'materiel_fournitures',
  'Aluminium': 'travaux_menuiserie',
  'Marbre': 'travaux_carrelage',
  'Meubles': 'materiel_equipement',
  'Electricite': 'travaux_electricite',
  'Électricité': 'travaux_electricite',
  'Peinture Matériel': 'materiel_fournitures'
} as const;

// ============ CHANTIERS FORMS (Mapping) ============
export const CHANTIERS_FORMS_MAPPING: Record<string, string> = {
  'Samir Maison': 'samir_maison',
  'Commun Garages': 'commun_garages',
  'Wissem Housh': 'wissem_housh',
  'Commun Autre': 'commun_autre',
  'Samir Autre': 'samir_autre',
  'Wissem Autre': 'wissem_autre',
  'Anis & Samiha': 'anis_samiha'
} as const;

// ============ LEGACY SUPPORT ============
// Kept for backward compatibility during migration
export type CategorieDepenseLegacy = 'main_oeuvre' | 'materiaux' | 'location' | 'sous_traitance' | 'menuiserie' | 'autre';

export const CATEGORIES_DEPENSE_LEGACY: Record<CategorieDepenseLegacy, string> = {
  main_oeuvre: "Main d'oeuvre",
  materiaux: 'Matériaux',
  location: 'Location',
  sous_traitance: 'Sous-traitance',
  menuiserie: 'Menuiserie',
  autre: 'Autre'
} as const;

// ============ AUTHENTIFICATION ============
export type UserRole =
  | 'admin'           // Admin general - acces total
  | 'entrepreneur'    // Proprietaire/gerant - multi-chantiers, couts internes
  | 'client_gestionnaire' // Client avec droits gestion sur son chantier
  | 'architecte'      // MOE/Architecte - lecture chantiers assignes
  | 'collaborateur'   // Employe terrain - saisie pointage/production
  | 'client';         // Client lecture seule

export const USER_ROLES: Record<UserRole, string> = {
  admin: 'Administrateur',
  entrepreneur: 'Entrepreneur',
  client_gestionnaire: 'Client Gestionnaire',
  architecte: 'Architecte / MOE',
  collaborateur: 'Collaborateur',
  client: 'Client'
} as const;

export interface User {
  id: string;
  email: string;
  password: string;
  nom: string;
  prenom: string;
  fonction?: string;      // Poste/fonction dans l'entreprise
  telephone?: string;     // Numero de telephone
  role: UserRole;
  chantierIds: string[];  // Chantiers accessibles (vide = tous pour admin/entrepreneur)
  actif: boolean;
  createdAt: string;
  createdBy?: string;     // ID de l'utilisateur qui a cree ce compte
}

export interface UserSession {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  fonction?: string;
  telephone?: string;
  role: UserRole;
  chantierIds: string[];
}

export interface RolePermissions {
  // Chantiers
  canViewAllChantiers: boolean;   // Voir tous les chantiers
  canCreateChantier: boolean;     // Creer un chantier
  canEditChantier: boolean;       // Modifier un chantier
  canDeleteChantier: boolean;     // Supprimer un chantier

  // Finances
  canCreateDepense: boolean;      // Creer des depenses
  canViewCoutsInternes: boolean;  // Voir couts internes (salaires, marges)
  canViewFacturation: boolean;    // Voir la facturation
  canCreateFacture: boolean;      // Creer des factures
  canValiderFacture: boolean;     // Valider/refuser factures (client)

  // Production
  canSaisiePointage: boolean;     // Saisir pointage personnel
  canSaisieProduction: boolean;   // Saisir production/metre
  canValiderPV: boolean;          // Valider PV avancement

  // Administration
  canImportData: boolean;         // Importer des donnees
  canManageUsers: boolean;        // Gerer les utilisateurs
  canManageChantierUsers: boolean; // Gerer les users de son chantier (limite 15)
}

// ============ MODULE PERSONNEL ============

export type TypeContrat = 'cdi' | 'cdd' | 'interim' | 'journalier';
export type StatutEmploye = 'actif' | 'inactif' | 'conge';

export const TYPES_CONTRAT: Record<TypeContrat, string> = {
  cdi: 'CDI',
  cdd: 'CDD',
  interim: 'Intérimaire',
  journalier: 'Journalier'
} as const;

export const STATUTS_EMPLOYE: Record<StatutEmploye, string> = {
  actif: 'Actif',
  inactif: 'Inactif',
  conge: 'En congé'
} as const;

export interface Employe {
  id: string;
  nom: string;
  prenom: string;
  telephone?: string;
  poste: string;                    // Ex: Maçon, Chef d'équipe, Conducteur
  typeContrat: TypeContrat;
  tauxJournalier: number;           // Salaire journalier en DNT
  tauxHeuresSupp?: number;          // Taux horaire heures supp (optionnel)
  chantierIds: string[];            // Chantiers assignés
  statut: StatutEmploye;
  dateEmbauche: string;
  dateFin?: string;                 // Pour CDD/interim
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

export type TypePointage = 'present' | 'absent' | 'demi_journee' | 'conge' | 'maladie';

export const TYPES_POINTAGE: Record<TypePointage, string> = {
  present: 'Présent',
  absent: 'Absent',
  demi_journee: 'Demi-journée',
  conge: 'Congé',
  maladie: 'Maladie'
} as const;

export interface Pointage {
  id: string;
  employeId: string;
  chantierId: string;
  date: string;                     // Format YYYY-MM-DD
  type: TypePointage;
  heuresSupp?: number;              // Heures supplémentaires
  notes?: string;
  createdAt: string;
  createdBy?: string;               // ID utilisateur qui a saisi
}

export type StatutPaiement = 'en_attente' | 'paye' | 'partiel';

export const STATUTS_PAIEMENT: Record<StatutPaiement, string> = {
  en_attente: 'En attente',
  paye: 'Payé',
  partiel: 'Partiel'
} as const;

export interface PaiementEmploye {
  id: string;
  employeId: string;
  chantierId: string;
  periode: string;                  // Format YYYY-MM (mois de paie)
  joursPresent: number;
  heuresSupp: number;
  montantBase: number;              // joursPresent * tauxJournalier
  montantHeuresSupp: number;
  montantTotal: number;
  statut: StatutPaiement;
  datePaiement?: string;
  notes?: string;
  createdAt: string;
}

// ============ MODULE MATERIEL ============

export type MaterielType =
  | 'vehicule_utilitaire'
  | 'camion'
  | 'betonniere'
  | 'grue'
  | 'echafaudage'
  | 'outillage'
  | 'autre';

export const TYPES_MATERIEL: Record<MaterielType, string> = {
  vehicule_utilitaire: 'Vehicule utilitaire',
  camion: 'Camion',
  betonniere: 'Betonniere',
  grue: 'Grue',
  echafaudage: 'Echafaudage',
  outillage: 'Outillage',
  autre: 'Autre'
} as const;

export type ProprietaireMateriel = 'entreprise' | 'location';

export const PROPRIETAIRES_MATERIEL: Record<ProprietaireMateriel, string> = {
  entreprise: 'Entreprise',
  location: 'Location'
} as const;

export interface Materiel {
  id: string;
  nom: string;
  type: MaterielType;
  proprietaire: ProprietaireMateriel;
  coutJournalier?: number;
  immatriculation?: string;
  description?: string;
  actif: boolean;
  createdAt: string;
}

export type TypeDeplacement = 'vehicule_perso' | 'vehicule_entreprise' | 'location';

export const TYPES_DEPLACEMENT: Record<TypeDeplacement, string> = {
  vehicule_perso: 'Vehicule personnel',
  vehicule_entreprise: 'Vehicule entreprise',
  location: 'Location'
} as const;

export interface UtilisationMateriel {
  id: string;
  materielId: string;
  chantierId: string;
  date: string;
  employeId?: string;
  typeDeplacement?: TypeDeplacement;
  kilometrage?: number;
  fraisKm?: number;
  coutLocation?: number;
  dureeHeures?: number;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}

// ============ MODULE PRODUCTION / AVANCEMENT ============

export type StatutTache = 'a_faire' | 'en_cours' | 'termine';

export const STATUTS_TACHE: Record<StatutTache, string> = {
  a_faire: 'A faire',
  en_cours: 'En cours',
  termine: 'Termine'
} as const;

export interface Tache {
  id: string;
  chantierId: string;
  titre: string;
  description?: string;
  categorieId?: string;
  ordre: number;
  statut: StatutTache;
  dateDebut?: string;
  dateFin?: string;
  quantitePrevue?: number;
  unite?: string;
  prixUnitaire?: number;
  createdAt: string;
}

export interface Production {
  id: string;
  tacheId: string;
  chantierId: string;
  date: string;
  quantiteRealisee: number;
  notes?: string;
  photosUrls?: string[];
  saisieParId?: string;
  valide: boolean;
  createdAt: string;
}

// ============ MODULE LOTS DE TRAVAUX ============

export type UniteMetrage = 'm2' | 'm3' | 'ml' | 'unite' | 'kg' | 'tonne' | 'forfait';

export const UNITES_METRAGE: Record<UniteMetrage, string> = {
  m2: 'm²',
  m3: 'm³',
  ml: 'ml',
  unite: 'unité',
  kg: 'kg',
  tonne: 'tonne',
  forfait: 'forfait'
} as const;

export interface LotTravaux {
  id: string;
  chantierId: string;
  nom: string;
  description?: string;
  unite: UniteMetrage;
  quantitePrevue: number;
  prixUnitaire: number;
  montantPrevu: number;           // quantitePrevue * prixUnitaire
  ordre: number;
  actif: boolean;
  createdAt: string;
}

// Lots suggérés par défaut
export const LOTS_DEFAUT = [
  { nom: 'Terrassement', unite: 'm3' as UniteMetrage },
  { nom: 'Fondations', unite: 'm3' as UniteMetrage },
  { nom: 'Dalle', unite: 'm2' as UniteMetrage },
  { nom: 'Poteaux', unite: 'unite' as UniteMetrage },
  { nom: 'Poutres', unite: 'ml' as UniteMetrage },
  { nom: 'Murs/Gros oeuvre', unite: 'm2' as UniteMetrage },
  { nom: 'Toiture', unite: 'm2' as UniteMetrage },
  { nom: 'Cloisons', unite: 'm2' as UniteMetrage },
  { nom: 'Enduit', unite: 'm2' as UniteMetrage },
  { nom: 'Carrelage', unite: 'm2' as UniteMetrage },
  { nom: 'Electricite', unite: 'forfait' as UniteMetrage },
  { nom: 'Plomberie', unite: 'forfait' as UniteMetrage },
  { nom: 'Peinture', unite: 'm2' as UniteMetrage },
  { nom: 'Menuiserie', unite: 'unite' as UniteMetrage },
  { nom: 'Cloture', unite: 'ml' as UniteMetrage },
  { nom: 'Travaux supplementaires', unite: 'forfait' as UniteMetrage }
] as const;

// ============ MODULE FACTURATION ============

export type StatutFacturation = 'brouillon' | 'soumis' | 'valide' | 'refuse' | 'paye';

export const STATUTS_FACTURATION: Record<StatutFacturation, string> = {
  brouillon: 'Brouillon',
  soumis: 'Soumis',
  valide: 'Validé',
  refuse: 'Refusé',
  paye: 'Payé'
} as const;

export interface LigneFacturation {
  lotId: string;
  lotNom: string;
  unite: UniteMetrage;
  quantiteRealisee: number;       // Production cumulée
  quantiteFacturee: number;       // Déjà facturé avant
  quantiteAFacturer: number;      // Cette facture
  prixUnitaire: number;
  montant: number;
}

export interface Facturation {
  id: string;
  chantierId: string;
  numero: string;                 // FAC-2026-001
  date: string;
  periodeDebut: string;
  periodeFin: string;
  lignes: LigneFacturation[];
  montantHT: number;
  tva: number;
  tauxTva: number;                // Ex: 19
  montantTTC: number;
  statut: StatutFacturation;
  soumisLe?: string;
  valideLe?: string;
  valideParId?: string;
  refuseLe?: string;
  motifRefus?: string;
  commentaire?: string;
  createdAt: string;
  createdBy?: string;
}

// ============ MODULE PV AVANCEMENT ============

export type StatutPV = 'brouillon' | 'soumis' | 'valide' | 'refuse';

export const STATUTS_PV: Record<StatutPV, string> = {
  brouillon: 'Brouillon',
  soumis: 'Soumis',
  valide: 'Validé',
  refuse: 'Refusé'
} as const;

export interface LotAvancement {
  lotId: string;
  lotNom: string;
  unite: UniteMetrage;
  quantitePrevue: number;
  quantiteRealisee: number;
  pourcentage: number;
  montant: number;
}

export interface PVAvancement {
  id: string;
  chantierId: string;
  numero: number;                 // PV n°1, n°2...
  date: string;
  periodeDebut: string;
  periodeFin: string;
  lots: LotAvancement[];
  avancementGlobal: number;       // Pourcentage global
  montantCumule: number;          // Total réalisé
  photosUrls: string[];
  statut: StatutPV;
  soumisLe?: string;
  valideLe?: string;
  valideParId?: string;
  refuseLe?: string;
  motifRefus?: string;
  commentaire?: string;
  createdAt: string;
  createdBy?: string;
}

// ============ PAIEMENT CLIENT ============

export type ModePaiement = 'virement' | 'cheque' | 'especes' | 'autre';

export const MODES_PAIEMENT: Record<ModePaiement, string> = {
  virement: 'Virement',
  cheque: 'Chèque',
  especes: 'Espèces',
  autre: 'Autre'
} as const;

export interface PaiementClient {
  id: string;
  chantierId: string;
  facturationId?: string;         // Lié à une facture
  date: string;
  montant: number;
  modePaiement: ModePaiement;
  reference?: string;
  commentaire?: string;
  createdAt: string;
  createdBy?: string;
}
