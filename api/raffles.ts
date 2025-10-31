import type { VercelRequest, VercelResponse } from '@vercel/node';
import { query } from './_utils/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Query directo a la base de datos usando la utilidad compartida
    const result = await query(`
      SELECT id, title, description, status, draw_date, created_at
      FROM raffles
      WHERE status IN ('draft', 'active', 'completed')
      ORDER BY created_at DESC
    `);

    res.status(200).json(result.rows);
  } catch (error: any) {
    console.error('Error fetching raffles:', error);
    res.status(500).json({
      error: 'Error fetching raffles',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
