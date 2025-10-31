import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'impacto-minga-super-secret-key-2025-change-in-production';

export function verifyToken(token: string): any | null {
  try {
    if (!token) return null;
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export function getUserFromRequest(req: VercelRequest): any | null {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return null;
  return verifyToken(token);
}

export function requireAuth(req: VercelRequest, res: VercelResponse): any | null {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'No autorizado' });
    return null;
  }
  return user;
}

export function requireAdmin(req: VercelRequest, res: VercelResponse): any | null {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: 'No autorizado' });
    return null;
  }

  if (user.role !== 'admin' && user.role !== 'contadora') {
    res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
    return null;
  }
  return user;
}

export function signToken(payload: any): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
