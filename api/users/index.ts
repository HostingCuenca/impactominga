import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "impacto-minga-secret-key-change-in-production";

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

function verifyToken(req: VercelRequest): any {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }
  const token = authHeader.substring(7);
  return jwt.verify(token, JWT_SECRET);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    });
  }

  try {
    const db = getDB();
    const decoded = verifyToken(req);

    if (!['super_admin', 'admin'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos"
      });
    }

    const { role, status, search, limit = "50", offset = "0" } = req.query;

    let query = `
      SELECT
        id,
        email,
        role,
        status,
        first_name,
        last_name,
        phone,
        id_type,
        id_number,
        email_verified,
        email_verified_at,
        last_login_at,
        created_at,
        updated_at
      FROM users
      WHERE deleted_at IS NULL
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (role && role !== "all") {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    if (status && status !== "all") {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (search) {
      query += ` AND (
        first_name ILIKE $${paramIndex}
        OR last_name ILIKE $${paramIndex}
        OR email ILIKE $${paramIndex}
        OR id_number ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL`;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (role && role !== "all") {
      countQuery += ` AND role = $${countParamIndex}`;
      countParams.push(role);
      countParamIndex++;
    }

    if (status && status !== "all") {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (
        first_name ILIKE $${countParamIndex}
        OR last_name ILIKE $${countParamIndex}
        OR email ILIKE $${countParamIndex}
        OR id_number ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    const users = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      idType: row.id_type,
      idNumber: row.id_number,
      emailVerified: row.email_verified,
      emailVerifiedAt: row.email_verified_at,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      }
    });
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios",
      error: error.message
    });
  }
}
