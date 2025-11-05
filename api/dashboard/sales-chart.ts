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

    const days = parseInt(req.query.days as string) || 7;

    const salesQuery = await db.query(
      `SELECT
        DATE(created_at) as date,
        COUNT(*) as orders_count,
        COALESCE(SUM(total) FILTER (WHERE status IN ('approved', 'completed')), 0) as revenue
       FROM orders
       WHERE created_at >= CURRENT_DATE - INTERVAL '1 day' * $1
       GROUP BY DATE(created_at)
       ORDER BY date ASC`,
      [days]
    );

    const chartData = salesQuery.rows.map(row => ({
      date: row.date,
      ordersCount: parseInt(row.orders_count),
      revenue: parseFloat(row.revenue)
    }));

    res.json({
      success: true,
      data: chartData
    });
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener datos del gráfico",
      error: error.message
    });
  }
}
