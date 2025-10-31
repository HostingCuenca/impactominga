import { Request, Response } from "express";
import { pool } from "../db/config";

/**
 * GET /api/dashboard/stats
 * Obtiene estadísticas generales del dashboard
 * Requiere autenticación y rol de admin/contadora
 */
export async function getDashboardStats(req: Request, res: Response) {
  try {
    // Calcular estadísticas del mes actual
    const statsQuery = await pool.query(`
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
    const previousMonthQuery = await pool.query(`
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
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas"
    });
  }
}

/**
 * GET /api/dashboard/recent-activity
 * Obtiene actividades recientes del sistema
 * Requiere autenticación y rol de admin/contadora
 */
export async function getRecentActivity(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    // Obtener actividades recientes: órdenes, premios desbloqueados, tickets vendidos
    const activities: any[] = [];

    // 1. Órdenes recientes
    const ordersQuery = await pool.query(
      `SELECT
        o.id,
        o.order_number,
        o.status,
        o.total,
        o.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as items_count
       FROM orders o
       INNER JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
       LIMIT $1`,
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

    // 2. Premios desbloqueados recientemente
    const prizesQuery = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.unlocked_at,
        r.title as raffle_title,
        r.activity_number,
        t.ticket_number,
        CONCAT(u.first_name, ' ', u.last_name) as winner_name
       FROM prizes p
       INNER JOIN raffles r ON p.raffle_id = r.id
       INNER JOIN tickets t ON p.winner_ticket_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE p.status = 'unlocked' AND p.unlocked_at IS NOT NULL
       ORDER BY p.unlocked_at DESC
       LIMIT $1`,
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

    // 3. Tickets vendidos recientemente (últimas horas)
    const ticketsQuery = await pool.query(
      `SELECT
        t.id,
        t.ticket_number,
        t.assigned_at,
        r.title as raffle_title,
        CONCAT(u.first_name, ' ', u.last_name) as buyer_name
       FROM tickets t
       INNER JOIN raffles r ON t.raffle_id = r.id
       INNER JOIN users u ON t.user_id = u.id
       WHERE t.status = 'sold' AND t.assigned_at >= NOW() - INTERVAL '24 hours'
       ORDER BY t.assigned_at DESC
       LIMIT $1`,
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

    // Ordenar todas las actividades por timestamp descendente
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limitar al número solicitado
    const limitedActivities = activities.slice(0, limit);

    res.json({
      success: true,
      data: limitedActivities,
      count: limitedActivities.length
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener actividad reciente"
    });
  }
}

/**
 * GET /api/dashboard/sales-chart
 * Obtiene datos para gráfico de ventas (últimos 7 días)
 * Requiere autenticación y rol de admin/contadora
 */
export async function getSalesChart(req: Request, res: Response) {
  try {
    const days = parseInt(req.query.days as string) || 7;

    const salesQuery = await pool.query(
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
  } catch (error) {
    console.error("Error fetching sales chart:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener datos del gráfico"
    });
  }
}
