import { Request, Response } from "express";
import { pool } from "../db/config";

// =====================================================
// GET: List tickets with filters
// =====================================================
export async function getTickets(req: Request, res: Response) {
  try {
    const { status, raffleId, search, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT
        t.id,
        t.ticket_number,
        t.raffle_id,
        r.title as raffle_title,
        t.status,
        t.user_id,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        t.order_id,
        o.order_number,
        t.assigned_at,
        t.is_winner
      FROM tickets t
      INNER JOIN raffles r ON t.raffle_id = r.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN orders o ON t.order_id = o.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (status && status !== "all") {
      query += ` AND t.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (raffleId && raffleId !== "all") {
      query += ` AND t.raffle_id = $${paramIndex}`;
      params.push(raffleId);
      paramIndex++;
    }

    if (search) {
      query += ` AND (
        t.ticket_number::text LIKE $${paramIndex}
        OR o.order_number ILIKE $${paramIndex}
        OR u.first_name ILIKE $${paramIndex}
        OR u.last_name ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY t.ticket_number ASC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const tickets = result.rows.map(row => ({
      id: row.id,
      ticketNumber: row.ticket_number,
      raffleId: row.raffle_id,
      raffleTitle: row.raffle_title,
      status: row.status,
      userId: row.user_id,
      userName: row.user_name,
      orderId: row.order_id,
      orderNumber: row.order_number,
      assignedAt: row.assigned_at,
      isWinner: row.is_winner
    }));

    res.json({
      success: true,
      data: tickets
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener tickets"
    });
  }
}
