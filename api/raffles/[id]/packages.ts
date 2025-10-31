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
        quantity,
        price,
        is_most_popular,
        is_active,
        display_order,
        discount_percentage,
        original_price,
        created_at
      FROM pricing_packages
      WHERE raffle_id = $1
        AND is_active = TRUE
      ORDER BY display_order ASC, quantity ASC`,
      [id]
    );

    // Convertir snake_case a camelCase
    const packages = result.rows.map(row => ({
      id: row.id,
      raffleId: row.raffle_id,
      quantity: row.quantity,
      price: parseFloat(row.price),
      isMostPopular: row.is_most_popular,
      isActive: row.is_active,
      displayOrder: row.display_order,
      discountPercentage: row.discount_percentage ? parseFloat(row.discount_percentage) : 0,
      originalPrice: row.original_price ? parseFloat(row.original_price) : null,
      createdAt: row.created_at,
    }));

    res.json({
      success: true,
      data: packages,
      count: packages.length,
    });
  } catch (error: any) {
    console.error("Error al obtener paquetes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los paquetes de precios",
      error: error.message,
    });
  }
}
