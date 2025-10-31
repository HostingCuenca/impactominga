import { Request, Response } from "express";
import { pool } from "../db/config";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendPasswordResetEmail } from "../services/email";

// =====================================================
// POST: Request password reset
// =====================================================
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El email es requerido"
      });
    }

    // Buscar usuario por email
    const userQuery = await pool.query(
      "SELECT id, email, first_name FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    // Si no existe, informar al usuario
    if (userQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Este correo electrónico no está registrado"
      });
    }

    const user = userQuery.rows[0];

    // Generar token seguro
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = await bcrypt.hash(resetToken, 10);

    // Guardar token en base de datos (PostgreSQL calculará expires_at)
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')
       ON CONFLICT (user_id) DO UPDATE
       SET token_hash = $2, expires_at = NOW() + INTERVAL '1 hour', created_at = CURRENT_TIMESTAMP`,
      [user.id, resetTokenHash]
    );

    // Enviar email
    await sendPasswordResetEmail(user.email, resetToken, user.first_name);

    // TODO: REMOVER EN PRODUCCIÓN - Solo para debug
    console.log(`[DEBUG] Token de reset para ${user.email}: ${resetToken}`);
    console.log(`[DEBUG] URL completa: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);

    res.json({
      success: true,
      message: "Correo enviado exitosamente. Revisa tu bandeja de entrada."
    });
  } catch (error) {
    console.error("Error requesting password reset:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar solicitud"
    });
  }
}

// =====================================================
// POST: Reset password with token
// =====================================================
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token y nueva contraseña son requeridos"
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    // Buscar todos los tokens válidos (no expirados)
    const tokenQuery = await pool.query(
      `SELECT prt.user_id, prt.token_hash, u.email, u.first_name
       FROM password_reset_tokens prt
       INNER JOIN users u ON prt.user_id = u.id
       WHERE prt.expires_at > NOW()`,
      []
    );

    console.log(`[Reset Password] Tokens válidos encontrados: ${tokenQuery.rows.length}`);

    if (tokenQuery.rows.length === 0) {
      console.log("[Reset Password] No hay tokens válidos en la BD");
      return res.status(400).json({
        success: false,
        message: "El enlace ha expirado. Por favor, solicita uno nuevo."
      });
    }

    // Verificar token contra todos los hashes válidos
    let validToken = null;
    for (const row of tokenQuery.rows) {
      const isValid = await bcrypt.compare(token, row.token_hash);
      console.log(`[Reset Password] Comparando token para user ${row.user_id}: ${isValid}`);
      if (isValid) {
        validToken = row;
        break;
      }
    }

    if (!validToken) {
      console.log("[Reset Password] Token no coincide con ningún hash");
      return res.status(400).json({
        success: false,
        message: "El enlace no es válido. Por favor, solicita uno nuevo."
      });
    }

    console.log(`[Reset Password] Token válido para usuario: ${validToken.user_id}`);

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña
    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [hashedPassword, validToken.user_id]
    );

    // Eliminar token usado
    await pool.query(
      "DELETE FROM password_reset_tokens WHERE user_id = $1",
      [validToken.user_id]
    );

    res.json({
      success: true,
      message: "Contraseña actualizada exitosamente"
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({
      success: false,
      message: "Error al restablecer contraseña"
    });
  }
}
