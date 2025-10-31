import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

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
  try {
    const db = getDB();

    const result = await db.query(`
      SELECT id, title, description, status, draw_date, created_at
      FROM raffles
      WHERE status IN ('draft', 'active', 'completed')
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error: any) {
    console.error('Error fetching raffles:', error);
    res.status(500).json({
      error: 'Error fetching raffles',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
