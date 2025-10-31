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
    const { id } = req.query;

    // Verificar que el raffle existe
    const raffleCheck = await db.query(
      "SELECT id FROM raffles WHERE id = $1",
      [id]
    );

    if (raffleCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sorteo no encontrado",
      });
    }

    const result = await db.query(
      `SELECT
        id,
        raffle_id,
        name,
        description,
        product_image_url,
        unlock_at_tickets_sold,
        status,
        display_order,
        created_at
      FROM prizes
      WHERE raffle_id = $1
      ORDER BY display_order ASC, unlock_at_tickets_sold ASC`,
      [id]
    );

    // Convertir snake_case a camelCase
    const prizes = result.rows.map(row => ({
      id: row.id,
      raffleId: row.raffle_id,
      name: row.name,
      description: row.description,
      imageUrl: row.product_image_url,
      unlockThreshold: row.unlock_at_tickets_sold,
      unlockStatus: row.status,
      displayOrder: row.display_order,
      createdAt: row.created_at,
    }));

    res.json({
      success: true,
      data: prizes,
      count: prizes.length,
    });
  } catch (error: any) {
    console.error("Error al obtener premios:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los premios",
      error: error.message,
    });
  }
}
