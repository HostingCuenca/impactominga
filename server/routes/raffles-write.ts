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
 * POST /api/raffles
 * Crea un nuevo sorteo
 * Requiere autenticación y rol de admin
 */
export async function createRaffle(req: Request, res: Response) {
  try {
    const {
      title,
      description,
      status = 'draft',
      activityNumber,
      totalTickets,
      ticketPrice,
      priceIncludesTax = true,
      taxRate = 12.00,
      minPurchase = 1,
      maxPurchase = 100,
      startDate,
      endDate,
      drawDate,
      bannerUrl,
    } = req.body;

    // Validaciones básicas
    if (!title || !totalTickets || !ticketPrice || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos: title, totalTickets, ticketPrice, startDate, endDate",
      });
    }

    if (totalTickets <= 0) {
      return res.status(400).json({
        success: false,
        message: "totalTickets debe ser mayor a 0",
      });
    }

    if (ticketPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: "ticketPrice debe ser mayor a 0",
      });
    }

    // Generar slug automáticamente
    const slug = generateSlug(title);

    const result = await pool.query(
      `INSERT INTO raffles (
        title,
        description,
        slug,
        status,
        activity_number,
        total_tickets,
        ticket_price,
        price_includes_tax,
        tax_rate,
        min_purchase,
        max_purchase,
        start_date,
        end_date,
        draw_date,
        banner_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        title,
        description,
        slug,
        status,
        activityNumber,
        totalTickets,
        ticketPrice,
        priceIncludesTax,
        taxRate,
        minPurchase,
        maxPurchase,
        startDate,
        endDate,
        drawDate,
        bannerUrl,
      ]
    );

    const row = result.rows[0];
    const raffleId = row.id;

    // Crear todos los tickets para este sorteo
    console.log(`[createRaffle] Creating ${totalTickets} tickets for raffle ${raffleId}`);

    const ticketValues = [];
    for (let i = 0; i < totalTickets; i++) {
      ticketValues.push(`('${raffleId}', ${i}, 'available')`);
    }

    // Insert tickets in batches of 1000 to avoid query size limits
    const batchSize = 1000;
    for (let i = 0; i < ticketValues.length; i += batchSize) {
      const batch = ticketValues.slice(i, i + batchSize);
      await pool.query(
        `INSERT INTO tickets (raffle_id, ticket_number, status)
         VALUES ${batch.join(', ')}`
      );
    }

    console.log(`[createRaffle] Successfully created ${totalTickets} tickets`);

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
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.status(201).json({
      success: true,
      message: `Sorteo creado exitosamente con ${totalTickets} boletos`,
      data: raffle,
    });
  } catch (error: any) {
    console.error("Error al crear raffle:", error);

    // Error de slug duplicado
    if (error.code === '23505' && error.constraint === 'raffles_slug_key') {
      return res.status(400).json({
        success: false,
        message: "Ya existe un sorteo con un título similar",
      });
    }

    // Error de activity_number duplicado
    if (error.code === '23505' && error.constraint === 'raffles_activity_number_key') {
      return res.status(400).json({
        success: false,
        message: "Ya existe un sorteo con ese número de actividad",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear el sorteo",
      error: error.message,
    });
  }
}

/**
 * POST /api/raffles/:id/packages
 * Crea paquetes de precios para un sorteo
 */
export async function createPackages(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { packages } = req.body;

    if (!Array.isArray(packages) || packages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se debe proporcionar un array de paquetes",
      });
    }

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

    // Insertar paquetes en batch
    const createdPackages = [];

    for (const pkg of packages) {
      const { quantity, price, isMostPopular = false, displayOrder = 0, discountPercentage = 0, originalPrice } = pkg;

      if (!quantity || !price) {
        continue; // Saltar paquetes inválidos
      }

      const result = await pool.query(
        `INSERT INTO pricing_packages (
          raffle_id,
          quantity,
          price,
          is_most_popular,
          display_order,
          discount_percentage,
          original_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [id, quantity, price, isMostPopular, displayOrder, discountPercentage, originalPrice]
      );

      const row = result.rows[0];
      createdPackages.push({
        id: row.id,
        raffleId: row.raffle_id,
        quantity: row.quantity,
        price: parseFloat(row.price),
        isMostPopular: row.is_most_popular,
        displayOrder: row.display_order,
        discountPercentage: row.discount_percentage ? parseFloat(row.discount_percentage) : 0,
        originalPrice: row.original_price ? parseFloat(row.original_price) : null,
        createdAt: row.created_at,
      });
    }

    res.status(201).json({
      success: true,
      message: `${createdPackages.length} paquetes creados exitosamente`,
      data: createdPackages,
    });
  } catch (error) {
    console.error("Error al crear packages:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear los paquetes",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}

/**
 * POST /api/raffles/:id/prizes
 * Crea premios para un sorteo
 */
export async function createPrizes(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { prizes } = req.body;

    if (!Array.isArray(prizes) || prizes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Se debe proporcionar un array de premios",
      });
    }

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

    // Insertar premios en batch
    const createdPrizes = [];

    for (const prize of prizes) {
      const { name, description, cashValue, productName, imageUrl, unlockPercentage, unlockTickets, unlockStatus = 'locked', displayOrder = 0 } = prize;

      if (!name || (!unlockPercentage && !unlockTickets)) {
        continue; // Saltar premios inválidos
      }

      // Seleccionar un ticket ganador ALEATORIO disponible
      const winnerTicketQuery = await pool.query(
        `SELECT id FROM tickets
         WHERE raffle_id = $1
         AND status = 'available'
         AND id NOT IN (
           SELECT winner_ticket_id FROM prizes
           WHERE raffle_id = $1 AND winner_ticket_id IS NOT NULL
         )
         ORDER BY RANDOM()
         LIMIT 1`,
        [id]
      );

      const winnerTicketId = winnerTicketQuery.rows[0]?.id || null;

      if (!winnerTicketId) {
        console.warn(`[createPrizes] No hay tickets disponibles para asignar al premio: ${name}`);
      }

      const result = await pool.query(
        `INSERT INTO prizes (
          raffle_id,
          name,
          description,
          cash_value,
          product_name,
          product_image_url,
          unlock_at_percentage,
          unlock_at_tickets_sold,
          status,
          winner_ticket_id,
          display_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *`,
        [id, name, description, cashValue, productName, imageUrl, unlockPercentage, unlockTickets, unlockStatus, winnerTicketId, displayOrder]
      );

      const row = result.rows[0];
      createdPrizes.push({
        id: row.id,
        raffleId: row.raffle_id,
        name: row.name,
        description: row.description,
        cashValue: row.cash_value,
        productName: row.product_name,
        imageUrl: row.product_image_url,
        unlockPercentage: row.unlock_at_percentage,
        unlockTickets: row.unlock_at_tickets_sold,
        unlockStatus: row.status,
        winnerTicketId: row.winner_ticket_id,
        displayOrder: row.display_order,
        createdAt: row.created_at,
      });
    }

    res.status(201).json({
      success: true,
      message: `${createdPrizes.length} premios creados exitosamente`,
      data: createdPrizes,
    });
  } catch (error) {
    console.error("Error al crear prizes:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear los premios",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}

/**
 * PUT /api/raffles/:id
 * Actualiza un sorteo existente
 * Requiere autenticación y rol de admin
 */
export async function updateRaffle(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      status,
      activityNumber,
      totalTickets,
      ticketPrice,
      priceIncludesTax,
      taxRate,
      minPurchase,
      maxPurchase,
      startDate,
      endDate,
      drawDate,
      bannerUrl,
    } = req.body;

    // Verificar que el sorteo existe
    const existingRaffle = await pool.query(
      "SELECT * FROM raffles WHERE id = $1",
      [id]
    );

    if (existingRaffle.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sorteo no encontrado",
      });
    }

    // Construir query dinámico con solo los campos que se envían
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(title);
      paramIndex++;

      // Actualizar slug si cambia el título
      updates.push(`slug = $${paramIndex}`);
      values.push(generateSlug(title));
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (activityNumber !== undefined) {
      updates.push(`activity_number = $${paramIndex}`);
      values.push(activityNumber);
      paramIndex++;
    }

    if (totalTickets !== undefined) {
      if (totalTickets <= 0) {
        return res.status(400).json({
          success: false,
          message: "totalTickets debe ser mayor a 0",
        });
      }
      updates.push(`total_tickets = $${paramIndex}`);
      values.push(totalTickets);
      paramIndex++;
    }

    if (ticketPrice !== undefined) {
      if (ticketPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: "ticketPrice debe ser mayor a 0",
        });
      }
      updates.push(`ticket_price = $${paramIndex}`);
      values.push(ticketPrice);
      paramIndex++;
    }

    if (priceIncludesTax !== undefined) {
      updates.push(`price_includes_tax = $${paramIndex}`);
      values.push(priceIncludesTax);
      paramIndex++;
    }

    if (taxRate !== undefined) {
      updates.push(`tax_rate = $${paramIndex}`);
      values.push(taxRate);
      paramIndex++;
    }

    if (minPurchase !== undefined) {
      updates.push(`min_purchase = $${paramIndex}`);
      values.push(minPurchase);
      paramIndex++;
    }

    if (maxPurchase !== undefined) {
      updates.push(`max_purchase = $${paramIndex}`);
      values.push(maxPurchase);
      paramIndex++;
    }

    if (startDate !== undefined) {
      updates.push(`start_date = $${paramIndex}`);
      values.push(startDate);
      paramIndex++;
    }

    if (endDate !== undefined) {
      updates.push(`end_date = $${paramIndex}`);
      values.push(endDate);
      paramIndex++;
    }

    if (drawDate !== undefined) {
      updates.push(`draw_date = $${paramIndex}`);
      values.push(drawDate);
      paramIndex++;
    }

    if (bannerUrl !== undefined) {
      updates.push(`banner_url = $${paramIndex}`);
      values.push(bannerUrl);
      paramIndex++;
    }

    // Si no hay campos para actualizar
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron campos para actualizar",
      });
    }

    // Agregar ID al final de los valores
    values.push(id);

    const query = `
      UPDATE raffles
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
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
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json({
      success: true,
      message: "Sorteo actualizado exitosamente",
      data: raffle,
    });
  } catch (error: any) {
    console.error("Error al actualizar raffle:", error);

    // Error de slug duplicado
    if (error.code === '23505' && error.constraint === 'raffles_slug_key') {
      return res.status(400).json({
        success: false,
        message: "Ya existe un sorteo con un título similar",
      });
    }

    // Error de activity_number duplicado
    if (error.code === '23505' && error.constraint === 'raffles_activity_number_key') {
      return res.status(400).json({
        success: false,
        message: "Ya existe un sorteo con ese número de actividad",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar el sorteo",
      error: error.message,
    });
  }
}

/**
 * PATCH /api/raffles/:id/status
 * Cambia el estado de un sorteo (draft, active, completed, cancelled)
 * Requiere autenticación y rol de admin
 */
export async function updateRaffleStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Se requiere el campo 'status'",
      });
    }

    // Validar que el status es válido
    const validStatuses = ['draft', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status inválido. Debe ser uno de: ${validStatuses.join(', ')}`,
      });
    }

    // Verificar que el sorteo existe
    const existingRaffle = await pool.query(
      "SELECT id, status FROM raffles WHERE id = $1",
      [id]
    );

    if (existingRaffle.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sorteo no encontrado",
      });
    }

    const currentStatus = existingRaffle.rows[0].status;

    // Reglas de negocio para cambios de estado
    if (currentStatus === 'completed' && status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: "No se puede cambiar el estado de un sorteo completado",
      });
    }

    if (currentStatus === 'cancelled' && status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: "No se puede reactivar un sorteo cancelado",
      });
    }

    const result = await pool.query(
      `UPDATE raffles
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    const row = result.rows[0];

    const raffle = {
      id: row.id,
      title: row.title,
      status: row.status,
      updatedAt: row.updated_at,
    };

    res.json({
      success: true,
      message: `Estado del sorteo cambiado a '${status}'`,
      data: raffle,
    });
  } catch (error: any) {
    console.error("Error al cambiar status:", error);
    res.status(500).json({
      success: false,
      message: "Error al cambiar el estado del sorteo",
      error: error.message,
    });
  }
}

/**
 * DELETE /api/raffles/:id
 * Elimina un sorteo (soft delete: cambia status a 'cancelled')
 * Requiere autenticación y rol de admin
 */
export async function deleteRaffle(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Verificar que el sorteo existe
    const existingRaffle = await pool.query(
      "SELECT id, status FROM raffles WHERE id = $1",
      [id]
    );

    if (existingRaffle.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sorteo no encontrado",
      });
    }

    const currentStatus = existingRaffle.rows[0].status;

    // No permitir eliminar sorteos completados
    if (currentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar un sorteo completado. Los registros históricos deben preservarse.",
      });
    }

    // Verificar si hay órdenes asociadas (raffle_id está en order_items, no en orders)
    const ordersCheck = await pool.query(
      `SELECT COUNT(DISTINCT oi.order_id) as count
       FROM order_items oi
       INNER JOIN orders o ON oi.order_id = o.id
       WHERE oi.raffle_id = $1 AND o.status NOT IN ('cancelled', 'rejected')`,
      [id]
    );

    const activeOrdersCount = parseInt(ordersCheck.rows[0].count);

    if (activeOrdersCount > 0) {
      return res.status(400).json({
        success: false,
        message: `No se puede eliminar el sorteo. Tiene ${activeOrdersCount} órdenes activas asociadas.`,
      });
    }

    // Soft delete: cambiar status a 'cancelled'
    const result = await pool.query(
      `UPDATE raffles
       SET status = 'cancelled', updated_at = NOW()
       WHERE id = $1
       RETURNING id, title, status`,
      [id]
    );

    const row = result.rows[0];

    res.json({
      success: true,
      message: "Sorteo eliminado exitosamente (marcado como cancelado)",
      data: {
        id: row.id,
        title: row.title,
        status: row.status,
      },
    });
  } catch (error: any) {
    console.error("Error al eliminar raffle:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el sorteo",
      error: error.message,
    });
  }
}

/**
 * PUT /api/raffles/:raffleId/packages/:packageId
 * Actualiza un paquete de precios
 * Requiere autenticación y rol de admin
 */
export async function updatePackage(req: Request, res: Response) {
  try {
    const { raffleId, packageId } = req.params;
    const {
      quantity,
      price,
      isMostPopular,
      isActive,
      displayOrder,
      discountPercentage,
      originalPrice,
    } = req.body;

    // Verificar que el paquete existe
    const existingPackage = await pool.query(
      "SELECT * FROM pricing_packages WHERE id = $1 AND raffle_id = $2",
      [packageId, raffleId]
    );

    if (existingPackage.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Paquete no encontrado",
      });
    }

    // Construir query dinámico
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (quantity !== undefined) {
      if (quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "La cantidad debe ser mayor a 0",
        });
      }
      updates.push(`quantity = $${paramIndex}`);
      values.push(quantity);
      paramIndex++;
    }

    if (price !== undefined) {
      if (price <= 0) {
        return res.status(400).json({
          success: false,
          message: "El precio debe ser mayor a 0",
        });
      }
      updates.push(`price = $${paramIndex}`);
      values.push(price);
      paramIndex++;
    }

    if (isMostPopular !== undefined) {
      updates.push(`is_most_popular = $${paramIndex}`);
      values.push(isMostPopular);
      paramIndex++;
    }

    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex}`);
      values.push(isActive);
      paramIndex++;
    }

    if (displayOrder !== undefined) {
      updates.push(`display_order = $${paramIndex}`);
      values.push(displayOrder);
      paramIndex++;
    }

    if (discountPercentage !== undefined) {
      updates.push(`discount_percentage = $${paramIndex}`);
      values.push(discountPercentage);
      paramIndex++;
    }

    if (originalPrice !== undefined) {
      updates.push(`original_price = $${paramIndex}`);
      values.push(originalPrice);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron campos para actualizar",
      });
    }

    values.push(packageId);

    const query = `
      UPDATE pricing_packages
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const row = result.rows[0];

    const packageData = {
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
      updatedAt: row.updated_at,
    };

    res.json({
      success: true,
      message: "Paquete actualizado exitosamente",
      data: packageData,
    });
  } catch (error: any) {
    console.error("Error al actualizar paquete:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el paquete",
      error: error.message,
    });
  }
}

/**
 * DELETE /api/raffles/:raffleId/packages/:packageId
 * Elimina un paquete de precios
 * Requiere autenticación y rol de admin
 */
export async function deletePackage(req: Request, res: Response) {
  try {
    const { raffleId, packageId } = req.params;

    // Verificar que el paquete existe
    const existingPackage = await pool.query(
      "SELECT * FROM pricing_packages WHERE id = $1 AND raffle_id = $2",
      [packageId, raffleId]
    );

    if (existingPackage.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Paquete no encontrado",
      });
    }

    // Eliminar paquete
    await pool.query("DELETE FROM pricing_packages WHERE id = $1", [packageId]);

    res.json({
      success: true,
      message: "Paquete eliminado exitosamente",
    });
  } catch (error: any) {
    console.error("Error al eliminar paquete:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el paquete",
      error: error.message,
    });
  }
}

/**
 * PUT /api/raffles/:raffleId/prizes/:prizeId
 * Actualiza un premio
 * Requiere autenticación y rol de admin
 */
export async function updatePrize(req: Request, res: Response) {
  try {
    const { raffleId, prizeId } = req.params;
    const {
      name,
      description,
      cashValue,
      productName,
      productDescription,
      productImageUrl,
      unlockAtPercentage,
      unlockAtTicketsSold,
      status,
      displayOrder,
    } = req.body;

    // Verificar que el premio existe
    const existingPrize = await pool.query(
      "SELECT * FROM prizes WHERE id = $1 AND raffle_id = $2",
      [prizeId, raffleId]
    );

    if (existingPrize.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Premio no encontrado",
      });
    }

    // Construir query dinámico
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      values.push(name);
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }

    if (cashValue !== undefined) {
      updates.push(`cash_value = $${paramIndex}`);
      values.push(cashValue);
      paramIndex++;
    }

    if (productName !== undefined) {
      updates.push(`product_name = $${paramIndex}`);
      values.push(productName);
      paramIndex++;
    }

    if (productDescription !== undefined) {
      updates.push(`product_description = $${paramIndex}`);
      values.push(productDescription);
      paramIndex++;
    }

    if (productImageUrl !== undefined) {
      updates.push(`product_image_url = $${paramIndex}`);
      values.push(productImageUrl);
      paramIndex++;
    }

    if (unlockAtPercentage !== undefined) {
      updates.push(`unlock_at_percentage = $${paramIndex}`);
      values.push(unlockAtPercentage);
      paramIndex++;
    }

    if (unlockAtTicketsSold !== undefined) {
      updates.push(`unlock_at_tickets_sold = $${paramIndex}`);
      values.push(unlockAtTicketsSold);
      paramIndex++;
    }

    if (status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(status);
      paramIndex++;
    }

    if (displayOrder !== undefined) {
      updates.push(`display_order = $${paramIndex}`);
      values.push(displayOrder);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron campos para actualizar",
      });
    }

    values.push(prizeId);

    const query = `
      UPDATE prizes
      SET ${updates.join(", ")}, updated_at = NOW()
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    const row = result.rows[0];

    const prizeData = {
      id: row.id,
      raffleId: row.raffle_id,
      name: row.name,
      description: row.description,
      cashValue: row.cash_value ? parseFloat(row.cash_value) : null,
      productName: row.product_name,
      productDescription: row.product_description,
      productImageUrl: row.product_image_url,
      unlockAtPercentage: row.unlock_at_percentage ? parseFloat(row.unlock_at_percentage) : null,
      unlockAtTicketsSold: row.unlock_at_tickets_sold,
      status: row.status,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json({
      success: true,
      message: "Premio actualizado exitosamente",
      data: prizeData,
    });
  } catch (error: any) {
    console.error("Error al actualizar premio:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar el premio",
      error: error.message,
    });
  }
}

/**
 * DELETE /api/raffles/:raffleId/prizes/:prizeId
 * Elimina un premio
 * Requiere autenticación y rol de admin
 */
export async function deletePrize(req: Request, res: Response) {
  try {
    const { raffleId, prizeId } = req.params;

    // Verificar que el premio existe
    const existingPrize = await pool.query(
      "SELECT * FROM prizes WHERE id = $1 AND raffle_id = $2",
      [prizeId, raffleId]
    );

    if (existingPrize.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Premio no encontrado",
      });
    }

    // Verificar que no tenga ganador asignado
    if (existingPrize.rows[0].winner_ticket_id) {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar un premio que ya tiene ganador asignado",
      });
    }

    // Eliminar premio
    await pool.query("DELETE FROM prizes WHERE id = $1", [prizeId]);

    res.json({
      success: true,
      message: "Premio eliminado exitosamente",
    });
  } catch (error: any) {
    console.error("Error al eliminar premio:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar el premio",
      error: error.message,
    });
  }
}

// =====================================================
// POST: Assign winner tickets to existing prizes
// =====================================================
export async function assignWinnersToPrizes(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Get all prizes without winner_ticket_id
    const prizesQuery = await pool.query(
      `SELECT id, name FROM prizes
       WHERE raffle_id = $1
       AND winner_ticket_id IS NULL`,
      [id]
    );

    if (prizesQuery.rows.length === 0) {
      return res.json({
        success: true,
        message: "Todos los premios ya tienen números asignados",
        assigned: 0
      });
    }

    console.log(`[assignWinnersToPrizes] Assigning winners to ${prizesQuery.rows.length} prizes...`);

    let assignedCount = 0;

    for (const prize of prizesQuery.rows) {
      // Seleccionar un ticket ganador ALEATORIO disponible
      const winnerTicketQuery = await pool.query(
        `SELECT id, ticket_number FROM tickets
         WHERE raffle_id = $1
         AND status = 'available'
         AND id NOT IN (
           SELECT winner_ticket_id FROM prizes
           WHERE raffle_id = $1 AND winner_ticket_id IS NOT NULL
         )
         ORDER BY RANDOM()
         LIMIT 1`,
        [id]
      );

      if (winnerTicketQuery.rows.length === 0) {
        console.warn(`[assignWinnersToPrizes] No hay tickets disponibles para premio: ${prize.name}`);
        continue;
      }

      const winnerTicket = winnerTicketQuery.rows[0];

      // Asignar winner_ticket_id al premio
      await pool.query(
        `UPDATE prizes
         SET winner_ticket_id = $1
         WHERE id = $2`,
        [winnerTicket.id, prize.id]
      );

      console.log(`[assignWinnersToPrizes] ✅ Prize "${prize.name}" → Ticket #${winnerTicket.ticket_number}`);
      assignedCount++;
    }

    res.json({
      success: true,
      message: `${assignedCount} premios actualizados con números ganadores`,
      assigned: assignedCount
    });
  } catch (error) {
    console.error("[assignWinnersToPrizes] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error al asignar números ganadores",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// =====================================================
// POST: Generate tickets for a raffle
// =====================================================
export async function generateTickets(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Get raffle info
    const raffleQuery = await pool.query(
      "SELECT id, title, total_tickets FROM raffles WHERE id = $1",
      [id]
    );

    if (raffleQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sorteo no encontrado"
      });
    }

    const raffle = raffleQuery.rows[0];
    const totalTickets = raffle.total_tickets;

    // Check if tickets already exist
    const existingTicketsQuery = await pool.query(
      "SELECT COUNT(*) as count FROM tickets WHERE raffle_id = $1",
      [id]
    );

    const existingCount = parseInt(existingTicketsQuery.rows[0].count);

    if (existingCount >= totalTickets) {
      return res.status(400).json({
        success: false,
        message: `Los tickets ya existen para este sorteo (${existingCount}/${totalTickets})`
      });
    }

    console.log(`[generateTickets] Creating ${totalTickets} tickets for raffle ${id} (${raffle.title})`);

    // Create tickets
    const ticketValues = [];
    for (let i = 0; i < totalTickets; i++) {
      ticketValues.push(`('${id}', ${i}, 'available')`);
    }

    // Insert in batches of 1000
    const batchSize = 1000;
    let insertedCount = 0;

    for (let i = 0; i < ticketValues.length; i += batchSize) {
      const batch = ticketValues.slice(i, i + batchSize);
      await pool.query(
        `INSERT INTO tickets (raffle_id, ticket_number, status)
         VALUES ${batch.join(', ')}
         ON CONFLICT (raffle_id, ticket_number) DO NOTHING`
      );
      insertedCount += batch.length;
      console.log(`[generateTickets] Progress: ${insertedCount}/${totalTickets}`);
    }

    console.log(`[generateTickets] Successfully created ${totalTickets} tickets`);

    res.json({
      success: true,
      message: `${totalTickets} tickets generados exitosamente`,
      data: {
        raffleId: id,
        raffleTitle: raffle.title,
        totalTickets: totalTickets,
        ticketsCreated: totalTickets
      }
    });
  } catch (error) {
    console.error("[generateTickets] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar tickets",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
