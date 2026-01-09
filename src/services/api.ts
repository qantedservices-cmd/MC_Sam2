import type { Chantier, Depense, Client, MOA, MOE, Entreprise, Categorie, CategorieTree, Devis, TransfertBudget, AppConfig, User, UserSession, Employe, Pointage, PaiementEmploye, Materiel, UtilisationMateriel, Tache, Production, LotTravaux, Facturation, PVAvancement, PaiementClient } from '../types';
import { hashPassword, verifyPassword, generateToken, AUTH_TOKEN_KEY } from '../utils/crypto';
import { createCrudApi, createChantierFilteredCrudApi } from './crudFactory';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Helper pour ajouter le token aux requetes (exporte pour utilisation future)
export function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

// ============ CRUD APIS VIA FACTORY ============

const chantiersApi = createCrudApi<Chantier>('chantiers', 'chantier');
const depensesApi = createChantierFilteredCrudApi<Depense>('depenses', 'depense');
const clientsApi = createCrudApi<Client>('clients', 'client');
const moasApi = createCrudApi<MOA>('moas', 'MOA');
const moesApi = createCrudApi<MOE>('moes', 'MOE');
const entreprisesApi = createCrudApi<Entreprise>('entreprises', 'entreprise');
const categoriesApi = createCrudApi<Categorie>('categories', 'categorie');
const devisApi = createChantierFilteredCrudApi<Devis>('devis', 'devis');
const transfertsApi = createCrudApi<TransfertBudget>('transferts', 'transfert');
const usersApi = createCrudApi<User>('users', 'utilisateur');
const employesApi = createCrudApi<Employe>('employes', 'employe');
const pointagesApi = createChantierFilteredCrudApi<Pointage>('pointages', 'pointage');
const paiementsEmployeApi = createChantierFilteredCrudApi<PaiementEmploye>('paiements-employes', 'paiement');
const materielsApi = createCrudApi<Materiel>('materiels', 'materiel');
const utilisationsMaterielApi = createChantierFilteredCrudApi<UtilisationMateriel>('utilisations-materiel', 'utilisation');
const tachesApi = createChantierFilteredCrudApi<Tache>('taches', 'tache');
const productionsApi = createChantierFilteredCrudApi<Production>('productions', 'production');
const lotsTravauxApi = createChantierFilteredCrudApi<LotTravaux>('lots-travaux', 'lot');
const facturationsApi = createChantierFilteredCrudApi<Facturation>('facturations', 'facturation');
const pvAvancementsApi = createChantierFilteredCrudApi<PVAvancement>('pv-avancements', 'PV');
const paiementsClientApi = createChantierFilteredCrudApi<PaiementClient>('paiements-client', 'paiement');

// ============ CHANTIERS ============

export const getChantiers = chantiersApi.getAll;
export const getChantier = chantiersApi.getById;
export const createChantier = chantiersApi.create;
export const updateChantier = chantiersApi.update;
export const deleteChantier = chantiersApi.delete;

// ============ DEPENSES ============

export async function getDepenses(chantierId?: string): Promise<Depense[]> {
  return chantierId ? depensesApi.getByChantier(chantierId) : depensesApi.getAll();
}
export const getDepense = depensesApi.getById;
export const createDepense = depensesApi.create;
export const updateDepense = depensesApi.update;
export const deleteDepense = depensesApi.delete;
export const deleteDepensesByChantier = depensesApi.deleteByChantier;

// ============ CLIENTS ============

export const getClients = clientsApi.getAll;
export const getClient = clientsApi.getById;
export const createClient = clientsApi.create;
export const updateClient = clientsApi.update;
export const deleteClient = clientsApi.delete;

// ============ MOA (Maitre d'Ouvrage) ============

export const getMoas = moasApi.getAll;
export const getMoa = moasApi.getById;
export const createMoa = moasApi.create;
export const updateMoa = moasApi.update;
export const deleteMoa = moasApi.delete;

// ============ MOE (Maitre d'Oeuvre) ============

export const getMoes = moesApi.getAll;
export const getMoe = moesApi.getById;
export const createMoe = moesApi.create;
export const updateMoe = moesApi.update;
export const deleteMoe = moesApi.delete;

// ============ ENTREPRISES ============

export const getEntreprises = entreprisesApi.getAll;
export const getEntreprise = entreprisesApi.getById;
export const createEntreprise = entreprisesApi.create;
export const updateEntreprise = entreprisesApi.update;
export const deleteEntreprise = entreprisesApi.delete;

// ============ CATEGORIES ============

export const getCategories = categoriesApi.getAll;

export async function getCategoriesTree(): Promise<CategorieTree[]> {
  const categories = await getCategories();
  const rootCategories = categories.filter(c => c.parentId === null);
  return rootCategories.map(root => ({
    ...root,
    children: categories
      .filter(c => c.parentId === root.id)
      .map(child => ({ ...child, children: [] }))
  }));
}

export function getCategoryLabel(categories: Categorie[], categorieId: string): string {
  const category = categories.find(c => c.id === categorieId);
  if (!category) return categorieId;
  if (category.parentId) {
    const parent = categories.find(c => c.id === category.parentId);
    if (parent) return `${parent.nom} > ${category.nom}`;
  }
  return category.nom;
}

// ============ UTILITAIRES ACTEURS ============

export async function getChantierActors(chantier: Chantier): Promise<{
  client: Client | null;
  moa: MOA | null;
  moe: MOE | null;
  entreprises: Entreprise[];
}> {
  const [client, moa, moe, entreprises] = await Promise.all([
    chantier.clientId ? getClient(chantier.clientId).catch(() => null) : Promise.resolve(null),
    chantier.moaId ? getMoa(chantier.moaId).catch(() => null) : Promise.resolve(null),
    chantier.moeId ? getMoe(chantier.moeId).catch(() => null) : Promise.resolve(null),
    chantier.entrepriseIds && chantier.entrepriseIds.length > 0
      ? Promise.all(chantier.entrepriseIds.map(id => getEntreprise(id).catch(() => null)))
          .then(results => results.filter((e): e is Entreprise => e !== null))
      : Promise.resolve([])
  ]);
  return { client, moa, moe, entreprises };
}

// ============ DEVIS ============

export async function getDevis(chantierId?: string): Promise<Devis[]> {
  return chantierId ? devisApi.getByChantier(chantierId) : devisApi.getAll();
}
export const getDevisById = devisApi.getById;
export const createDevis = devisApi.create;
export const updateDevis = devisApi.update;
export const deleteDevis = devisApi.delete;

// ============ TRANSFERTS BUDGET ============

export const getTransferts = transfertsApi.getAll;
export const getTransfert = transfertsApi.getById;
export const createTransfert = transfertsApi.create;
export const updateTransfert = transfertsApi.update;
export const deleteTransfert = transfertsApi.delete;

// ============ CONFIGURATION ============

export async function getConfig(): Promise<AppConfig> {
  const response = await fetch(`${API_URL}/config`);
  if (!response.ok) {
    throw new Error('Erreur lors de la recuperation de la configuration');
  }
  return response.json();
}

export async function updateConfig(config: Partial<AppConfig>): Promise<AppConfig> {
  const response = await fetch(`${API_URL}/config`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la mise a jour de la configuration');
  }
  return response.json();
}

// ============ IMPORT BULK ============

export interface ImportResult {
  depenses: number;
  devis: number;
  transferts: number;
  errors: string[];
}

export async function importBulkDepenses(depenses: Omit<Depense, 'id'>[]): Promise<Depense[]> {
  const results: Depense[] = [];
  for (const depense of depenses) {
    try {
      const created = await createDepense(depense);
      results.push(created);
    } catch (error) {
      console.error('Erreur import depense:', error);
    }
  }
  return results;
}

export async function importBulkDevis(devisList: Omit<Devis, 'id'>[]): Promise<Devis[]> {
  const results: Devis[] = [];
  for (const devis of devisList) {
    try {
      const created = await createDevis(devis);
      results.push(created);
    } catch (error) {
      console.error('Erreur import devis:', error);
    }
  }
  return results;
}

export async function importBulkTransferts(transferts: Omit<TransfertBudget, 'id'>[]): Promise<TransfertBudget[]> {
  const results: TransfertBudget[] = [];
  for (const transfert of transferts) {
    try {
      const created = await createTransfert(transfert);
      results.push(created);
    } catch (error) {
      console.error('Erreur import transfert:', error);
    }
  }
  return results;
}

// ============ STATISTIQUES DASHBOARD ============

export interface DashboardStats {
  totalDepenses: number;
  totalDevis: number;
  totalTransferts: number;
  depensesParChantier: { chantierId: string; chantierNom: string; total: number }[];
  depensesParCategorie: { categorieId: string; categorieNom: string; total: number }[];
  depensesParMois: { mois: string; total: number }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [chantiers, depenses, devis, transferts, categories] = await Promise.all([
    getChantiers(),
    getDepenses(),
    getDevis(),
    getTransferts(),
    getCategories()
  ]);

  const totalDepenses = depenses.reduce((sum, d) => sum + d.montant, 0);
  const totalDevis = devis.reduce((sum, d) => sum + d.montant, 0);
  const totalTransferts = transferts.reduce((sum, t) => sum + (t.montantConverti || t.montant), 0);

  // Depenses par chantier
  const depensesParChantierMap: Record<string, number> = {};
  depenses.forEach(d => {
    depensesParChantierMap[d.chantierId] = (depensesParChantierMap[d.chantierId] || 0) + d.montant;
  });
  const depensesParChantier = Object.entries(depensesParChantierMap)
    .map(([chantierId, total]) => {
      const chantier = chantiers.find(c => c.id === chantierId);
      return { chantierId, chantierNom: chantier?.nom || chantierId, total };
    })
    .sort((a, b) => b.total - a.total);

  // Depenses par categorie
  const depensesParCategorieMap: Record<string, number> = {};
  depenses.forEach(d => {
    depensesParCategorieMap[d.categorieId] = (depensesParCategorieMap[d.categorieId] || 0) + d.montant;
  });
  const depensesParCategorie = Object.entries(depensesParCategorieMap)
    .map(([categorieId, total]) => {
      const categorie = categories.find(c => c.id === categorieId);
      return { categorieId, categorieNom: categorie?.nom || categorieId, total };
    })
    .sort((a, b) => b.total - a.total);

  // Depenses par mois
  const depensesParMoisMap: Record<string, number> = {};
  depenses.forEach(d => {
    const mois = d.date.substring(0, 7);
    depensesParMoisMap[mois] = (depensesParMoisMap[mois] || 0) + d.montant;
  });
  const depensesParMois = Object.entries(depensesParMoisMap)
    .map(([mois, total]) => ({ mois, total }))
    .sort((a, b) => a.mois.localeCompare(b.mois));

  return {
    totalDepenses,
    totalDevis,
    totalTransferts,
    depensesParChantier,
    depensesParCategorie,
    depensesParMois
  };
}

// ============ AUTHENTIFICATION ============

export interface LoginResult {
  session: UserSession;
  token: string;
}

export async function login(email: string, password: string): Promise<LoginResult | null> {
  const response = await fetch(`${API_URL}/users?email=${encodeURIComponent(email)}`);
  if (!response.ok) {
    throw new Error('Erreur de connexion');
  }
  const users: User[] = await response.json();

  const user = users.find(u => u.actif);
  if (!user) {
    return null;
  }

  // Verifier le mot de passe (supporte hash et plaintext pour migration)
  const isHashedPassword = user.password.length === 64;
  let passwordValid = false;

  if (isHashedPassword) {
    try {
      passwordValid = await verifyPassword(password, user.password);
    } catch {
      // crypto.subtle non disponible (HTTP non-secure), comparaison impossible
      console.warn('Crypto API non disponible - utilisez HTTPS');
      passwordValid = false;
    }
  } else {
    passwordValid = user.password === password;
    if (passwordValid) {
      // Migration vers hash (seulement si crypto disponible)
      try {
        if (crypto.subtle) {
          const hashedPassword = await hashPassword(password);
          await fetch(`${API_URL}/users/${user.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: hashedPassword })
          });
        }
      } catch {
        // Ignorer l'erreur de hash, le login fonctionne quand même
        console.warn('Migration hash ignorée - crypto non disponible');
      }
    }
  }

  if (!passwordValid) {
    return null;
  }

  const token = generateToken(user.id);
  localStorage.setItem(AUTH_TOKEN_KEY, token);

  return {
    session: {
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      fonction: user.fonction,
      telephone: user.telephone,
      role: user.role,
      chantierIds: user.chantierIds
    },
    token
  };
}

export async function register(userData: {
  email: string;
  password: string;
  nom: string;
  prenom: string;
  telephone?: string;
  fonction?: string;
}): Promise<User> {
  const existing = await fetch(`${API_URL}/users?email=${encodeURIComponent(userData.email)}`);
  const existingUsers: User[] = await existing.json();
  if (existingUsers.length > 0) {
    throw new Error('Cet email est deja utilise');
  }

  const hashedPassword = await hashPassword(userData.password);

  const newUser: Omit<User, 'id'> = {
    email: userData.email,
    password: hashedPassword,
    nom: userData.nom,
    prenom: userData.prenom,
    telephone: userData.telephone,
    fonction: userData.fonction,
    role: 'client',
    chantierIds: [],
    actif: true,
    createdAt: new Date().toISOString().split('T')[0]
  };

  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newUser)
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la creation du compte');
  }
  return response.json();
}

export const getUsers = usersApi.getAll;
export const getUser = usersApi.getById;

export async function createUser(userData: Omit<User, 'id'>): Promise<User> {
  const existing = await fetch(`${API_URL}/users?email=${encodeURIComponent(userData.email)}`);
  const existingUsers: User[] = await existing.json();
  if (existingUsers.length > 0) {
    throw new Error('Cet email est deja utilise');
  }
  return usersApi.create(userData);
}

export const updateUser = usersApi.update;
export const deleteUser = usersApi.delete;

// ============ EMPLOYES ============

export const getEmployes = employesApi.getAll;
export const getEmploye = employesApi.getById;
export const createEmploye = employesApi.create;
export const updateEmploye = employesApi.update;
export const deleteEmploye = employesApi.delete;

export async function getEmployesByChantier(chantierId: string): Promise<Employe[]> {
  const employes = await getEmployes();
  return employes.filter(e => e.chantierIds.includes(chantierId));
}

// ============ POINTAGES ============

export async function getPointages(chantierId?: string): Promise<Pointage[]> {
  return chantierId ? pointagesApi.getByChantier(chantierId) : pointagesApi.getAll();
}
export const getPointage = pointagesApi.getById;
export const createPointage = pointagesApi.create;
export const updatePointage = pointagesApi.update;
export const deletePointage = pointagesApi.delete;

export async function getPointagesByDate(date: string, chantierId?: string): Promise<Pointage[]> {
  const pointages = await getPointages(chantierId);
  return pointages.filter(p => p.date === date);
}

export async function getPointagesByEmploye(employeId: string, periode?: string): Promise<Pointage[]> {
  const pointages = await pointagesApi.getAll(`employeId=${employeId}`);
  if (periode) {
    return pointages.filter(p => p.date.startsWith(periode));
  }
  return pointages;
}

// ============ PAIEMENTS EMPLOYES ============

export async function getPaiementsEmploye(chantierId?: string): Promise<PaiementEmploye[]> {
  return chantierId ? paiementsEmployeApi.getByChantier(chantierId) : paiementsEmployeApi.getAll();
}
export const getPaiementEmploye = paiementsEmployeApi.getById;
export const createPaiementEmploye = paiementsEmployeApi.create;
export const updatePaiementEmploye = paiementsEmployeApi.update;
export const deletePaiementEmploye = paiementsEmployeApi.delete;

export async function calculerPaiementEmploye(
  employeId: string,
  chantierId: string,
  periode: string
): Promise<Omit<PaiementEmploye, 'id'>> {
  const [employe, pointages] = await Promise.all([
    getEmploye(employeId),
    getPointagesByEmploye(employeId, periode)
  ]);

  const pointagesChantier = pointages.filter(p => p.chantierId === chantierId);

  let joursPresent = 0;
  let heuresSupp = 0;

  pointagesChantier.forEach(p => {
    if (p.type === 'present') joursPresent += 1;
    else if (p.type === 'demi_journee') joursPresent += 0.5;
    heuresSupp += p.heuresSupp || 0;
  });

  const montantBase = joursPresent * employe.tauxJournalier;
  const montantHeuresSupp = heuresSupp * (employe.tauxHeuresSupp || 0);

  return {
    employeId,
    chantierId,
    periode,
    joursPresent,
    heuresSupp,
    montantBase,
    montantHeuresSupp,
    montantTotal: montantBase + montantHeuresSupp,
    statut: 'en_attente',
    createdAt: new Date().toISOString().split('T')[0]
  };
}

// ============ MATERIELS ============

export const getMateriels = materielsApi.getAll;
export const getMateriel = materielsApi.getById;
export const createMateriel = materielsApi.create;
export const updateMateriel = materielsApi.update;
export const deleteMateriel = materielsApi.delete;

export async function getMaterielsActifs(): Promise<Materiel[]> {
  const materiels = await getMateriels();
  return materiels.filter(m => m.actif);
}

// ============ UTILISATIONS MATERIEL ============

export async function getUtilisationsMateriel(chantierId?: string): Promise<UtilisationMateriel[]> {
  return chantierId ? utilisationsMaterielApi.getByChantier(chantierId) : utilisationsMaterielApi.getAll();
}
export const createUtilisationMateriel = utilisationsMaterielApi.create;
export const updateUtilisationMateriel = utilisationsMaterielApi.update;
export const deleteUtilisationMateriel = utilisationsMaterielApi.delete;

export async function calculerCoutsMaterielMois(chantierId: string, periode: string): Promise<{
  coutLocation: number;
  coutKilometrage: number;
  total: number;
}> {
  const utilisations = await getUtilisationsMateriel(chantierId);
  const monthUtilisations = utilisations.filter(u => u.date.startsWith(periode));
  
  let coutLocation = 0;
  let coutKilometrage = 0;

  monthUtilisations.forEach(u => {
    coutLocation += u.coutLocation || 0;
    coutKilometrage += u.fraisKm || 0;
  });

  return {
    coutLocation,
    coutKilometrage,
    total: coutLocation + coutKilometrage
  };
}

// ============ TACHES ============

export async function getTaches(chantierId?: string): Promise<Tache[]> {
  return chantierId ? tachesApi.getByChantier(chantierId) : tachesApi.getAll();
}
export const getTache = tachesApi.getById;
export const createTache = tachesApi.create;
export const updateTache = tachesApi.update;
export const deleteTache = tachesApi.delete;

export async function getTachesByStatut(chantierId: string, statut: string): Promise<Tache[]> {
  const taches = await getTaches(chantierId);
  return taches.filter(t => t.statut === statut).sort((a, b) => a.ordre - b.ordre);
}

export async function reorderTaches(_chantierId: string, tacheIds: string[]): Promise<void> {
  const updates = tacheIds.map((id, index) =>
    updateTache(id, { ordre: index })
  );
  await Promise.all(updates);
}

// ============ PRODUCTIONS ============

export async function getProductions(chantierId?: string): Promise<Production[]> {
  return chantierId ? productionsApi.getByChantier(chantierId) : productionsApi.getAll();
}
export const getProduction = productionsApi.getById;
export const createProduction = productionsApi.create;
export const updateProduction = productionsApi.update;
export const deleteProduction = productionsApi.delete;

export async function getProductionsByTache(tacheId: string): Promise<Production[]> {
  const productions = await productionsApi.getAll();
  return productions.filter(p => p.tacheId === tacheId);
}

export async function getProductionsByDate(date: string, chantierId?: string): Promise<Production[]> {
  const productions = await getProductions(chantierId);
  return productions.filter(p => p.date === date);
}

export async function calculerAvancementTache(tacheId: string): Promise<{
  quantiteRealisee: number;
  pourcentage: number;
}> {
  const [tache, productions] = await Promise.all([
    getTache(tacheId),
    getProductionsByTache(tacheId)
  ]);

  const quantiteRealisee = productions.reduce((sum, p) => sum + p.quantiteRealisee, 0);
  const pourcentage = tache.quantitePrevue 
    ? Math.min(100, (quantiteRealisee / tache.quantitePrevue) * 100)
    : 0;

  return { quantiteRealisee, pourcentage };
}

export async function calculerAvancementChantier(chantierId: string): Promise<{
  tachesTotal: number;
  tachesTerminees: number;
  pourcentageGlobal: number;
  montantPrevu: number;
  montantRealise: number;
}> {
  const taches = await getTaches(chantierId);
  const tachesTotal = taches.length;
  const tachesTerminees = taches.filter(t => t.statut === 'termine').length;

  let montantPrevu = 0;
  let montantRealise = 0;

  for (const tache of taches) {
    if (tache.quantitePrevue && tache.prixUnitaire) {
      montantPrevu += tache.quantitePrevue * tache.prixUnitaire;
      const { quantiteRealisee } = await calculerAvancementTache(tache.id);
      montantRealise += quantiteRealisee * tache.prixUnitaire;
    }
  }

  const pourcentageGlobal = tachesTotal > 0 
    ? (tachesTerminees / tachesTotal) * 100 
    : 0;

  return {
    tachesTotal,
    tachesTerminees,
    pourcentageGlobal,
    montantPrevu,
    montantRealise
  };
}

// ============ LOTS DE TRAVAUX ============

export async function getLotsTravaux(chantierId?: string): Promise<LotTravaux[]> {
  const lots = chantierId ? await lotsTravauxApi.getByChantier(chantierId) : await lotsTravauxApi.getAll();
  return lots.sort((a, b) => a.ordre - b.ordre);
}
export const getLotTravaux = lotsTravauxApi.getById;
export const createLotTravaux = lotsTravauxApi.create;
export const updateLotTravaux = lotsTravauxApi.update;
export const deleteLotTravaux = lotsTravauxApi.delete;

export async function getLotsActifs(chantierId: string): Promise<LotTravaux[]> {
  const lots = await getLotsTravaux(chantierId);
  return lots.filter(l => l.actif);
}

// ============ FACTURATIONS ============

export async function getFacturations(chantierId?: string): Promise<Facturation[]> {
  return chantierId ? facturationsApi.getByChantier(chantierId) : facturationsApi.getAll();
}
export const getFacturation = facturationsApi.getById;
export const createFacturation = facturationsApi.create;
export const updateFacturation = facturationsApi.update;
export const deleteFacturation = facturationsApi.delete;

export async function genererNumeroFacture(chantierId: string): Promise<string> {
  const factures = await getFacturations(chantierId);
  const annee = new Date().getFullYear();
  const numero = factures.length + 1;
  return `FAC-${annee}-${String(numero).padStart(3, '0')}`;
}

export async function calculerMontantFacturable(chantierId: string): Promise<{
  lots: Array<{
    lotId: string;
    lotNom: string;
    unite: string;
    quantiteRealisee: number;
    quantiteFacturee: number;
    quantiteAFacturer: number;
    prixUnitaire: number;
    montant: number;
  }>;
  totalHT: number;
}> {
  const [lots, factures] = await Promise.all([
    getLotsActifs(chantierId),
    getFacturations(chantierId)
  ]);

  // Calculer quantités déjà facturées par lot
  const quantitesFacturees: Record<string, number> = {};
  factures.filter(f => f.statut !== 'brouillon' && f.statut !== 'refuse').forEach(f => {
    f.lignes.forEach(l => {
      quantitesFacturees[l.lotId] = (quantitesFacturees[l.lotId] || 0) + l.quantiteAFacturer;
    });
  });

  // Calculer quantités réalisées par lot (via taches liées)
  const quantitesRealisees: Record<string, number> = {};
  // Pour simplifier, on suppose que les productions sont liées aux lots via tacheId
  // Dans une vraie implémentation, il faudrait mapper tache -> lot

  const result = lots.map(lot => {
    const quantiteRealisee = quantitesRealisees[lot.id] || 0;
    const quantiteFacturee = quantitesFacturees[lot.id] || 0;
    const quantiteAFacturer = Math.max(0, quantiteRealisee - quantiteFacturee);

    return {
      lotId: lot.id,
      lotNom: lot.nom,
      unite: lot.unite,
      quantiteRealisee,
      quantiteFacturee,
      quantiteAFacturer,
      prixUnitaire: lot.prixUnitaire,
      montant: quantiteAFacturer * lot.prixUnitaire
    };
  });

  return {
    lots: result,
    totalHT: result.reduce((sum, l) => sum + l.montant, 0)
  };
}

// ============ PV AVANCEMENTS ============

export async function getPVAvancements(chantierId?: string): Promise<PVAvancement[]> {
  return chantierId ? pvAvancementsApi.getByChantier(chantierId) : pvAvancementsApi.getAll();
}
export const getPVAvancement = pvAvancementsApi.getById;
export const createPVAvancement = pvAvancementsApi.create;
export const updatePVAvancement = pvAvancementsApi.update;
export const deletePVAvancement = pvAvancementsApi.delete;

export async function genererNumeroPV(chantierId: string): Promise<number> {
  const pvs = await getPVAvancements(chantierId);
  return pvs.length + 1;
}

// ============ PAIEMENTS CLIENT ============

export async function getPaiementsClient(chantierId?: string): Promise<PaiementClient[]> {
  return chantierId ? paiementsClientApi.getByChantier(chantierId) : paiementsClientApi.getAll();
}
export const getPaiementClient = paiementsClientApi.getById;
export const createPaiementClient = paiementsClientApi.create;
export const updatePaiementClient = paiementsClientApi.update;
export const deletePaiementClient = paiementsClientApi.delete;

export async function calculerSituationFinanciere(chantierId: string): Promise<{
  budgetPrevu: number;
  montantFacture: number;
  montantPaye: number;
  resteAPayer: number;
  montantFacturable: number;
}> {
  const [chantier, factures, paiements] = await Promise.all([
    getChantier(chantierId),
    getFacturations(chantierId),
    getPaiementsClient(chantierId)
  ]);

  const montantFacture = factures
    .filter(f => f.statut !== 'brouillon' && f.statut !== 'refuse')
    .reduce((sum, f) => sum + f.montantTTC, 0);

  const montantPaye = paiements.reduce((sum, p) => sum + p.montant, 0);

  const { totalHT } = await calculerMontantFacturable(chantierId);

  return {
    budgetPrevu: chantier.budgetPrevisionnel,
    montantFacture,
    montantPaye,
    resteAPayer: montantFacture - montantPaye,
    montantFacturable: totalHT
  };
}
