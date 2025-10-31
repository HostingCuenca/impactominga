import { Request, Response, NextFunction } from "express";

/**
 * Middleware para verificar que el usuario autenticado tiene rol de admin
 * Debe usarse DESPUÉS del middleware verifyToken
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  // @ts-ignore - el verifyToken ya agregó el user al request
  const user = req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "No autenticado. Debes iniciar sesión primero.",
    });
  }

  // Verificar que el usuario tenga un rol de administrador
  const adminRoles = ["super_admin", "admin"];

  if (!adminRoles.includes(user.role)) {
    return res.status(403).json({
      success: false,
      message: "Acceso denegado. Solo administradores pueden realizar esta acción.",
    });
  }

  // Usuario es admin, continuar
  next();
}
