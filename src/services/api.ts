import type { Chantier, Depense, Client, MOA, MOE, Entreprise, Categorie, CategorieTree, Devis, TransfertBudget, AppConfig, User, UserSession } from '../types';

const API_URL = 'http://localhost:3001';

// ============ CHANTIERS ============

export async function getChantiers(): Promise<Chantier[]> {
  const response = await fetch(`${API_URL}/chantiers`);
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des chantiers');
  }
  return response.json();
}

export async function getChantier(id: string): Promise<Chantier> {
  const response = await fetch(`${API_URL}/chantiers/${id}`);
  if (!response.ok) {
    throw new Error('Chantier non trouvé');
  }
  return response.json();
}

export async function createChantier(chantier: Omit<Chantier, 'id'>): Promise<Chantier> {
  const response = await fetch(`${API_URL}/chantiers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(chantier),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la création du chantier');
  }
  return response.json();
}

export async function updateChantier(id: string, chantier: Partial<Chantier>): Promise<Chantier> {
  const response = await fetch(`${API_URL}/chantiers/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(chantier),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la mise à jour du chantier');
  }
  return response.json();
}

export async function deleteChantier(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/chantiers/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la suppression du chantier');
  }
}

// ============ DEPENSES ============

export async function getDepenses(chantierId?: string): Promise<Depense[]> {
  const url = chantierId
    ? `${API_URL}/depenses?chantierId=${chantierId}`
    : `${API_URL}/depenses`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des dépenses');
  }
  return response.json();
}

export async function getDepense(id: string): Promise<Depense> {
  const response = await fetch(`${API_URL}/depenses/${id}`);
  if (!response.ok) {
    throw new Error('Dépense non trouvée');
  }
  return response.json();
}

export async function createDepense(depense: Omit<Depense, 'id'>): Promise<Depense> {
  const response = await fetch(`${API_URL}/depenses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(depense),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la création de la dépense');
  }
  return response.json();
}

export async function updateDepense(id: string, depense: Partial<Depense>): Promise<Depense> {
  const response = await fetch(`${API_URL}/depenses/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(depense),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la mise à jour de la dépense');
  }
  return response.json();
}

export async function deleteDepense(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/depenses/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la suppression de la dépense');
  }
}

export async function deleteDepensesByChantier(chantierId: string): Promise<void> {
  const depenses = await getDepenses(chantierId);
  await Promise.all(depenses.map(d => deleteDepense(d.id)));
}

// ============ CLIENTS ============

export async function getClients(): Promise<Client[]> {
  const response = await fetch(`${API_URL}/clients`);
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des clients');
  }
  return response.json();
}

export async function getClient(id: string): Promise<Client> {
  const response = await fetch(`${API_URL}/clients/${id}`);
  if (!response.ok) {
    throw new Error('Client non trouvé');
  }
  return response.json();
}

export async function createClient(client: Omit<Client, 'id'>): Promise<Client> {
  const response = await fetch(`${API_URL}/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(client),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la création du client');
  }
  return response.json();
}

export async function updateClient(id: string, client: Partial<Client>): Promise<Client> {
  const response = await fetch(`${API_URL}/clients/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(client),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la mise à jour du client');
  }
  return response.json();
}

export async function deleteClient(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/clients/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la suppression du client');
  }
}

// ============ MOA (Maître d'Ouvrage) ============

export async function getMoas(): Promise<MOA[]> {
  const response = await fetch(`${API_URL}/moas`);
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des MOA');
  }
  return response.json();
}

export async function getMoa(id: string): Promise<MOA> {
  const response = await fetch(`${API_URL}/moas/${id}`);
  if (!response.ok) {
    throw new Error('MOA non trouvé');
  }
  return response.json();
}

export async function createMoa(moa: Omit<MOA, 'id'>): Promise<MOA> {
  const response = await fetch(`${API_URL}/moas`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(moa),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la création du MOA');
  }
  return response.json();
}

export async function updateMoa(id: string, moa: Partial<MOA>): Promise<MOA> {
  const response = await fetch(`${API_URL}/moas/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(moa),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la mise à jour du MOA');
  }
  return response.json();
}

export async function deleteMoa(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/moas/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la suppression du MOA');
  }
}

// ============ MOE (Maître d'Oeuvre) ============

export async function getMoes(): Promise<MOE[]> {
  const response = await fetch(`${API_URL}/moes`);
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des MOE');
  }
  return response.json();
}

export async function getMoe(id: string): Promise<MOE> {
  const response = await fetch(`${API_URL}/moes/${id}`);
  if (!response.ok) {
    throw new Error('MOE non trouvé');
  }
  return response.json();
}

export async function createMoe(moe: Omit<MOE, 'id'>): Promise<MOE> {
  const response = await fetch(`${API_URL}/moes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(moe),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la création du MOE');
  }
  return response.json();
}

export async function updateMoe(id: string, moe: Partial<MOE>): Promise<MOE> {
  const response = await fetch(`${API_URL}/moes/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(moe),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la mise à jour du MOE');
  }
  return response.json();
}

export async function deleteMoe(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/moes/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la suppression du MOE');
  }
}

// ============ ENTREPRISES ============

export async function getEntreprises(): Promise<Entreprise[]> {
  const response = await fetch(`${API_URL}/entreprises`);
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des entreprises');
  }
  return response.json();
}

export async function getEntreprise(id: string): Promise<Entreprise> {
  const response = await fetch(`${API_URL}/entreprises/${id}`);
  if (!response.ok) {
    throw new Error('Entreprise non trouvée');
  }
  return response.json();
}

export async function createEntreprise(entreprise: Omit<Entreprise, 'id'>): Promise<Entreprise> {
  const response = await fetch(`${API_URL}/entreprises`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entreprise),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la création de l\'entreprise');
  }
  return response.json();
}

export async function updateEntreprise(id: string, entreprise: Partial<Entreprise>): Promise<Entreprise> {
  const response = await fetch(`${API_URL}/entreprises/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(entreprise),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la mise à jour de l\'entreprise');
  }
  return response.json();
}

export async function deleteEntreprise(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/entreprises/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la suppression de l\'entreprise');
  }
}

// ============ CATEGORIES ============

export async function getCategories(): Promise<Categorie[]> {
  const response = await fetch(`${API_URL}/categories`);
  if (!response.ok) {
    throw new Error('Erreur lors de la récupération des catégories');
  }
  return response.json();
}

export async function getCategoriesTree(): Promise<CategorieTree[]> {
  const categories = await getCategories();

  // Build tree structure
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
    if (parent) {
      return `${parent.nom} > ${category.nom}`;
    }
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
  const url = chantierId
    ? `${API_URL}/devis?chantierId=${chantierId}`
    : `${API_URL}/devis`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Erreur lors de la recuperation des devis');
  }
  return response.json();
}

export async function getDevisById(id: string): Promise<Devis> {
  const response = await fetch(`${API_URL}/devis/${id}`);
  if (!response.ok) {
    throw new Error('Devis non trouve');
  }
  return response.json();
}

export async function createDevis(devis: Omit<Devis, 'id'>): Promise<Devis> {
  const response = await fetch(`${API_URL}/devis`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(devis),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la creation du devis');
  }
  return response.json();
}

export async function updateDevis(id: string, devis: Partial<Devis>): Promise<Devis> {
  const response = await fetch(`${API_URL}/devis/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(devis),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la mise a jour du devis');
  }
  return response.json();
}

export async function deleteDevis(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/devis/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la suppression du devis');
  }
}

// ============ TRANSFERTS BUDGET ============

export async function getTransferts(): Promise<TransfertBudget[]> {
  const response = await fetch(`${API_URL}/transferts`);
  if (!response.ok) {
    throw new Error('Erreur lors de la recuperation des transferts');
  }
  return response.json();
}

export async function getTransfert(id: string): Promise<TransfertBudget> {
  const response = await fetch(`${API_URL}/transferts/${id}`);
  if (!response.ok) {
    throw new Error('Transfert non trouve');
  }
  return response.json();
}

export async function createTransfert(transfert: Omit<TransfertBudget, 'id'>): Promise<TransfertBudget> {
  const response = await fetch(`${API_URL}/transferts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transfert),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la creation du transfert');
  }
  return response.json();
}

export async function updateTransfert(id: string, transfert: Partial<TransfertBudget>): Promise<TransfertBudget> {
  const response = await fetch(`${API_URL}/transferts/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(transfert),
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la mise a jour du transfert');
  }
  return response.json();
}

export async function deleteTransfert(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/transferts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la suppression du transfert');
  }
}

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
    headers: {
      'Content-Type': 'application/json',
    },
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

  // Total depenses
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
    const mois = d.date.substring(0, 7); // YYYY-MM
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

export async function login(email: string, password: string): Promise<UserSession | null> {
  const response = await fetch(`${API_URL}/users?email=${encodeURIComponent(email)}`);
  if (!response.ok) {
    throw new Error('Erreur de connexion');
  }
  const users: User[] = await response.json();
  const user = users.find(u => u.password === password && u.actif);

  if (!user) {
    return null;
  }

  // Return session without password
  return {
    id: user.id,
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role,
    chantierIds: user.chantierIds
  };
}

export async function register(userData: {
  email: string;
  password: string;
  nom: string;
  prenom: string;
}): Promise<User> {
  // Check if email already exists
  const existing = await fetch(`${API_URL}/users?email=${encodeURIComponent(userData.email)}`);
  const existingUsers: User[] = await existing.json();
  if (existingUsers.length > 0) {
    throw new Error('Cet email est deja utilise');
  }

  const newUser: Omit<User, 'id'> = {
    ...userData,
    role: 'lecteur',
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

export async function getUsers(): Promise<User[]> {
  const response = await fetch(`${API_URL}/users`);
  if (!response.ok) {
    throw new Error('Erreur lors de la recuperation des utilisateurs');
  }
  return response.json();
}

export async function getUser(id: string): Promise<User> {
  const response = await fetch(`${API_URL}/users/${id}`);
  if (!response.ok) {
    throw new Error('Utilisateur non trouve');
  }
  return response.json();
}

export async function createUser(userData: Omit<User, 'id'>): Promise<User> {
  // Check if email already exists
  const existing = await fetch(`${API_URL}/users?email=${encodeURIComponent(userData.email)}`);
  const existingUsers: User[] = await existing.json();
  if (existingUsers.length > 0) {
    throw new Error('Cet email est deja utilise');
  }

  const response = await fetch(`${API_URL}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la creation de l\'utilisateur');
  }
  return response.json();
}

export async function updateUser(id: string, userData: Partial<User>): Promise<User> {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la mise a jour de l\'utilisateur');
  }
  return response.json();
}

export async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/users/${id}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la suppression de l\'utilisateur');
  }
}
