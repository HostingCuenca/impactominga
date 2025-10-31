import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "impacto-minga-secret-key-change-in-production";
const SALT_ROUNDS = 10;

let pool: Pool | null = null;

function getDB() {
  if (!pool) {
    pool = new Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return pool;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = getDB();
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
    const emailCheck = await db.query(
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
    const idCheck = await db.query(
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
    const result = await db.query(
      `INSERT INTO users (
        first_name, last_name, email, phone,
        id_type, id_number, password_hash, role, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'customer', 'active')
      RETURNING id, first_name, last_name, email, role, status, created_at`,
      [first_name, last_name, email, phone, id_type, id_number, passwordHash]
    );

    const user = result.rows[0];

    // Generar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Usuario registrado exitosamente",
      token,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err: any) {
    console.error("Error en registro:", err);
    return res.status(500).json({
      success: false,
      message: "Error al registrar usuario",
      error: err.message,
    });
  }
}
