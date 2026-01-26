import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserSession, RolePermissions } from '../types';
import { login as apiLogin } from '../services/api';
import { hasPermission, canAccessChantier as checkChantierAccess, ROLE_PERMISSIONS } from '../utils/permissions';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY, isTokenValid } from '../utils/crypto';

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  canAccessChantier: (chantierId: string) => boolean;
  addChantierAccess: (chantierId: string) => void;
  permissions: RolePermissions | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger la session depuis localStorage au demarrage
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const storedUser = localStorage.getItem(AUTH_USER_KEY);

    if (token && storedUser && isTokenValid(token)) {
      try {
        const parsedUser = JSON.parse(storedUser) as UserSession;
        setUser(parsedUser);
      } catch {
        // Session invalide, nettoyer
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    } else {
      // Token expiré ou invalide, nettoyer
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await apiLogin(email, password);
      if (result) {
        setUser(result.session);
        localStorage.setItem(AUTH_TOKEN_KEY, result.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(result.session));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }, []);

  const checkPermission = useCallback((permission: keyof RolePermissions): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user]);

  const canAccessChantier = useCallback((chantierId: string): boolean => {
    if (!user) return false;
    return checkChantierAccess(user.role, user.chantierIds, chantierId);
  }, [user]);

  // Add access to a newly created chantier
  const addChantierAccess = useCallback((chantierId: string) => {
    if (!user) return;
    if (user.chantierIds.includes(chantierId)) return;

    const updatedUser = {
      ...user,
      chantierIds: [...user.chantierIds, chantierId]
    };
    setUser(updatedUser);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
  }, [user]);

  const permissions = user ? ROLE_PERMISSIONS[user.role] : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        hasPermission: checkPermission,
        canAccessChantier,
        addChantierAccess,
        permissions
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
