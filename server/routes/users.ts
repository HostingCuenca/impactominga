import { Request, Response } from "express";
import { pool } from "../db/config";

/**
 * GET /api/users
 * Obtiene lista de usuarios con filtros
 * Requiere autenticación y rol de admin
 */
export async function getUsers(req: Request, res: Response) {
  try {
    const { role, status, search, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        id,
        email,
        role,
        status,
        first_name,
        last_name,
        phone,
        id_type,
        id_number,
        email_verified,
        email_verified_at,
        last_login_at,
        created_at,
        updated_at
      FROM users
      WHERE deleted_at IS NULL
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Filtro por rol
    if (role && role !== "all") {
      query += ` AND role = $${paramIndex}`;
      params.push(role);
      paramIndex++;
    }

    // Filtro por estado
    if (status && status !== "all") {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    // Búsqueda por nombre, email, o documento
    if (search) {
      query += ` AND (
        first_name ILIKE $${paramIndex}
        OR last_name ILIKE $${paramIndex}
        OR email ILIKE $${paramIndex}
        OR id_number ILIKE $${paramIndex}
      )`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Obtener total de usuarios (para paginación)
    let countQuery = `SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL`;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (role && role !== "all") {
      countQuery += ` AND role = $${countParamIndex}`;
      countParams.push(role);
      countParamIndex++;
    }

    if (status && status !== "all") {
      countQuery += ` AND status = $${countParamIndex}`;
      countParams.push(status);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (
        first_name ILIKE $${countParamIndex}
        OR last_name ILIKE $${countParamIndex}
        OR email ILIKE $${countParamIndex}
        OR id_number ILIKE $${countParamIndex}
      )`;
      countParams.push(`%${search}%`);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].total);

    const users = result.rows.map(row => ({
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      idType: row.id_type,
      idNumber: row.id_number,
      emailVerified: row.email_verified,
      emailVerifiedAt: row.email_verified_at,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuarios"
    });
  }
}

/**
 * GET /api/users/:id
 * Obtiene detalle de un usuario
 * Requiere autenticación y rol de admin
 */
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        id,
        email,
        role,
        status,
        first_name,
        last_name,
        phone,
        id_type,
        id_number,
        email_verified,
        email_verified_at,
        last_login_at,
        created_at,
        updated_at
      FROM users
      WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    const row = result.rows[0];
    const user = {
      id: row.id,
      email: row.email,
      role: row.role,
      status: row.status,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      idType: row.id_type,
      idNumber: row.id_number,
      emailVerified: row.email_verified,
      emailVerifiedAt: row.email_verified_at,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener usuario"
    });
  }
}

/**
 * PUT /api/users/:id
 * Actualiza información de un usuario
 * Requiere autenticación y rol de admin
 */
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      idType,
      idNumber,
      email,
    } = req.body;

    // Verificar que el usuario existe
    const userCheck = await pool.query(
      "SELECT id, role FROM users WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    // Si se cambia el email, verificar que no exista
    if (email) {
      const emailCheck = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, id]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "El email ya está registrado"
        });
      }
    }

    // Construir query dinámico
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramIndex}`);
      values.push(firstName);
      paramIndex++;
    }

    if (lastName !== undefined) {
      updates.push(`last_name = $${paramIndex}`);
      values.push(lastName);
      paramIndex++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      values.push(phone);
      paramIndex++;
    }

    if (idType !== undefined) {
      updates.push(`id_type = $${paramIndex}`);
      values.push(idType);
      paramIndex++;
    }

    if (idNumber !== undefined) {
      updates.push(`id_number = $${paramIndex}`);
      values.push(idNumber);
      paramIndex++;
    }

    if (email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      values.push(email);
      paramIndex++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se proporcionaron campos para actualizar"
      });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, email, first_name, last_name, phone, id_type, id_number, role, status, updated_at
    `;

    const result = await pool.query(query, values);
    const row = result.rows[0];

    res.json({
      success: true,
      message: "Usuario actualizado exitosamente",
      data: {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        idType: row.id_type,
        idNumber: row.id_number,
        role: row.role,
        status: row.status,
        updatedAt: row.updated_at
      }
    });
  } catch (error: any) {
    console.error("Error updating user:", error);

    // Error de email duplicado
    if (error.code === '23505' && error.constraint === 'users_email_key') {
      return res.status(400).json({
        success: false,
        message: "El email ya está registrado"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al actualizar usuario"
    });
  }
}

/**
 * PATCH /api/users/:id/status
 * Actualiza el estado de un usuario
 * Requiere autenticación y rol de admin
 */
export async function updateUserStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validar estado
    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Estado inválido. Debe ser: ${validStatuses.join(', ')}`
      });
    }

    // No permitir cambiar el estado del super admin
    const userCheck = await pool.query(
      "SELECT role FROM users WHERE id = $1",
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    if (userCheck.rows[0].role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: "No se puede cambiar el estado de un super admin"
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, status`,
      [status, id]
    );

    res.json({
      success: true,
      message: "Estado actualizado exitosamente",
      data: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        status: result.rows[0].status
      }
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar estado del usuario"
    });
  }
}

/**
 * PATCH /api/users/:id/role
 * Actualiza el rol de un usuario
 * Requiere autenticación y rol de super_admin
 */
export async function updateUserRole(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    // Validar rol
    const validRoles = ['super_admin', 'admin', 'contadora', 'customer'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Rol inválido. Debe ser: ${validRoles.join(', ')}`
      });
    }

    // Verificar que el usuario actual es super_admin
    const currentUser = (req as any).user;
    if (currentUser.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: "Solo super admins pueden cambiar roles"
      });
    }

    const result = await pool.query(
      `UPDATE users
       SET role = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, email, role`,
      [role, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    res.json({
      success: true,
      message: "Rol actualizado exitosamente",
      data: {
        id: result.rows[0].id,
        email: result.rows[0].email,
        role: result.rows[0].role
      }
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar rol del usuario"
    });
  }
}

/**
 * DELETE /api/users/:id
 * Elimina (soft delete) un usuario
 * Requiere autenticación y rol de super_admin
 */
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Verificar que el usuario actual es super_admin
    const currentUser = (req as any).user;
    if (currentUser.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: "Solo super admins pueden eliminar usuarios"
      });
    }

    // No permitir eliminar al propio usuario
    if (currentUser.userId === id) {
      return res.status(400).json({
        success: false,
        message: "No puedes eliminar tu propia cuenta"
      });
    }

    // Verificar que el usuario existe y no es super_admin
    const userCheck = await pool.query(
      "SELECT role FROM users WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      });
    }

    if (userCheck.rows[0].role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: "No se puede eliminar a un super admin"
      });
    }

    // Soft delete
    await pool.query(
      `UPDATE users
       SET deleted_at = CURRENT_TIMESTAMP, status = 'inactive'
       WHERE id = $1`,
      [id]
    );

    res.json({
      success: true,
      message: "Usuario eliminado exitosamente"
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar usuario"
    });
  }
}

/**
 * GET /api/users/stats
 * Obtiene estadísticas de usuarios
 * Requiere autenticación y rol de admin
 */
export async function getUserStats(req: Request, res: Response) {
  try {
    const statsQuery = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'customer') as total_customers,
        COUNT(*) FILTER (WHERE role IN ('admin', 'contadora')) as total_staff,
        COUNT(*) FILTER (WHERE status = 'active') as active_users,
        COUNT(*) FILTER (WHERE status = 'inactive') as inactive_users,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended_users,
        COUNT(*) FILTER (WHERE email_verified = true) as verified_users,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as new_users_month
      FROM users
      WHERE deleted_at IS NULL
    `);

    const stats = statsQuery.rows[0];

    res.json({
      success: true,
      data: {
        totalCustomers: parseInt(stats.total_customers),
        totalStaff: parseInt(stats.total_staff),
        activeUsers: parseInt(stats.active_users),
        inactiveUsers: parseInt(stats.inactive_users),
        suspendedUsers: parseInt(stats.suspended_users),
        verifiedUsers: parseInt(stats.verified_users),
        newUsersThisMonth: parseInt(stats.new_users_month)
      }
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas"
    });
  }
}
