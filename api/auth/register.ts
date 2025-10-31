import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import { query } from '../_utils/db';
import { signToken } from '../_utils/auth';

const SALT_ROUNDS = 10;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      first_name,
      last_name,
      email,
      phone,
      id_type,
      id_number,
      password,
    } = req.body;

    // Validaciones
    if (!first_name || !last_name || !email || !id_type || !id_number || !password) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son obligatorios",
      });
    }

    // Verificar si el email ya existe
    const emailCheck = await query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El correo electrónico ya está registrado",
      });
    }

    // Verificar si el número de documento ya existe
    const idCheck = await query(
      "SELECT id FROM users WHERE id_number = $1",
      [id_number]
    );

    if (idCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El número de documento ya está registrado",
      });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Crear usuario
    const result = await query(
      `INSERT INTO users (
        first_name, last_name, email, phone,
        id_type, id_number, password_hash, role, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'customer', 'active')
      RETURNING id, first_name, last_name, email, role, status, created_at`,
      [first_name, last_name, email, phone, id_type, id_number, passwordHash]
    );

    const user = result.rows[0];

    // Generar token
    const token = signToken(
      { userId: user.id, email: user.email, role: user.role }
    );

    return res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      token,
      user,
    });
  } catch (error: any) {
    console.error('Error in register:', error);
    return res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      error: error.message,
    });
  }
}
