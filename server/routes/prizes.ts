import { Request, Response } from "express";
import { pool } from "../db/config";

/**
 * GET /api/raffles/:id/revealed-prizes
 * Obtiene premios revelados públicamente (números bendecidos)
 * Endpoint PÚBLICO - no requiere autenticación
 */
export async function getRevealedPrizes(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Obtener información del sorteo
    const raffleQuery = await pool.query(
      `SELECT
        id,
        title,
        activity_number,
        total_tickets,
        (SELECT COUNT(*) FROM tickets WHERE raffle_id = $1 AND status = 'sold') as tickets_sold
       FROM raffles
       WHERE id = $1`,
      [id]
    );

    if (raffleQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sorteo no encontrado"
      });
    }

    const raffle = raffleQuery.rows[0];
    const salesPercentage = (raffle.tickets_sold / raffle.total_tickets) * 100;

    // Obtener premios revelados (desbloqueados)
    const revealedPrizesQuery = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.description,
        p.cash_value,
        p.product_name,
        p.product_image_url,
        p.unlock_at_percentage,
        p.unlock_at_tickets_sold,
        p.status,
        p.unlocked_at,
        p.display_order,
        t.ticket_number,
        CONCAT(u.first_name, ' ', u.last_name) as winner_name,
        u.id as winner_user_id
       FROM prizes p
       INNER JOIN tickets t ON p.winner_ticket_id = t.id
       LEFT JOIN users u ON t.user_id = u.id
       WHERE p.raffle_id = $1
       AND p.status = 'unlocked'
       ORDER BY p.display_order ASC, p.unlocked_at ASC`,
      [id]
    );

    // Obtener premios bloqueados (próximos a revelar)
    const lockedPrizesQuery = await pool.query(
      `SELECT
        p.id,
        p.name,
        p.description,
        p.cash_value,
        p.product_name,
        p.product_image_url,
        p.unlock_at_percentage,
        p.unlock_at_tickets_sold,
        p.display_order
       FROM prizes p
       WHERE p.raffle_id = $1
       AND p.status = 'locked'
       ORDER BY p.display_order ASC`,
      [id]
    );

    const revealedPrizes = revealedPrizesQuery.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      cashValue: row.cash_value,
      productName: row.product_name,
      imageUrl: row.product_image_url,
      unlockThreshold: row.unlock_at_percentage || row.unlock_at_tickets_sold,
      unlockType: row.unlock_at_percentage ? 'percentage' : 'tickets',
      status: row.status,
      unlockedAt: row.unlocked_at,
      winningNumber: row.ticket_number,
      winnerName: row.winner_name,
      displayOrder: row.display_order
    }));

    const lockedPrizes = lockedPrizesQuery.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      cashValue: row.cash_value,
      productName: row.product_name,
      imageUrl: row.product_image_url,
      unlockThreshold: row.unlock_at_percentage || row.unlock_at_tickets_sold,
      unlockType: row.unlock_at_percentage ? 'percentage' : 'tickets',
      displayOrder: row.display_order
    }));

    res.json({
      success: true,
      data: {
        raffle: {
          id: raffle.id,
          title: raffle.title,
          activityNumber: raffle.activity_number,
          totalTickets: raffle.total_tickets,
          ticketsSold: raffle.tickets_sold,
          salesPercentage: parseFloat(salesPercentage.toFixed(2))
        },
        revealedPrizes,
        lockedPrizes
      }
    });
  } catch (error) {
    console.error("Error fetching revealed prizes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener premios revelados"
    });
  }
}

/**
 * GET /api/orders/:orderId/my-prizes
 * Obtiene los premios ganados por una orden específica
 * Requiere autenticación
 */
export async function getMyPrizes(req: Request, res: Response) {
  try {
    const { orderId } = req.params;
    const userId = (req as any).user?.userId;

    // Verificar que la orden pertenece al usuario
    const orderQuery = await pool.query(
      "SELECT id, user_id FROM orders WHERE id = $1",
      [orderId]
    );

    if (orderQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada"
      });
    }

    const order = orderQuery.rows[0];

    if (order.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para ver esta orden"
      });
    }

    // Obtener tickets de la orden con premios ganados
    const ticketsQuery = await pool.query(
      `SELECT
        t.id,
        t.ticket_number,
        t.is_winner,
        p.id as prize_id,
        p.name as prize_name,
        p.description as prize_description,
        p.cash_value,
        p.product_name,
        p.product_image_url,
        p.status as prize_status,
        p.claimed_at
       FROM tickets t
       LEFT JOIN prizes p ON t.won_prize_id = p.id
       WHERE t.order_id = $1
       ORDER BY t.ticket_number ASC`,
      [orderId]
    );

    const tickets = ticketsQuery.rows.map(row => ({
      id: row.id,
      ticketNumber: row.ticket_number,
      isWinner: row.is_winner,
      prize: row.is_winner ? {
        id: row.prize_id,
        name: row.prize_name,
        description: row.prize_description,
        cashValue: row.cash_value,
        productName: row.product_name,
        imageUrl: row.product_image_url,
        status: row.prize_status,
        claimedAt: row.claimed_at
      } : null
    }));

    const winningTickets = tickets.filter(t => t.isWinner);

    res.json({
      success: true,
      data: {
        tickets,
        totalTickets: tickets.length,
        winningTickets: winningTickets.length,
        prizes: winningTickets.map(t => t.prize)
      }
    });
  } catch (error) {
    console.error("Error fetching my prizes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener premios"
    });
  }
}
