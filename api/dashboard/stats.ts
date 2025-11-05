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

    // Verificar autenticación
    const decoded = verifyToken(req);

    // Verificar que sea admin o contadora
    if (!['super_admin', 'admin', 'contadora'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: "No tienes permisos para acceder a esta información",
      });
    }

    // Calcular estadísticas del mes actual
    const statsQuery = await db.query(`
      SELECT
        -- Órdenes
        COUNT(DISTINCT o.id) FILTER (WHERE o.created_at >= DATE_TRUNC('month', CURRENT_DATE)) as total_orders_month,
        COUNT(DISTINCT o.id) FILTER (WHERE o.status IN ('pending_verification', 'approved')) as pending_orders,

        -- Ingresos del mes
        COALESCE(SUM(o.total) FILTER (WHERE o.status IN ('approved', 'completed') AND o.created_at >= DATE_TRUNC('month', CURRENT_DATE)), 0) as revenue_month,

        -- Ingresos totales
        COALESCE(SUM(o.total) FILTER (WHERE o.status IN ('approved', 'completed')), 0) as revenue_total,

        -- Sorteos activos
        COUNT(DISTINCT r.id) FILTER (WHERE r.status = 'active') as active_raffles,

        -- Tickets vendidos hoy
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'sold' AND t.assigned_at >= CURRENT_DATE) as tickets_sold_today,

        -- Nuevos usuarios del mes
        COUNT(DISTINCT u.id) FILTER (WHERE u.created_at >= DATE_TRUNC('month', CURRENT_DATE)) as new_users_month
      FROM orders o
      FULL OUTER JOIN raffles r ON r.deleted_at IS NULL
      FULL OUTER JOIN tickets t ON t.raffle_id = r.id
      FULL OUTER JOIN users u ON u.deleted_at IS NULL
    `);

    const stats = statsQuery.rows[0];

    // Calcular porcentaje de cambio vs mes anterior
    const previousMonthQuery = await db.query(`
      SELECT
        COUNT(DISTINCT id) as orders_prev_month,
        COALESCE(SUM(total) FILTER (WHERE status IN ('approved', 'completed')), 0) as revenue_prev_month
      FROM orders
      WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND created_at < DATE_TRUNC('month', CURRENT_DATE)
    `);

    const prevStats = previousMonthQuery.rows[0];

    // Calcular cambios porcentuales
    const ordersChange = prevStats.orders_prev_month > 0
      ? ((parseInt(stats.total_orders_month) - parseInt(prevStats.orders_prev_month)) / parseInt(prevStats.orders_prev_month) * 100).toFixed(1)
      : 0;

    const revenueChange = parseFloat(prevStats.revenue_prev_month) > 0
      ? ((parseFloat(stats.revenue_month) - parseFloat(prevStats.revenue_prev_month)) / parseFloat(prevStats.revenue_prev_month) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      data: {
        totalOrdersMonth: parseInt(stats.total_orders_month) || 0,
        pendingOrders: parseInt(stats.pending_orders) || 0,
        revenueMonth: parseFloat(stats.revenue_month) || 0,
        revenueTotal: parseFloat(stats.revenue_total) || 0,
        activeRaffles: parseInt(stats.active_raffles) || 0,
        ticketsSoldToday: parseInt(stats.tickets_sold_today) || 0,
        newUsersMonth: parseInt(stats.new_users_month) || 0,
        ordersChange: parseFloat(ordersChange),
        revenueChange: parseFloat(revenueChange)
      }
    });
  } catch (error: any) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: error.message,
    });
  }
}
