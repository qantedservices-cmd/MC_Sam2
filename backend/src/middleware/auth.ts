import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server.js';

const JWT_SECRET = process.env.JWT_SECRET || 'monchantier-secret-key';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Vérifier que l'utilisateur existe et est actif
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || !user.actif) {
      return res.status(401).json({ error: 'Utilisateur invalide ou inactif' });
    }

    // Attacher les infos user à la requête
    req.userId = user.id;
    req.userRole = user.role;

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expiré' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Token invalide' });
    }
    return res.status(500).json({ error: 'Erreur d\'authentification' });
  }
}

// Middleware optionnel - n'échoue pas si pas de token
export async function optionalAuthMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      req.userId = decoded.userId;
    }

    next();
  } catch {
    // Ignore les erreurs de token, continue sans auth
    next();
  }
}
