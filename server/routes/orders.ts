import { Request, Response } from "express";
import { pool } from "../db/config";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import multer from "multer";
import path from "path";
import fs from "fs";
import { sendOrderApprovedEmail, sendOrderRejectedEmail, sendOrderConfirmationEmail, sendWelcomeEmail } from "../services/email";
import { checkAndRevealPrizes } from "../jobs/prize-revelation";

// =====================================================
// POST: Smart Checkout - Maneja todo el flujo
// =====================================================
export async function smartCheckout(req: Request, res: Response) {
  try {
    const {
      raffleId,
      packageId,
      email,
      firstName,
      lastName,
      phone,
      idType,
      idNumber,
      shippingAddress,
      shippingCity,
      shippingProvince,
      paymentMethod,
      customerNotes,
      password // Solo si es usuario nuevo
    } = req.body;

    // Validar campos requeridos
    if (!raffleId || !packageId || !email || !firstName || !lastName || !idType || !idNumber) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos"
      });
    }

    // ¿Usuario autenticado?
    const authenticatedUserId = (req as any).user?.userId;

    if (authenticatedUserId) {
      // Usuario YA autenticado → Crear orden directamente
      const order = await createOrderForUser(
        authenticatedUserId,
        { raffleId, packageId, email, firstName, lastName, phone, idType, idNumber,
          shippingAddress, shippingCity, shippingProvince, paymentMethod, customerNotes }
      );

      return res.status(201).json({
        success: true,
        data: order,
        message: "Orden creada exitosamente"
      });
    }

    // Usuario NO autenticado → Verificar si ya existe
    const existingUser = await pool.query(
      "SELECT id, email FROM users WHERE email = $1 OR id_number = $2",
      [email.toLowerCase(), idNumber]
    );

    if (existingUser.rows.length > 0) {
      // Usuario YA EXISTE → Pedir login
      return res.status(200).json({
        success: false,
        requireLogin: true,
        message: "Ya tienes una cuenta. Inicia sesión para continuar.",
        email: existingUser.rows[0].email
      });
    }

    // Usuario NUEVO → Pedir contraseña
    return res.status(200).json({
      success: false,
      requirePassword: true,
      message: "Crea una contraseña para ver el estado de tu orden"
    });

  } catch (error) {
    console.error("Error in smart checkout:", error);
    res.status(500).json({
      success: false,
      message: "Error al procesar checkout"
    });
  }
}

// =====================================================
// POST: Complete Checkout (con contraseña nueva)
// =====================================================
export async function completeCheckoutWithPassword(req: Request, res: Response) {
  try {
    const {
      raffleId, packageId, email, firstName, lastName, phone, idType, idNumber,
      shippingAddress, shippingCity, shippingProvince, paymentMethod, customerNotes,
      password
    } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "La contraseña debe tener al menos 6 caracteres"
      });
    }

    // 1. Crear usuario
    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, phone, id_type, id_number, role, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'customer', 'active')
       RETURNING id, email, first_name, last_name, role, status`,
      [email.toLowerCase(), hashedPassword, firstName, lastName, phone, idType, idNumber]
    );

    const newUser = userResult.rows[0];

    // 2. Crear orden
    const order = await createOrderForUser(
      newUser.id,
      { raffleId, packageId, email, firstName, lastName, phone, idType, idNumber,
        shippingAddress, shippingCity, shippingProvince, paymentMethod, customerNotes }
    );

    // 3. Generar token (auto-login)
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    // 4. Enviar emails
    await sendWelcomeEmail(newUser.email, newUser.first_name);
    await sendOrderConfirmationEmail(
      newUser.email,
      newUser.first_name,
      order.orderNumber,
      order.total,
      order.raffleTitle,
      order.quantity
    );

    res.status(201).json({
      success: true,
      data: { order, token, user: newUser },
      message: "Cuenta creada y orden realizada exitosamente"
    });

  } catch (error: any) {
    console.error("Error completing checkout:", error);

    if (error.code === '23505') { // Duplicate key
      return res.status(400).json({
        success: false,
        message: "Este correo o cédula ya está registrado"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al completar checkout"
    });
  }
}

// =====================================================
// POST: Complete Checkout (con login)
// =====================================================
export async function completeCheckoutWithLogin(req: Request, res: Response) {
  try {
    const {
      raffleId, packageId, email, firstName, lastName, phone, idType, idNumber,
      shippingAddress, shippingCity, shippingProvince, paymentMethod, customerNotes,
      password
    } = req.body;

    // 1. Validar credenciales
    const userResult = await pool.query(
      "SELECT id, email, password_hash, first_name, last_name, role, status FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Credenciales inválidas"
      });
    }

    const user = userResult.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: "Contraseña incorrecta"
      });
    }

    // 2. Crear orden
    const order = await createOrderForUser(
      user.id,
      { raffleId, packageId, email, firstName, lastName, phone, idType, idNumber,
        shippingAddress, shippingCity, shippingProvince, paymentMethod, customerNotes }
    );

    // 3. Generar token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    // 4. Enviar email de confirmación
    await sendOrderConfirmationEmail(
      user.email,
      user.first_name,
      order.orderNumber,
      order.total,
      order.raffleTitle,
      order.quantity
    );

    res.status(201).json({
      success: true,
      data: { order, token, user: { id: user.id, email: user.email, firstName: user.first_name, lastName: user.last_name, role: user.role } },
      message: "Orden creada exitosamente"
    });

  } catch (error) {
    console.error("Error completing checkout with login:", error);
    res.status(500).json({
      success: false,
      message: "Error al completar checkout"
    });
  }
}

// =====================================================
// Helper: Crear orden para un usuario
// =====================================================
async function createOrderForUser(userId: string, data: any) {
  const { raffleId, packageId, email, firstName, lastName, phone, idType, idNumber,
    shippingAddress, shippingCity, shippingProvince, paymentMethod, customerNotes } = data;

  // Obtener información del sorteo
  const raffleQuery = await pool.query(
    `SELECT id, title, activity_number, ticket_price, status, total_tickets
     FROM raffles WHERE id = $1`,
    [raffleId]
  );

  if (raffleQuery.rows.length === 0) {
    throw new Error("Sorteo no encontrado");
  }

  const raffle = raffleQuery.rows[0];

  if (raffle.status !== 'active') {
    throw new Error("El sorteo no está activo");
  }

  // Obtener información del paquete
  let pkg;

  // Verificar si es un paquete personalizado (custom-X)
  if (typeof packageId === 'string' && packageId.startsWith('custom-')) {
    // Paquete personalizado - extraer cantidad del ID
    const customQuantity = parseInt(packageId.replace('custom-', ''));

    if (isNaN(customQuantity) || customQuantity < 4) {
      throw new Error("Cantidad personalizada inválida (mínimo 4 números)");
    }

    // Calcular precio: $1 por boleto
    pkg = {
      id: packageId,
      quantity: customQuantity,
      price: customQuantity * 1.0 // $1 USD por boleto
    };

    console.log(`[createOrderForUser] Paquete personalizado: ${customQuantity} números por $${pkg.price}`);
  } else {
    // Paquete predefinido - buscar en la base de datos
    const packageQuery = await pool.query(
      `SELECT id, quantity, price FROM pricing_packages
       WHERE id = $1 AND raffle_id = $2 AND is_active = TRUE`,
      [packageId, raffleId]
    );

    if (packageQuery.rows.length === 0) {
      throw new Error("Paquete no encontrado o no disponible");
    }

    pkg = packageQuery.rows[0];
    console.log(`[createOrderForUser] Paquete predefinido: ${pkg.quantity} números por $${pkg.price}`);
  }

  // Calcular tickets vendidos desde la tabla tickets
  const ticketsSoldQuery = await pool.query(
    `SELECT COUNT(*) as sold FROM tickets WHERE raffle_id = $1 AND status = 'sold'`,
    [raffleId]
  );
  const ticketsSold = parseInt(ticketsSoldQuery.rows[0].sold || 0);

  // Verificar disponibilidad de tickets
  const ticketsAvailable = raffle.total_tickets - ticketsSold;
  if (ticketsAvailable < pkg.quantity) {
    throw new Error(`Solo quedan ${ticketsAvailable} boletos disponibles`);
  }

  // Calcular montos
  const subtotal = parseFloat(pkg.price);
  // const taxRate = 0.12; // 12% IVA - COMENTADO: IVA 0%
  const taxRate = 0; // IVA 0% - No aplica para tickets de rifa
  const tax = 0; // IVA 0%
  const total = subtotal; // Sin IVA

  // Generar número de orden único
  const orderNumber = `IM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // Crear orden
  const orderResult = await pool.query(
    `INSERT INTO orders (
      order_number, user_id,
      customer_email, customer_first_name, customer_last_name,
      customer_phone, customer_id_type, customer_id_number,
      shipping_address, shipping_city, shipping_province,
      subtotal, tax, total,
      status, payment_method, customer_notes
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    RETURNING *`,
    [
      orderNumber, userId,
      email, firstName, lastName,
      phone || null, idType, idNumber,
      shippingAddress || null, shippingCity || null, shippingProvince || null,
      subtotal, tax, total,
      'pending_payment', paymentMethod || 'bank_transfer', customerNotes || null
    ]
  );

  const order = orderResult.rows[0];

  // Crear order item
  const unitPrice = subtotal / pkg.quantity;
  await pool.query(
    `INSERT INTO order_items (
      order_id, raffle_id, raffle_title, raffle_activity_number,
      quantity, unit_price, subtotal
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      order.id, raffleId, raffle.title, raffle.activity_number,
      pkg.quantity, unitPrice, subtotal
    ]
  );

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    total: parseFloat(order.total),
    status: order.status,
    raffleTitle: raffle.title,
    quantity: pkg.quantity
  };
}

// =====================================================
// GET: Simple endpoint - Get my orders
// =====================================================
export async function getMyOrders(req: Request, res: Response) {
  try {
    const userId = (req as any).user?.userId;

    console.log("[getMyOrders] userId:", userId);

    // Simple query first - just get orders
    const ordersQuery = `
      SELECT
        id,
        order_number,
        total,
        status,
        payment_method,
        created_at
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const ordersResult = await pool.query(ordersQuery, [userId]);

    console.log("[getMyOrders] Found orders:", ordersResult.rows.length);

    // For each order, get items and tickets
    const orders = [];
    for (const order of ordersResult.rows) {
      // Get items
      const itemsQuery = `
        SELECT
          id,
          raffle_id,
          raffle_title,
          quantity,
          unit_price,
          subtotal
        FROM order_items
        WHERE order_id = $1
      `;
      const itemsResult = await pool.query(itemsQuery, [order.id]);

      // Get tickets
      const ticketsQuery = `
        SELECT
          id,
          ticket_number,
          status,
          is_winner
        FROM tickets
        WHERE order_id = $1
        ORDER BY ticket_number
      `;
      const ticketsResult = await pool.query(ticketsQuery, [order.id]);

      orders.push({
        id: order.id,
        orderNumber: order.order_number,
        total: parseFloat(order.total),
        status: order.status,
        paymentMethod: order.payment_method,
        receiptUrl: null,
        createdAt: order.created_at,
        items: itemsResult.rows.map(item => ({
          id: item.id,
          raffleId: item.raffle_id,
          raffleTitle: item.raffle_title,
          quantity: item.quantity,
          unitPrice: parseFloat(item.unit_price),
          subtotal: parseFloat(item.subtotal)
        })),
        tickets: ticketsResult.rows.map(ticket => ({
          id: ticket.id,
          ticketNumber: ticket.ticket_number,
          status: ticket.status,
          isWinner: ticket.is_winner
        }))
      });
    }

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error("[getMyOrders] Error:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener órdenes",
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

// =====================================================
// GET: List all orders with filtering
// =====================================================
export async function getOrders(req: Request, res: Response) {
  try {
    const {
      status,
      userId,
      search,
      page = "1",
      limit = "20",
      sortBy = "created_at",
      sortOrder = "DESC"
    } = req.query;

    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Get authenticated user info
    const authenticatedUserId = (req as any).user?.userId;
    const userRole = (req as any).user?.role;

    console.log("[getOrders] User:", { userId: authenticatedUserId, role: userRole });

    // If customer, only show their own orders
    if (userRole === "customer") {
      console.log("[getOrders] Filtering by customer userId:", authenticatedUserId);
      conditions.push(`o.user_id = $${paramIndex}`);
      params.push(authenticatedUserId);
      paramIndex++;
    } else {
      // Admin can filter by userId if provided
      if (userId) {
        conditions.push(`o.user_id = $${paramIndex}`);
        params.push(userId);
        paramIndex++;
      }
    }

    // Filter by status
    if (status) {
      conditions.push(`o.status = $${paramIndex}`);
      params.push(status);
      paramIndex++;
    }

    // Search by order number, email, or customer name
    if (search) {
      conditions.push(`(
        o.order_number ILIKE $${paramIndex} OR
        o.customer_email ILIKE $${paramIndex} OR
        o.customer_first_name ILIKE $${paramIndex} OR
        o.customer_last_name ILIKE $${paramIndex}
      )`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Valid sort columns
    const validSortColumns = ["created_at", "updated_at", "total", "status", "order_number"];
    const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : "created_at";
    const sortDirection = sortOrder === "ASC" ? "ASC" : "DESC";

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM orders o
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const totalOrders = parseInt(countResult.rows[0].total);

    // Get orders with order items
    params.push(limit);
    params.push(offset);

    const query = `
      SELECT
        o.*,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', oi.id,
            'raffleId', oi.raffle_id,
            'raffleTitle', oi.raffle_title,
            'raffleActivityNumber', oi.raffle_activity_number,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price,
            'subtotal', oi.subtotal
          )
        ) FILTER (WHERE oi.id IS NOT NULL) as items,
        (
          SELECT json_agg(
            json_build_object(
              'id', t.id,
              'ticketNumber', t.ticket_number,
              'status', t.status,
              'isWinner', t.is_winner
            )
          )
          FROM tickets t
          WHERE t.order_id = o.id
        ) as tickets
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.${sortColumn} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await pool.query(query, params);

    console.log("[getOrders] Found orders:", result.rows.length);

    // Transform snake_case to camelCase
    const orders = result.rows.map(row => ({
      id: row.id,
      orderNumber: row.order_number,
      userId: row.user_id,
      customerEmail: row.customer_email,
      customerFirstName: row.customer_first_name,
      customerLastName: row.customer_last_name,
      customerPhone: row.customer_phone,
      customerIdType: row.customer_id_type,
      customerIdNumber: row.customer_id_number,
      shippingAddress: row.shipping_address,
      shippingCity: row.shipping_city,
      shippingProvince: row.shipping_province,
      subtotal: parseFloat(row.subtotal),
      tax: parseFloat(row.tax),
      total: parseFloat(row.total),
      status: row.status,
      paymentMethod: row.payment_method,
      paymentReference: row.payment_reference,
      bankAccountUsed: row.bank_account_used,
      receiptUrl: row.receipt_url,
      customerNotes: row.customer_notes,
      adminNotes: row.admin_notes,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      rejectedBy: row.rejected_by,
      rejectedAt: row.rejected_at,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: row.items,
      tickets: row.tickets || []
    }));

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          total: totalOrders,
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          totalPages: Math.ceil(totalOrders / parseInt(limit as string))
        }
      }
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener órdenes"
    });
  }
}

// =====================================================
// GET: Single order with full details
// =====================================================
export async function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'raffleId', oi.raffle_id,
            'raffleTitle', oi.raffle_title,
            'raffleActivityNumber', oi.raffle_activity_number,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price,
            'subtotal', oi.subtotal
          )
        ) as items,
        (
          SELECT json_agg(
            json_build_object(
              'id', t.id,
              'ticketNumber', t.ticket_number,
              'status', t.status,
              'isWinner', t.is_winner
            )
          )
          FROM tickets t
          WHERE t.order_id = o.id
        ) as tickets
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.id = $1
      GROUP BY o.id
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada"
      });
    }

    const row = result.rows[0];
    const order = {
      id: row.id,
      orderNumber: row.order_number,
      userId: row.user_id,
      customerEmail: row.customer_email,
      customerFirstName: row.customer_first_name,
      customerLastName: row.customer_last_name,
      customerPhone: row.customer_phone,
      customerIdType: row.customer_id_type,
      customerIdNumber: row.customer_id_number,
      shippingAddress: row.shipping_address,
      shippingCity: row.shipping_city,
      shippingProvince: row.shipping_province,
      subtotal: parseFloat(row.subtotal),
      tax: parseFloat(row.tax),
      total: parseFloat(row.total),
      status: row.status,
      paymentMethod: row.payment_method,
      paymentReference: row.payment_reference,
      bankAccountUsed: row.bank_account_used,
      customerNotes: row.customer_notes,
      adminNotes: row.admin_notes,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at,
      rejectedBy: row.rejected_by,
      rejectedAt: row.rejected_at,
      rejectionReason: row.rejection_reason,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: row.items,
      tickets: row.tickets || []
    };

    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener orden"
    });
  }
}

// =====================================================
// PATCH: Update order status
// =====================================================
export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status, rejectionReason, adminNotes, paymentReference, bankAccountUsed } = req.body;
    const userId = (req as any).user?.userId;

    // Valid statuses
    const validStatuses = [
      "pending_payment",
      "pending_verification",
      "approved",
      "completed",
      "rejected",
      "cancelled"
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido"
      });
    }

    // Check if order exists
    const checkQuery = "SELECT status FROM orders WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada"
      });
    }

    const currentStatus = checkResult.rows[0].status;

    // Business rules
    if (currentStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "No se puede modificar una orden completada"
      });
    }

    if (currentStatus === "cancelled" && status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "No se puede reactivar una orden cancelada"
      });
    }

    // Build update query dynamically
    const updates: string[] = ["status = $2", "updated_at = CURRENT_TIMESTAMP"];
    const params: any[] = [id, status];
    let paramIndex = 3;

    // Handle status-specific fields
    if (status === "approved") {
      updates.push(`approved_by = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
      updates.push(`approved_at = CURRENT_TIMESTAMP`);
    }

    if (status === "rejected") {
      updates.push(`rejected_by = $${paramIndex}`);
      params.push(userId);
      paramIndex++;
      updates.push(`rejected_at = CURRENT_TIMESTAMP`);

      if (rejectionReason) {
        updates.push(`rejection_reason = $${paramIndex}`);
        params.push(rejectionReason);
        paramIndex++;
      }
    }

    if (adminNotes) {
      updates.push(`admin_notes = $${paramIndex}`);
      params.push(adminNotes);
      paramIndex++;
    }

    if (paymentReference) {
      updates.push(`payment_reference = $${paramIndex}`);
      params.push(paymentReference);
      paramIndex++;
    }

    if (bankAccountUsed) {
      updates.push(`bank_account_used = $${paramIndex}`);
      params.push(bankAccountUsed);
      paramIndex++;
    }

    const updateQuery = `
      UPDATE orders
      SET ${updates.join(", ")}
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(updateQuery, params);
    const updatedOrder = result.rows[0];

    // Si se aprueba la orden, asignar tickets automáticamente
    if (status === "approved") {
      // Obtener la cantidad de tickets de la orden
      const orderItemsQuery = await pool.query(
        "SELECT raffle_id, quantity FROM order_items WHERE order_id = $1",
        [id]
      );

      if (orderItemsQuery.rows.length > 0) {
        const orderItem = orderItemsQuery.rows[0];
        const raffleId = orderItem.raffle_id;
        const quantity = orderItem.quantity;

        console.log(`[updateOrderStatus] Approving order ${id}: Need ${quantity} tickets for raffle ${raffleId}`);

        // DEBUG: Contar todos los tickets del sorteo
        const totalTicketsQuery = await pool.query(
          `SELECT COUNT(*) as total FROM tickets WHERE raffle_id = $1`,
          [raffleId]
        );
        console.log(`[updateOrderStatus] DEBUG - Total tickets in raffle: ${totalTicketsQuery.rows[0].total}`);

        // DEBUG: Contar tickets disponibles
        const availableCountQuery = await pool.query(
          `SELECT COUNT(*) as available FROM tickets WHERE raffle_id = $1 AND status = 'available'`,
          [raffleId]
        );
        console.log(`[updateOrderStatus] DEBUG - Available tickets: ${availableCountQuery.rows[0].available}`);

        // Obtener tickets disponibles EXCLUYENDO números ganadores no revelados
        const availableTicketsQuery = await pool.query(
          `SELECT id, ticket_number FROM tickets
           WHERE raffle_id = $1
           AND status = 'available'
           AND id NOT IN (
             SELECT winner_ticket_id FROM prizes
             WHERE raffle_id = $1
             AND status = 'locked'
             AND winner_ticket_id IS NOT NULL
           )
           ORDER BY RANDOM()
           LIMIT $2`,
          [raffleId, quantity]
        );

        console.log(`[updateOrderStatus] Found ${availableTicketsQuery.rows.length} available tickets (excluding locked winners)`);

        if (availableTicketsQuery.rows.length < quantity) {
          throw new Error(`No hay suficientes tickets disponibles. Se necesitan ${quantity} pero solo hay ${availableTicketsQuery.rows.length}. Total en sorteo: ${totalTicketsQuery.rows[0].total}, Disponibles: ${availableCountQuery.rows[0].available}`);
        }

        // Asignar los tickets a la orden
        const ticketIds = availableTicketsQuery.rows.map(t => t.id);
        await pool.query(
          `UPDATE tickets
           SET status = 'sold', order_id = $1, user_id = $2, assigned_at = CURRENT_TIMESTAMP
           WHERE id = ANY($3)`,
          [id, updatedOrder.user_id, ticketIds]
        );

        console.log(`[updateOrderStatus] Assigned ${ticketIds.length} tickets to order ${id}`);

        // Verificar y revelar premios después de asignar tickets
        try {
          const revelationResult = await checkAndRevealPrizes(raffleId);
          if (revelationResult.revealed > 0) {
            console.log(`[updateOrderStatus] 🎉 Revealed ${revelationResult.revealed} prizes!`);
          }
        } catch (error) {
          console.error("[updateOrderStatus] Error checking prizes:", error);
          // No lanzar error, continuar con el flujo
        }
      }

      // Obtener números de boletos asignados
      const ticketsQuery = await pool.query(
        "SELECT ticket_number FROM tickets WHERE order_id = $1 ORDER BY ticket_number ASC",
        [id]
      );
      const ticketNumbers = ticketsQuery.rows.map(row => row.ticket_number);

      // Obtener información del sorteo
      const raffleQuery = await pool.query(
        `SELECT r.title FROM order_items oi
         INNER JOIN raffles r ON oi.raffle_id = r.id
         WHERE oi.order_id = $1 LIMIT 1`,
        [id]
      );

      if (ticketNumbers.length > 0 && raffleQuery.rows.length > 0) {
        await sendOrderApprovedEmail(
          updatedOrder.customer_email,
          updatedOrder.customer_first_name,
          updatedOrder.order_number,
          raffleQuery.rows[0].title,
          ticketNumbers
        );
      }
    }

    if (status === "rejected") {
      await sendOrderRejectedEmail(
        updatedOrder.customer_email,
        updatedOrder.customer_first_name,
        updatedOrder.order_number,
        rejectionReason || "No se pudo verificar el pago"
      );
    }

    res.json({
      success: true,
      data: updatedOrder,
      message: "Estado de orden actualizado"
    });
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar estado de orden"
    });
  }
}

// =====================================================
// PUT: Update order details
// =====================================================
export async function updateOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const allowedFields = [
      "paymentMethod",
      "paymentReference",
      "bankAccountUsed",
      "adminNotes",
      "customerNotes",
      "shippingAddress",
      "shippingCity",
      "shippingProvince"
    ];

    // Check if order exists
    const checkQuery = "SELECT status FROM orders WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada"
      });
    }

    const currentStatus = checkResult.rows[0].status;

    // Can't modify completed or cancelled orders
    if (["completed", "cancelled"].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: "No se puede modificar una orden completada o cancelada"
      });
    }

    // Build dynamic update query
    const updates: string[] = ["updated_at = CURRENT_TIMESTAMP"];
    const params: any[] = [id];
    let paramIndex = 2;

    // Map camelCase to snake_case
    const fieldMapping: Record<string, string> = {
      paymentMethod: "payment_method",
      paymentReference: "payment_reference",
      bankAccountUsed: "bank_account_used",
      adminNotes: "admin_notes",
      customerNotes: "customer_notes",
      shippingAddress: "shipping_address",
      shippingCity: "shipping_city",
      shippingProvince: "shipping_province"
    };

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const dbField = fieldMapping[field];
        updates.push(`${dbField} = $${paramIndex}`);
        params.push(req.body[field]);
        paramIndex++;
      }
    }

    if (updates.length === 1) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron campos para actualizar"
      });
    }

    const updateQuery = `
      UPDATE orders
      SET ${updates.join(", ")}
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(updateQuery, params);

    res.json({
      success: true,
      data: result.rows[0],
      message: "Orden actualizada exitosamente"
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar orden"
    });
  }
}

// =====================================================
// DELETE: Cancel order
// =====================================================
export async function deleteOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    // Check if order exists
    const checkQuery = "SELECT status FROM orders WHERE id = $1";
    const checkResult = await pool.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada"
      });
    }

    const currentStatus = checkResult.rows[0].status;

    // Can't cancel completed orders
    if (currentStatus === "completed") {
      return res.status(400).json({
        success: false,
        message: "No se puede cancelar una orden completada (histórica)"
      });
    }

    // Already cancelled
    if (currentStatus === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "La orden ya está cancelada"
      });
    }

    // Cancel order (soft delete)
    const updateQuery = `
      UPDATE orders
      SET
        status = 'cancelled',
        updated_at = CURRENT_TIMESTAMP,
        admin_notes = COALESCE(admin_notes || E'\\n\\n', '') || 'Cancelada por usuario: ' || $2
      WHERE id = $1
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [id, userId]);

    // Release reserved tickets if any
    await pool.query(
      `UPDATE tickets
       SET status = 'available', reserved_until = NULL, order_id = NULL
       WHERE order_id = $1 AND status = 'reserved'`,
      [id]
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: "Orden cancelada exitosamente"
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: "Error al cancelar orden"
    });
  }
}

// =====================================================
// Multer Configuration for Receipt Upload
// =====================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads/receipts");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const orderId = req.params.id;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `receipt-${orderId}-${timestamp}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Solo se permiten imágenes (JPG, PNG, WEBP)"));
    }
  }
});

export const uploadReceiptMiddleware = upload.single("receipt");

// =====================================================
// POST: Upload Receipt
// =====================================================
export async function uploadReceipt(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.userId;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionó ningún archivo"
      });
    }

    // Check if order exists and belongs to user (if customer)
    const orderQuery = await pool.query(
      "SELECT id, user_id, status, order_number FROM orders WHERE id = $1",
      [id]
    );

    if (orderQuery.rows.length === 0) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada"
      });
    }

    const order = orderQuery.rows[0];
    const userRole = (req as any).user?.role;

    // Check authorization (customer can only upload to their own orders)
    if (userRole === "customer" && order.user_id !== userId) {
      fs.unlinkSync(req.file.path);
      return res.status(403).json({
        success: false,
        message: "No tienes permiso para subir comprobante a esta orden"
      });
    }

    // Can't upload receipt to completed or cancelled orders
    if (["completed", "cancelled"].includes(order.status)) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: "No se puede subir comprobante a una orden completada o cancelada"
      });
    }

    // Delete old receipt file if exists
    const oldReceiptQuery = await pool.query(
      "SELECT receipt_url FROM orders WHERE id = $1",
      [id]
    );

    if (oldReceiptQuery.rows[0].receipt_url) {
      const oldFilePath = path.join(__dirname, "../../", oldReceiptQuery.rows[0].receipt_url);
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    // Update order with receipt URL and change status to pending_verification
    const receiptUrl = `/uploads/receipts/${req.file.filename}`;
    const updateQuery = `
      UPDATE orders
      SET
        receipt_url = $1,
        status = CASE
          WHEN status = 'pending_payment' THEN 'pending_verification'
          ELSE status
        END,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [receiptUrl, id]);

    res.json({
      success: true,
      data: {
        receiptUrl,
        orderNumber: order.order_number,
        newStatus: result.rows[0].status
      },
      message: "Comprobante subido exitosamente"
    });
  } catch (error) {
    // Delete uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error("Error uploading receipt:", error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : "Error al subir comprobante"
    });
  }
}

// =====================================================
// POST: Reenviar email con tickets asignados (Admin only)
// =====================================================
export async function resendTicketsEmail(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Obtener la orden
    const orderQuery = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [id]
    );

    if (orderQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Orden no encontrada"
      });
    }

    const order = orderQuery.rows[0];

    // Verificar que la orden esté aprobada
    if (order.status !== 'approved' && order.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: "Solo se pueden reenviar tickets de órdenes aprobadas"
      });
    }

    // Obtener números de boletos asignados
    const ticketsQuery = await pool.query(
      "SELECT ticket_number FROM tickets WHERE order_id = $1 ORDER BY ticket_number ASC",
      [id]
    );

    if (ticketsQuery.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Esta orden no tiene tickets asignados"
      });
    }

    const ticketNumbers = ticketsQuery.rows.map(row => row.ticket_number);

    // Obtener información del sorteo
    const raffleQuery = await pool.query(
      `SELECT r.title FROM order_items oi
       INNER JOIN raffles r ON oi.raffle_id = r.id
       WHERE oi.order_id = $1 LIMIT 1`,
      [id]
    );

    if (raffleQuery.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se encontró información del sorteo"
      });
    }

    // Enviar email
    const emailSent = await sendOrderApprovedEmail(
      order.customer_email,
      order.customer_first_name,
      order.order_number,
      raffleQuery.rows[0].title,
      ticketNumbers
    );

    if (emailSent) {
      console.log(`[resendTicketsEmail] Email reenviado para orden ${order.order_number} a ${order.customer_email}`);
      res.json({
        success: true,
        message: "Correo enviado exitosamente"
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Error al enviar el correo"
      });
    }

  } catch (error) {
    console.error("Error resending tickets email:", error);
    res.status(500).json({
      success: false,
      message: "Error al reenviar el correo"
    });
  }
}

// =====================================================
// GET: Consulta pública de números por email (sin auth)
// =====================================================
export async function consultTicketsByEmail(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "El email es requerido"
      });
    }

    console.log(`[consultTicketsByEmail] Consultando números para: ${email}`);

    // Buscar todas las órdenes aprobadas del usuario por email
    const ordersQuery = await pool.query(
      `SELECT
        o.id, o.order_number, o.total, o.status, o.created_at,
        o.customer_first_name, o.customer_last_name
      FROM orders o
      WHERE o.customer_email = $1
        AND o.status IN ('approved', 'completed')
      ORDER BY o.created_at DESC`,
      [email.toLowerCase()]
    );

    if (ordersQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No se encontraron órdenes aprobadas para este correo"
      });
    }

    console.log(`[consultTicketsByEmail] Encontradas ${ordersQuery.rows.length} órdenes`);

    // Para cada orden, obtener sus tickets y el título del sorteo
    const ordersWithTickets = await Promise.all(
      ordersQuery.rows.map(async (order) => {
        // Obtener tickets de la orden
        const ticketsQuery = await pool.query(
          `SELECT t.id, t.ticket_number, t.status, t.is_winner, t.raffle_id
           FROM tickets t
           JOIN order_items oi ON oi.raffle_id = t.raffle_id
           WHERE oi.order_id = $1 AND t.status = 'sold'
           ORDER BY t.ticket_number ASC`,
          [order.id]
        );

        // Obtener título del sorteo
        let raffleTitle = "Sorteo";
        if (ticketsQuery.rows.length > 0) {
          const raffleQuery = await pool.query(
            `SELECT title FROM raffles WHERE id = $1`,
            [ticketsQuery.rows[0].raffle_id]
          );
          if (raffleQuery.rows.length > 0) {
            raffleTitle = raffleQuery.rows[0].title;
          }
        }

        return {
          orderNumber: order.order_number,
          raffleTitle,
          total: parseFloat(order.total),
          status: order.status,
          createdAt: order.created_at,
          customerName: `${order.customer_first_name} ${order.customer_last_name}`,
          tickets: ticketsQuery.rows.map(t => ({
            id: t.id,
            ticketNumber: t.ticket_number,
            isWinner: t.is_winner,
            status: t.status
          }))
        };
      })
    );

    res.json({
      success: true,
      data: {
        email,
        orders: ordersWithTickets
      }
    });

  } catch (error) {
    console.error("Error consulting tickets:", error);
    res.status(500).json({
      success: false,
      message: "Error al consultar números"
    });
  }
}
