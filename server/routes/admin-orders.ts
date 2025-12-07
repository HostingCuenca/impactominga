import { Request, Response } from "express";
import { pool } from "../db/config";
import bcrypt from "bcrypt";
import { sendOrderConfirmationEmail } from "../services/email";

// =====================================================
// POST: Crear orden manual desde el admin
// =====================================================
export async function createManualOrder(req: Request, res: Response) {
  try {
    const adminUserId = (req as any).user?.userId;
    const {
      raffleId,
      quantity,
      customerData,
      paymentMethod = "cash",
      paymentReference,
      adminNotes,
    } = req.body;

    // Validar campos requeridos
    if (!raffleId || !quantity || !customerData) {
      return res.status(400).json({
        success: false,
        message: "Faltan campos requeridos",
      });
    }

    const { email, firstName, lastName, phone, idType, idNumber } = customerData;

    if (!email || !firstName || !lastName || !idType || !idNumber) {
      return res.status(400).json({
        success: false,
        message: "Faltan datos del cliente",
      });
    }

    // Validar cantidad mínima
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "La cantidad debe ser al menos 1",
      });
    }

    // 1. Buscar o crear usuario
    let userId: string;
    let userEmail: string;
    let userFirstName: string;

    const existingUser = await pool.query(
      "SELECT id, email, first_name FROM users WHERE email = $1 OR id_number = $2",
      [email.toLowerCase(), idNumber]
    );

    if (existingUser.rows.length > 0) {
      // Usuario ya existe
      const user = existingUser.rows[0];
      userId = user.id;
      userEmail = user.email;
      userFirstName = user.first_name;
      console.log(`[createManualOrder] Usuario existente encontrado: ${userEmail}`);
    } else {
      // Crear usuario nuevo con contraseña por defecto
      const hashedPassword = await bcrypt.hash("impactopassword", 10);
      const newUserResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, phone, id_type, id_number, role, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'customer', 'active')
         RETURNING id, email, first_name`,
        [email.toLowerCase(), hashedPassword, firstName, lastName, phone, idType, idNumber]
      );
      userId = newUserResult.rows[0].id;
      userEmail = newUserResult.rows[0].email;
      userFirstName = newUserResult.rows[0].first_name;
      console.log(`[createManualOrder] Usuario nuevo creado: ${userEmail}`);
    }

    // 2. Verificar sorteo activo
    const raffleQuery = await pool.query(
      `SELECT id, title, activity_number, ticket_price, status, total_tickets
       FROM raffles WHERE id = $1`,
      [raffleId]
    );

    if (raffleQuery.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sorteo no encontrado",
      });
    }

    const raffle = raffleQuery.rows[0];

    if (raffle.status !== "active") {
      return res.status(400).json({
        success: false,
        message: "El sorteo no está activo",
      });
    }

    // 3. Verificar disponibilidad de tickets
    const ticketsSoldQuery = await pool.query(
      `SELECT COUNT(*) as sold FROM tickets WHERE raffle_id = $1 AND status = 'sold'`,
      [raffleId]
    );
    const ticketsSold = parseInt(ticketsSoldQuery.rows[0].sold || 0);
    const ticketsAvailable = raffle.total_tickets - ticketsSold;

    if (ticketsAvailable < quantity) {
      return res.status(400).json({
        success: false,
        message: `Solo quedan ${ticketsAvailable} boletos disponibles`,
      });
    }

    // 4. Calcular montos (precio unitario * cantidad)
    const unitPrice = 1.0; // $1 USD por boleto
    const subtotal = quantity * unitPrice;
    const tax = 0; // IVA 0%
    const total = subtotal;

    // 5. Generar número de orden único
    const orderNumber = `IM-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // 6. Crear orden en estado pending_verification (para que el admin la apruebe después)
    const orderResult = await pool.query(
      `INSERT INTO orders (
        order_number, user_id,
        customer_email, customer_first_name, customer_last_name,
        customer_phone, customer_id_type, customer_id_number,
        subtotal, tax, total,
        status, payment_method, payment_reference, admin_notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        orderNumber,
        userId,
        email,
        firstName,
        lastName,
        phone || null,
        idType,
        idNumber,
        subtotal,
        tax,
        total,
        "pending_verification", // Estado inicial - requiere aprobación del admin
        paymentMethod,
        paymentReference || `Pago en efectivo - Creado por admin`,
        adminNotes || `Orden manual creada por admin (ID: ${adminUserId})`,
      ]
    );

    const order = orderResult.rows[0];

    // 7. Crear order item
    await pool.query(
      `INSERT INTO order_items (
        order_id, raffle_id, raffle_title, raffle_activity_number,
        quantity, unit_price, subtotal
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [order.id, raffleId, raffle.title, raffle.activity_number, quantity, unitPrice, subtotal]
    );

    // 8. Enviar email de confirmación al cliente
    await sendOrderConfirmationEmail(
      userEmail,
      userFirstName,
      orderNumber,
      total,
      raffle.title,
      quantity
    );

    console.log(`[createManualOrder] Orden manual creada: ${orderNumber} para ${userEmail}`);

    res.status(201).json({
      success: true,
      data: {
        orderId: order.id,
        orderNumber: order.order_number,
        userId,
        userEmail,
        total,
        status: order.status,
        raffleTitle: raffle.title,
        quantity,
      },
      message: "Orden manual creada exitosamente. Apruébala para asignar los números.",
    });
  } catch (error: any) {
    console.error("Error creando orden manual:", error);

    if (error.code === "23505") {
      // Duplicate key
      return res.status(400).json({
        success: false,
        message: "Este correo o cédula ya está registrado",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear orden manual",
    });
  }
}
