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

    if (!['super_admin', 'admin', 'contadora'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos"
      });
    }

    const { status, raffleId, search, limit = "100", offset = "0", countOnly } = req.query;

    // Si solo se requiere el conteo, hacer una consulta optimizada
    if (countOnly === "true") {
      let countQuery = `
        SELECT COUNT(*) as count
        FROM tickets t
        WHERE 1=1
      `;

      const params: any[] = [];
      let paramIndex = 1;

      if (status && status !== "all") {
        countQuery += ` AND t.status = $${paramIndex}`;
        params.push(status);
        paramIndex++;
      }

      if (raffleId && raffleId !== "all") {
        countQuery += ` AND t.raffle_id = $${paramIndex}`;
        params.push(raffleId);
        paramIndex++;
      }

      const result = await db.query(countQuery, params);
      const count = parseInt(result.rows[0].count);

      return res.json({
        success: true,
        count: count
      });
    }

    // Consulta normal con todos los datos
    let query = `
      SELECT
        t.id,
        t.ticket_number,
        t.raffle_id,
        r.title as raffle_title,
        t.status,
        t.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        t.order_id,
        o.order_number,
        t.assigned_at,
        t.is_winner
      FROM tickets t
      INNER JOIN raffles r ON t.raffle_id = r.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN orders o ON t.order_id = o.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status && status !== "all") {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (raffleId && raffleId !== "all") {
      query += ` AND t.raffle_id = $${paramIndex}`;
      params.push(raffleId);
      paramIndex++;
    }

    if (search) {
      query += ` AND (
        t.ticket_number::text LIKE $${paramIndex}
        OR o.order_number ILIKE $${paramIndex}
        OR u.first_name ILIKE $${paramIndex}
        OR u.last_name ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY t.ticket_number ASC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    const tickets = result.rows.map(row => ({
      id: row.id,
      ticketNumber: row.ticket_number,
      raffleId: row.raffle_id,
      raffleTitle: row.raffle_title,
      status: row.status,
      userId: row.user_id,
      userName: row.user_name,
      orderId: row.order_id,
      orderNumber: row.order_number,
      assignedAt: row.assigned_at,
      isWinner: row.is_winner
    }));

    res.json({
      success: true,
      data: tickets
    });
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener tickets",
      error: error.message
    });
  }
}
