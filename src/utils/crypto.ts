/**
 * Utilitaires de sécurité pour l'authentification
 * Note: Pour une vraie production, utiliser bcrypt côté serveur
 */

// Simple hash function (SHA-256 via SubtleCrypto)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Vérifier un mot de passe contre son hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Générer un token de session (simule JWT pour JSON Server)
export function generateToken(userId: string, expiresInMinutes: number = 60 * 24): string {
  const payload = {
    userId,
    exp: Date.now() + expiresInMinutes * 60 * 1000,
    iat: Date.now()
  };
  // Encode en base64 (simulation simple de JWT)
  return btoa(JSON.stringify(payload));
}

// Décoder et valider un token (supporte JWT et tokens simples)
export function decodeToken(token: string): { userId: string; exp: number; iat: number } | null {
  try {
    let payload;

    // Check if it's a JWT (has 3 parts separated by dots)
    if (token.includes('.')) {
      const parts = token.split('.');
      if (parts.length === 3) {
        // Decode the payload part (second part) of JWT
        payload = JSON.parse(atob(parts[1]));
      } else {
        return null;
      }
    } else {
      // Simple base64 token
      payload = JSON.parse(atob(token));
    }

    // JWT exp is in seconds, convert to milliseconds for comparison
    const expMs = payload.exp > 1e12 ? payload.exp : payload.exp * 1000;
    if (expMs && expMs > Date.now()) {
      return payload;
    }
    return null; // Token expiré
  } catch {
    return null; // Token invalide
  }
}

// Vérifier si un token est valide
export function isTokenValid(token: string): boolean {
  const decoded = decodeToken(token);
  return decoded !== null;
}

// Storage keys
export const AUTH_TOKEN_KEY = 'monchantier_token';
export const AUTH_USER_KEY = 'monchantier_user';
