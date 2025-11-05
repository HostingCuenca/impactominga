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

    const limit = parseInt(req.query.limit as string) || 10;
    const activities: any[] = [];

    // Órdenes recientes
    const ordersQuery = await db.query(
      `SELECT o.id, o.order_number, o.status, o.total, o.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
       FROM orders o
       INNER JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC LIMIT $1`,
      [limit]
    );

    ordersQuery.rows.forEach(row => {
      activities.push({
        type: 'order',
        id: row.id,
        title: `Nueva orden ${row.order_number}`,
        description: `${row.user_name} realizó una orden de $${parseFloat(row.total).toFixed(2)}`,
        status: row.status,
        timestamp: row.created_at,
        metadata: {
          orderNumber: row.order_number,
          userName: row.user_name,
          userEmail: row.user_email,
          total: parseFloat(row.total),
          itemsCount: parseInt(row.items_count)
        }
      });
    });

    // Premios desbloqueados
    const prizesQuery = await db.query(
      `SELECT p.id, p.name, p.unlocked_at, r.title as raffle_title,
        r.activity_number, t.ticket_number,
        CONCAT(u.first_name, ' ', u.last_name) as winner_name
       FROM prizes p
       INNER JOIN raffles r ON p.raffle_id = r.id
       INNER JOIN tickets t ON p.winner_ticket_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE p.status = 'unlocked' AND p.unlocked_at IS NOT NULL
       ORDER BY p.unlocked_at DESC LIMIT $1`,
      [Math.floor(limit / 2)]
    );

    prizesQuery.rows.forEach(row => {
      activities.push({
        type: 'prize',
        id: row.id,
        title: `Premio desbloqueado: ${row.name}`,
        description: `Número ganador #${row.ticket_number.toString().padStart(4, '0')} en ${row.raffle_title}`,
        status: 'unlocked',
        timestamp: row.unlocked_at,
        metadata: {
          prizeName: row.name,
          raffleTitle: row.raffle_title,
          activityNumber: row.activity_number,
          ticketNumber: row.ticket_number,
          winnerName: row.winner_name
        }
      });
    });

    // Tickets vendidos
    const ticketsQuery = await db.query(
      `SELECT t.id, t.ticket_number, t.assigned_at, r.title as raffle_title,
        CONCAT(u.first_name, ' ', u.last_name) as buyer_name
       FROM tickets t
       INNER JOIN raffles r ON t.raffle_id = r.id
       INNER JOIN users u ON t.user_id = u.id
       WHERE t.status = 'sold' AND t.assigned_at >= NOW() - INTERVAL '24 hours'
       ORDER BY t.assigned_at DESC LIMIT $1`,
      [Math.floor(limit / 3)]
    );

    ticketsQuery.rows.forEach(row => {
      activities.push({
        type: 'ticket',
        id: row.id,
        title: `Ticket vendido`,
        description: `${row.buyer_name} compró el ticket #${row.ticket_number.toString().padStart(4, '0')} de ${row.raffle_title}`,
        status: 'sold',
        timestamp: row.assigned_at,
        metadata: {
          ticketNumber: row.ticket_number,
          raffleTitle: row.raffle_title,
          buyerName: row.buyer_name
        }
      });
    });

    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivities = activities.slice(0, limit);

    res.json({
      success: true,
      data: limitedActivities,
      count: limitedActivities.length
    });
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener actividad reciente",
      error: error.message
    });
  }
}
