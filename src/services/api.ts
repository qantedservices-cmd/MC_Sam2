import type { Chantier, Depense, Client, MOA, MOE, Entreprise, Categorie, CategorieTree, Devis, TransfertBudget, AppConfig, User, UserSession } from '../types';
import { hashPassword, verifyPassword, generateToken, AUTH_TOKEN_KEY } from '../utils/crypto';
import { createCrudApi, createChantierFilteredCrudApi } from './crudFactory';

const API_URL = 'http://localhost:3001';

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
    passwordValid = await verifyPassword(password, user.password);
  } else {
    passwordValid = user.password === password;
    if (passwordValid) {
      const hashedPassword = await hashPassword(password);
      await fetch(`${API_URL}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: hashedPassword })
      });
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
