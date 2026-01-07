import type { UserRole, RolePermissions } from '../types';

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    canViewAllChantiers: true,
    canCreateChantier: true,
    canEditChantier: true,
    canDeleteChantier: true,
    canCreateDepense: true,
    canImportData: true,
    canManageUsers: true
  },
  gestionnaire: {
    canViewAllChantiers: true,
    canCreateChantier: true,
    canEditChantier: true,
    canDeleteChantier: false,
    canCreateDepense: true,
    canImportData: true,
    canManageUsers: false
  },
  utilisateur: {
    canViewAllChantiers: false,
    canCreateChantier: false,
    canEditChantier: true,
    canDeleteChantier: false,
    canCreateDepense: true,
    canImportData: false,
    canManageUsers: false
  },
  lecteur: {
    canViewAllChantiers: false,
    canCreateChantier: false,
    canEditChantier: false,
    canDeleteChantier: false,
    canCreateDepense: false,
    canImportData: false,
    canManageUsers: false
  }
};

export function hasPermission(role: UserRole, permission: keyof RolePermissions): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

export function canAccessChantier(
  role: UserRole,
  userChantierIds: string[],
  chantierId: string
): boolean {
  if (ROLE_PERMISSIONS[role].canViewAllChantiers) {
    return true;
  }
  if (userChantierIds.length === 0) {
    return true; // Empty array means all chantiers
  }
  return userChantierIds.includes(chantierId);
}
