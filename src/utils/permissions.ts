import type { UserRole, RolePermissions } from '../types';

/**
 * Matrice des permissions par role
 *
 * admin: Acces total, gestion multi-chantiers et utilisateurs
 * entrepreneur: Multi-chantiers, couts internes, facturation, pas gestion users globale
 * client_gestionnaire: Son chantier uniquement, validation PV/factures, pas couts internes
 * architecte: Lecture chantiers assignes, validation PV
 * collaborateur: Saisie terrain (pointage, production)
 * client: Lecture seule
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    // Chantiers
    canViewAllChantiers: true,
    canCreateChantier: true,
    canEditChantier: true,
    canDeleteChantier: true,
    // Finances
    canCreateDepense: true,
    canViewCoutsInternes: true,
    canViewFacturation: true,
    canCreateFacture: true,
    canValiderFacture: false,
    // Production
    canSaisiePointage: true,
    canSaisieProduction: true,
    canValiderPV: true,
    // Administration
    canImportData: true,
    canManageUsers: true,
    canManageChantierUsers: true
  },

  entrepreneur: {
    // Chantiers
    canViewAllChantiers: true,
    canCreateChantier: true,
    canEditChantier: true,
    canDeleteChantier: true,
    // Finances
    canCreateDepense: true,
    canViewCoutsInternes: true,    // Voit salaires, marges, couts reels
    canViewFacturation: true,
    canCreateFacture: true,
    canValiderFacture: false,
    // Production
    canSaisiePointage: true,
    canSaisieProduction: true,
    canValiderPV: false,           // Le client valide
    // Administration
    canImportData: true,
    canManageUsers: false,         // Pas gestion users globale
    canManageChantierUsers: true   // Peut ajouter users sur ses chantiers
  },

  client_gestionnaire: {
    // Chantiers
    canViewAllChantiers: false,    // Seulement ses chantiers
    canCreateChantier: false,
    canEditChantier: true,         // Peut modifier son chantier
    canDeleteChantier: false,
    // Finances
    canCreateDepense: false,       // Ne cree pas de depenses
    canViewCoutsInternes: false,   // NE VOIT PAS les couts internes entrepreneur
    canViewFacturation: true,      // Voit les factures
    canCreateFacture: false,
    canValiderFacture: true,       // PEUT valider/refuser factures
    // Production
    canSaisiePointage: false,
    canSaisieProduction: false,
    canValiderPV: true,            // PEUT valider PV avancement
    // Administration
    canImportData: false,
    canManageUsers: false,
    canManageChantierUsers: true   // Peut ajouter users sur son chantier (limite 15)
  },

  architecte: {
    // Chantiers
    canViewAllChantiers: false,    // Seulement chantiers assignes
    canCreateChantier: false,
    canEditChantier: false,
    canDeleteChantier: false,
    // Finances
    canCreateDepense: false,
    canViewCoutsInternes: false,
    canViewFacturation: true,      // Peut voir facturation
    canCreateFacture: false,
    canValiderFacture: false,
    // Production
    canSaisiePointage: false,
    canSaisieProduction: false,
    canValiderPV: true,            // Peut valider PV (en tant que MOE)
    // Administration
    canImportData: false,
    canManageUsers: false,
    canManageChantierUsers: false
  },

  collaborateur: {
    // Chantiers
    canViewAllChantiers: false,    // Seulement chantiers assignes
    canCreateChantier: false,
    canEditChantier: false,
    canDeleteChantier: false,
    // Finances
    canCreateDepense: true,        // Peut saisir depenses terrain
    canViewCoutsInternes: false,
    canViewFacturation: false,
    canCreateFacture: false,
    canValiderFacture: false,
    // Production
    canSaisiePointage: true,       // SAISIE pointage
    canSaisieProduction: true,     // SAISIE production/metre
    canValiderPV: false,
    // Administration
    canImportData: false,
    canManageUsers: false,
    canManageChantierUsers: false
  },

  client: {
    // Chantiers
    canViewAllChantiers: false,    // Seulement ses chantiers
    canCreateChantier: false,
    canEditChantier: false,
    canDeleteChantier: false,
    // Finances
    canCreateDepense: false,
    canViewCoutsInternes: false,
    canViewFacturation: true,      // Peut voir ses factures
    canCreateFacture: false,
    canValiderFacture: false,      // Lecture seule, pas de validation
    // Production
    canSaisiePointage: false,
    canSaisieProduction: false,
    canValiderPV: false,
    // Administration
    canImportData: false,
    canManageUsers: false,
    canManageChantierUsers: false
  }
};

/**
 * Verifie si un role a une permission specifique
 */
export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role]?.[permission] ?? false;
}

/**
 * Verifie si un utilisateur peut acceder a un chantier
 */
export function canAccessChantier(
  role: UserRole,
  userChantierIds: string[],
  chantierId: string
): boolean {
  // Admin et entrepreneur voient tout
  if (ROLE_PERMISSIONS[role].canViewAllChantiers) {
    return true;
  }
  // Les autres ne voient que leurs chantiers assignes
  return userChantierIds.includes(chantierId);
}

/**
 * Verifie si un utilisateur peut voir les couts internes d'un chantier
 * (salaires, marges, couts reels vs facturation client)
 */
export function canViewCoutsInternes(role: UserRole): boolean {
  return ROLE_PERMISSIONS[role].canViewCoutsInternes;
}

/**
 * Limite du nombre d'utilisateurs par chantier
 */
export const MAX_USERS_PER_CHANTIER = 15;
