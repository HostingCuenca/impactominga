import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db/config";

const JWT_SECRET = process.env.JWT_SECRET || "impacto-minga-secret-key-change-in-production";
const SALT_ROUNDS = 10;

// Registro
export async function handleRegister(req: Request, res: Response) {
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
    const emailCheck = await pool.query(
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
    const idCheck = await pool.query(
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
    const result = await pool.query(
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

// Login
export async function handleLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email y contraseña son obligatorios",
      });
    }

    // Buscar usuario
    const result = await pool.query(
      `SELECT id, first_name, last_name, email, password_hash, role, status
       FROM users
       WHERE email = $1 AND deleted_at IS NULL`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
      });
    }

    const user = result.rows[0];

    // Verificar si el usuario está activo
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Tu cuenta está inactiva. Contacta al administrador.",
      });
    }

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: "Credenciales incorrectas",
      });
    }

    // Actualizar último login
    await pool.query(
      "UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id]
    );

    // Generar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Inicio de sesión exitoso",
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
    console.error("Error en login:", err);
    return res.status(500).json({
      success: false,
      message: "Error al iniciar sesión",
      error: err.message,
    });
  }
}

// Verificar token (middleware)
export function verifyToken(req: any, res: Response, next: any) {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Token no proporcionado",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
}

// Obtener perfil del usuario autenticado
export async function handleGetProfile(req: any, res: Response) {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT id, first_name, last_name, email, phone, id_type, id_number, role, status, created_at
       FROM users
       WHERE id = $1 AND deleted_at IS NULL`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const user = result.rows[0];

    return res.json({
      success: true,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phone: user.phone,
        idType: user.id_type,
        idNumber: user.id_number,
        role: user.role,
        status: user.status,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    console.error("Error al obtener perfil:", err);
    return res.status(500).json({
      success: false,
      message: "Error al obtener perfil",
      error: err.message,
    });
  }
}
