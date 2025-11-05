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
    const decoded = verifyToken(req);

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

    // If customer, only show their own orders
    if (decoded.role === "customer") {
      conditions.push(`o.user_id = $${paramIndex}`);
      params.push(decoded.userId);
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

    // Search
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

    const validSortColumns = ["created_at", "updated_at", "total", "status", "order_number"];
    const sortColumn = validSortColumns.includes(sortBy as string) ? sortBy : "created_at";
    const sortDirection = sortOrder === "ASC" ? "ASC" : "DESC";

    // Get total count
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
      params
    );
    const totalOrders = parseInt(countResult.rows[0].total);

    // Get orders
    params.push(limit);
    params.push(offset);

    const query = `
      SELECT
        o.*,
        json_agg(
          json_build_object(
            'id', oi.id,
            'raffleId', oi.raffle_id,
            'raffleTitle', r.title,
            'packageId', oi.package_id,
            'quantity', oi.quantity,
            'unitPrice', oi.unit_price,
            'subtotal', oi.subtotal,
            'assignedTickets', (
              SELECT json_agg(t.ticket_number ORDER BY t.ticket_number)
              FROM tickets t
              WHERE t.order_item_id = oi.id
            )
          ) ORDER BY oi.id
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN raffles r ON oi.raffle_id = r.id
      ${whereClause}
      GROUP BY o.id
      ORDER BY o.${sortColumn} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const result = await db.query(query, params);

    const orders = result.rows.map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      userId: order.user_id,
      customerEmail: order.customer_email,
      customerFirstName: order.customer_first_name,
      customerLastName: order.customer_last_name,
      customerPhone: order.customer_phone,
      customerIdType: order.customer_id_type,
      customerIdNumber: order.customer_id_number,
      shippingAddress: order.shipping_address,
      shippingCity: order.shipping_city,
      shippingProvince: order.shipping_province,
      paymentMethod: order.payment_method,
      status: order.status,
      subtotal: parseFloat(order.subtotal),
      taxAmount: parseFloat(order.tax_amount),
      total: parseFloat(order.total),
      receiptUrl: order.receipt_url,
      customerNotes: order.customer_notes,
      adminNotes: order.admin_notes,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: order.items.filter((item: any) => item.id !== null)
    }));

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / parseInt(limit as string))
      }
    });
  } catch (error: any) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener órdenes",
      error: error.message
    });
  }
}
