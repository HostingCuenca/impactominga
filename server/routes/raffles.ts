import { Request, Response } from "express";
import { pool } from "../db/config";

// Helper para generar slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
    .replace(/[^\w\s-]/g, "") // Eliminar caracteres especiales
    .replace(/\s+/g, "-") // Espacios a guiones
    .replace(/-+/g, "-") // Múltiples guiones a uno
    .trim();
}

/**
 * GET /api/raffles
 * Obtiene todos los sorteos activos (para público)
 * Query params: ?all=true (solo admin, obtiene todos los sorteos sin filtrar)
 */
export async function getRaffles(req: Request, res: Response) {
  try {
    const showAll = req.query.all === 'true';

    // Si all=true, no filtrar por status (útil para el dashboard de admin)
    const statusCondition = showAll ? '' : "WHERE r.status = 'active'";

    const result = await pool.query(
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
        -- Calcular tickets vendidos (solo status = 'sold')
        (SELECT COUNT(*) FROM tickets WHERE raffle_id = r.id AND status = 'sold') as tickets_sold,
        -- Calcular tickets disponibles
        (SELECT COUNT(*) FROM tickets WHERE raffle_id = r.id AND status = 'available') as tickets_available
      FROM raffles r
      ${statusCondition}
      ORDER BY r.activity_number DESC, r.created_at DESC`
    );

    // Convertir snake_case a camelCase
    const raffles = result.rows.map(row => ({
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
    }));

    res.json({
      success: true,
      data: raffles,
      count: raffles.length,
    });
  } catch (error) {
    console.error("Error al obtener raffles:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los sorteos",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}

/**
 * GET /api/raffles/:id
 * Obtiene el detalle de un sorteo específico
 */
export async function getRaffleById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
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
        -- Calcular tickets vendidos (solo status = 'sold')
        (SELECT COUNT(*) FROM tickets WHERE raffle_id = r.id AND status = 'sold') as tickets_sold,
        -- Calcular tickets disponibles
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
  } catch (error) {
    console.error("Error al obtener raffle:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener el sorteo",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}

/**
 * GET /api/raffles/:id/packages
 * Obtiene los paquetes de precios de un sorteo
 */
export async function getRafflePackages(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Verificar que el raffle existe
    const raffleCheck = await pool.query(
      "SELECT id FROM raffles WHERE id = $1",
      [id]
    );

    if (raffleCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sorteo no encontrado",
      });
    }

    const result = await pool.query(
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
  } catch (error) {
    console.error("Error al obtener packages:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los paquetes de precios",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}

/**
 * GET /api/raffles/:id/prizes
 * Obtiene los premios de un sorteo
 */
export async function getRafflePrizes(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Verificar que el raffle existe
    const raffleCheck = await pool.query(
      "SELECT id FROM raffles WHERE id = $1",
      [id]
    );

    if (raffleCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sorteo no encontrado",
      });
    }

    const result = await pool.query(
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
  } catch (error) {
    console.error("Error al obtener prizes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener los premios",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
