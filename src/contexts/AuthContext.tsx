import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserSession, RolePermissions } from '../types';
import { login as apiLogin } from '../services/api';
import { hasPermission, canAccessChantier as checkChantierAccess, ROLE_PERMISSIONS } from '../utils/permissions';

const AUTH_STORAGE_KEY = 'monchantier_user';

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  canAccessChantier: (chantierId: string) => boolean;
  permissions: RolePermissions | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger la session depuis localStorage au demarrage
  useEffect(() => {
    const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as UserSession;
        setUser(parsedUser);
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const session = await apiLogin(email, password);
      if (session) {
        setUser(session);
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
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
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const checkPermission = useCallback((permission: keyof RolePermissions): boolean => {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }, [user]);

  const canAccessChantier = useCallback((chantierId: string): boolean => {
    if (!user) return false;
    return checkChantierAccess(user.role, user.chantierIds, chantierId);
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
