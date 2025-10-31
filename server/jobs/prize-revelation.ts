import { pool } from "../db/config";

/**
 * Job que revela premios progresivamente según % de ventas
 * Debe ejecutarse después de cada venta de tickets
 */
export async function checkAndRevealPrizes(raffleId: string) {
  try {
    console.log(`[PrizeRevelation] Checking prizes for raffle: ${raffleId}`);

    // 1. Calcular porcentaje de ventas actual
    const salesQuery = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'sold') as sold_count,
        COUNT(*) as total_count,
        (COUNT(*) FILTER (WHERE status = 'sold')::DECIMAL / COUNT(*) * 100) as sales_percentage
       FROM tickets
       WHERE raffle_id = $1`,
      [raffleId]
    );

    const { sold_count, total_count, sales_percentage } = salesQuery.rows[0];
    const currentPercentage = parseFloat(sales_percentage) || 0;

    console.log(`[PrizeRevelation] Sales progress: ${sold_count}/${total_count} (${currentPercentage.toFixed(2)}%)`);

    // 2. Obtener premios bloqueados que deben revelarse
    const prizesToUnlock = await pool.query(
      `SELECT id, name, unlock_at_percentage, unlock_at_tickets_sold, winner_ticket_id
       FROM prizes
       WHERE raffle_id = $1
       AND status = 'locked'
       AND (
         (unlock_at_percentage IS NOT NULL AND unlock_at_percentage <= $2)
         OR
         (unlock_at_tickets_sold IS NOT NULL AND unlock_at_tickets_sold <= $3)
       )
       AND winner_ticket_id IS NOT NULL`,
      [raffleId, currentPercentage, sold_count]
    );

    if (prizesToUnlock.rows.length === 0) {
      console.log(`[PrizeRevelation] No prizes to reveal yet`);
      return { revealed: 0, currentPercentage };
    }

    console.log(`[PrizeRevelation] Revealing ${prizesToUnlock.rows.length} prizes...`);

    // 3. Desbloquear premios alcanzados
    for (const prize of prizesToUnlock.rows) {
      // Actualizar estado del premio
      await pool.query(
        `UPDATE prizes
         SET status = 'unlocked', unlocked_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [prize.id]
      );

      // Marcar ticket como ganador
      await pool.query(
        `UPDATE tickets
         SET is_winner = true, won_prize_id = $1
         WHERE id = $2`,
        [prize.id, prize.winner_ticket_id]
      );

      console.log(`[PrizeRevelation] ✅ Revealed prize: ${prize.name} (ticket: ${prize.winner_ticket_id})`);
    }

    return {
      revealed: prizesToUnlock.rows.length,
      currentPercentage,
      prizes: prizesToUnlock.rows.map(p => p.name)
    };
  } catch (error) {
    console.error("[PrizeRevelation] Error:", error);
    throw error;
  }
}

/**
 * Verificar y revelar premios para todos los sorteos activos
 */
export async function checkAllActiveRaffles() {
  try {
    const activeRaffles = await pool.query(
      "SELECT id, title FROM raffles WHERE status = 'active'"
    );

    console.log(`[PrizeRevelation] Checking ${activeRaffles.rows.length} active raffles...`);

    for (const raffle of activeRaffles.rows) {
      await checkAndRevealPrizes(raffle.id);
    }

    console.log(`[PrizeRevelation] Finished checking all active raffles`);
  } catch (error) {
    console.error("[PrizeRevelation] Error checking all raffles:", error);
  }
}
