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

    const result = await db.query(
      `SELECT
        r.id,
        r.title,
        r.description,
        r.slug,
        r.status,
        r.activity_number,
        r.total_tickets,
        r.ticket_price,
        r.price_includes_tax,
        r.tax_rate,
        r.min_purchase,
        r.max_purchase,
        r.start_date,
        r.end_date,
        r.draw_date,
        r.banner_url,
        r.created_at,
        r.updated_at,
        (SELECT COUNT(*) FROM tickets WHERE raffle_id = r.id AND status = 'sold') as tickets_sold,
        (SELECT COUNT(*) FROM tickets WHERE raffle_id = r.id AND status = 'available') as tickets_available
      FROM raffles r
      WHERE r.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sorteo no encontrado",
      });
    }

    const row = result.rows[0];
    const raffle = {
      id: row.id,
      title: row.title,
      description: row.description,
      slug: row.slug,
      status: row.status,
      activityNumber: row.activity_number,
      totalTickets: row.total_tickets,
      ticketPrice: parseFloat(row.ticket_price),
      priceIncludesTax: row.price_includes_tax,
      taxRate: parseFloat(row.tax_rate),
      minPurchase: row.min_purchase,
      maxPurchase: row.max_purchase,
      startDate: row.start_date,
      endDate: row.end_date,
      drawDate: row.draw_date,
      bannerUrl: row.banner_url,
      ticketsSold: parseInt(row.tickets_sold),
      ticketsAvailable: parseInt(row.tickets_available),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json({
      success: true,
      data: raffle,
    });
  } catch (error: any) {
    console.error("Error al obtener raffle:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el sorteo",
      error: error.message,
    });
  }
}
