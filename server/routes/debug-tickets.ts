import { Request, Response } from "express";
import { pool } from "../db/config";

/**
 * DEBUG ENDPOINT: Generate tickets without auth
 * GET /api/debug/generate-tickets/:raffleId
 */
export async function debugGenerateTickets(req: Request, res: Response) {
  try {
    const { raffleId } = req.params;

    console.log("\n========================================");
    console.log("🔍 DEBUG: Starting ticket generation");
    console.log("========================================");

    // 1. Get raffle info
    console.log(`\n[1] Fetching raffle ${raffleId}...`);
    const raffleQuery = await pool.query(
      "SELECT id, title, total_tickets FROM raffles WHERE id = $1",
      [raffleId]
    );

    if (raffleQuery.rows.length === 0) {
      console.log("❌ Raffle not found");
      return res.status(404).json({
        success: false,
        message: "Sorteo no encontrado"
      });
    }

    const raffle = raffleQuery.rows[0];
    console.log("✅ Raffle found:", {
      id: raffle.id,
      title: raffle.title,
      total_tickets: raffle.total_tickets,
      total_tickets_type: typeof raffle.total_tickets
    });

    const totalTickets = parseInt(raffle.total_tickets);
    console.log(`📊 Total tickets to generate: ${totalTickets}`);

    // 2. Check existing tickets
    console.log(`\n[2] Checking existing tickets...`);
    const existingQuery = await pool.query(
      "SELECT COUNT(*) as count FROM tickets WHERE raffle_id = $1",
      [raffleId]
    );
    const existingCount = parseInt(existingQuery.rows[0].count);
    console.log(`📋 Existing tickets: ${existingCount}`);

    if (existingCount >= totalTickets) {
      console.log("⚠️  Tickets already exist");
      return res.status(400).json({
        success: false,
        message: `Los tickets ya existen (${existingCount}/${totalTickets})`
      });
    }

    // 3. Generate ticket values
    console.log(`\n[3] Generating ticket values array...`);
    const ticketValues = [];
    for (let i = 0; i < totalTickets; i++) {
      ticketValues.push(`('${raffleId}', ${i}, 'available')`);
    }
    console.log(`✅ Generated ${ticketValues.length} ticket values`);
    console.log(`   First ticket: ticket_number = 0`);
    console.log(`   Last ticket: ticket_number = ${totalTickets - 1}`);

    // 4. Insert in batches
    console.log(`\n[4] Inserting tickets in batches...`);
    const batchSize = 1000;
    const totalBatches = Math.ceil(ticketValues.length / batchSize);
    console.log(`   Batch size: ${batchSize}`);
    console.log(`   Total batches: ${totalBatches}`);

    let insertedCount = 0;
    let actuallyInsertedCount = 0;

    for (let i = 0; i < ticketValues.length; i += batchSize) {
      const batch = ticketValues.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      console.log(`\n   📦 Batch ${batchNumber}/${totalBatches}:`);
      console.log(`      - Range: ${i} to ${i + batch.length - 1}`);
      console.log(`      - Size: ${batch.length} tickets`);

      const result = await pool.query(
        `INSERT INTO tickets (raffle_id, ticket_number, status)
         VALUES ${batch.join(', ')}
         ON CONFLICT (raffle_id, ticket_number) DO NOTHING
         RETURNING id`
      );

      actuallyInsertedCount += result.rowCount || 0;
      insertedCount += batch.length;

      console.log(`      ✅ Inserted: ${result.rowCount} rows`);
      console.log(`      📊 Progress: ${insertedCount}/${totalTickets}`);
    }

    // 5. Verify final count
    console.log(`\n[5] Verifying final count...`);
    const finalQuery = await pool.query(
      "SELECT COUNT(*) as count FROM tickets WHERE raffle_id = $1",
      [raffleId]
    );
    const finalCount = parseInt(finalQuery.rows[0].count);

    console.log(`\n========================================`);
    console.log("📊 FINAL RESULTS:");
    console.log(`   Expected: ${totalTickets}`);
    console.log(`   Processed: ${insertedCount}`);
    console.log(`   Actually inserted: ${actuallyInsertedCount}`);
    console.log(`   Final count in DB: ${finalCount}`);
    console.log(`   ✅ Success: ${finalCount === totalTickets}`);
    console.log("========================================\n");

    res.json({
      success: true,
      message: `Generación completada`,
      debug: {
        expected: totalTickets,
        processed: insertedCount,
        actuallyInserted: actuallyInsertedCount,
        finalCountInDB: finalCount,
        success: finalCount === totalTickets
      }
    });
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar tickets",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * DEBUG ENDPOINT: Get ticket count
 * GET /api/debug/ticket-count/:raffleId
 */
export async function debugGetTicketCount(req: Request, res: Response) {
  try {
    const { raffleId } = req.params;

    // Get raffle info
    const raffleQuery = await pool.query(
      "SELECT id, title, total_tickets FROM raffles WHERE id = $1",
      [raffleId]
    );

    if (raffleQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sorteo no encontrado"
      });
    }

    const raffle = raffleQuery.rows[0];

    // Count tickets
    const countQuery = await pool.query(
      "SELECT COUNT(*) as count FROM tickets WHERE raffle_id = $1",
      [raffleId]
    );

    const count = parseInt(countQuery.rows[0].count);

    res.json({
      success: true,
      data: {
        raffleId: raffle.id,
        raffleTitle: raffle.title,
        expectedTickets: raffle.total_tickets,
        actualTickets: count,
        match: count === raffle.total_tickets
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener conteo",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * DEBUG ENDPOINT: Update raffle total tickets
 * POST /api/debug/update-total-tickets/:raffleId
 * Body: { totalTickets: 20000 }
 */
export async function debugUpdateTotalTickets(req: Request, res: Response) {
  try {
    const { raffleId } = req.params;
    const { totalTickets } = req.body;

    console.log(`\n📝 Updating raffle ${raffleId} to ${totalTickets} tickets...`);

    const result = await pool.query(
      "UPDATE raffles SET total_tickets = $1, updated_at = NOW() WHERE id = $2 RETURNING id, title, total_tickets",
      [totalTickets, raffleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sorteo no encontrado"
      });
    }

    const raffle = result.rows[0];
    console.log(`✅ Updated: ${raffle.title} now has ${raffle.total_tickets} tickets`);

    res.json({
      success: true,
      message: `Sorteo actualizado a ${totalTickets} tickets`,
      data: {
        id: raffle.id,
        title: raffle.title,
        totalTickets: raffle.total_tickets
      }
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar sorteo",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

/**
 * DEBUG ENDPOINT: Delete all tickets for a raffle
 * DELETE /api/debug/delete-tickets/:raffleId
 */
export async function debugDeleteTickets(req: Request, res: Response) {
  try {
    const { raffleId } = req.params;

    console.log(`\n🗑️  Deleting all tickets for raffle ${raffleId}...`);

    const result = await pool.query(
      "DELETE FROM tickets WHERE raffle_id = $1 RETURNING id",
      [raffleId]
    );

    const deletedCount = result.rowCount || 0;
    console.log(`✅ Deleted ${deletedCount} tickets`);

    res.json({
      success: true,
      message: `${deletedCount} tickets eliminados`,
      deletedCount
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar tickets",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
