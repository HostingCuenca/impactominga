import { Request, Response } from "express";
import { pool } from "../db/config";

/**
 * GET /api/settings
 * Obtiene todas las configuraciones del sistema
 * Requiere autenticación y rol de admin
 */
export async function getSettings(req: Request, res: Response) {
  try {
    const result = await pool.query(
      `SELECT id, key, value, description, category, updated_at
       FROM system_settings
       ORDER BY category, key`
    );

    const settings = result.rows.map(row => ({
      id: row.id,
      key: row.key,
      value: row.value,
      description: row.description,
      category: row.category,
      updatedAt: row.updated_at
    }));

    // Agrupar por categoría
    const grouped = settings.reduce((acc: any, setting) => {
      const category = setting.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(setting);
      return acc;
    }, {});

    res.json({
      success: true,
      data: grouped
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener configuraciones"
    });
  }
}

/**
 * PUT /api/settings/:key
 * Actualiza una configuración específica
 * Requiere autenticación y rol de admin
 */
export async function updateSetting(req: Request, res: Response) {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = (req as any).user?.userId;

    if (value === undefined) {
      return res.status(400).json({
        success: false,
        message: "El campo 'value' es requerido"
      });
    }

    // Verificar que la configuración existe
    const checkResult = await pool.query(
      "SELECT id FROM system_settings WHERE key = $1",
      [key]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configuración no encontrada"
      });
    }

    // Actualizar configuración
    const result = await pool.query(
      `UPDATE system_settings
       SET value = $1, updated_by = $2, updated_at = CURRENT_TIMESTAMP
       WHERE key = $3
       RETURNING id, key, value, description, category, updated_at`,
      [value, userId, key]
    );

    const row = result.rows[0];

    res.json({
      success: true,
      message: "Configuración actualizada exitosamente",
      data: {
        id: row.id,
        key: row.key,
        value: row.value,
        description: row.description,
        category: row.category,
        updatedAt: row.updated_at
      }
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar configuración"
    });
  }
}

/**
 * POST /api/settings
 * Crea una nueva configuración
 * Requiere autenticación y rol de super_admin
 */
export async function createSetting(req: Request, res: Response) {
  try {
    const { key, value, description, category } = req.body;
    const userId = (req as any).user?.userId;

    // Verificar que el usuario es super_admin
    const currentUser = (req as any).user;
    if (currentUser.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: "Solo super admins pueden crear configuraciones"
      });
    }

    if (!key || !value) {
      return res.status(400).json({
        success: false,
        message: "Los campos 'key' y 'value' son requeridos"
      });
    }

    // Verificar que la key no exista
    const checkResult = await pool.query(
      "SELECT id FROM system_settings WHERE key = $1",
      [key]
    );

    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una configuración con esa clave"
      });
    }

    const result = await pool.query(
      `INSERT INTO system_settings (key, value, description, category, updated_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, key, value, description, category, created_at`,
      [key, value, description, category || 'general', userId]
    );

    const row = result.rows[0];

    res.status(201).json({
      success: true,
      message: "Configuración creada exitosamente",
      data: {
        id: row.id,
        key: row.key,
        value: row.value,
        description: row.description,
        category: row.category,
        createdAt: row.created_at
      }
    });
  } catch (error: any) {
    console.error("Error creating setting:", error);

    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: "Ya existe una configuración con esa clave"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error al crear configuración"
    });
  }
}

/**
 * DELETE /api/settings/:key
 * Elimina una configuración
 * Requiere autenticación y rol de super_admin
 */
export async function deleteSetting(req: Request, res: Response) {
  try {
    const { key } = req.params;

    // Verificar que el usuario es super_admin
    const currentUser = (req as any).user;
    if (currentUser.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: "Solo super admins pueden eliminar configuraciones"
      });
    }

    // Proteger configuraciones críticas
    const protectedKeys = [
      'tax_rate',
      'whatsapp_number',
      'company_name',
      'company_email'
    ];

    if (protectedKeys.includes(key)) {
      return res.status(403).json({
        success: false,
        message: "Esta configuración está protegida y no puede ser eliminada"
      });
    }

    const result = await pool.query(
      "DELETE FROM system_settings WHERE key = $1 RETURNING id",
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Configuración no encontrada"
      });
    }

    res.json({
      success: true,
      message: "Configuración eliminada exitosamente"
    });
  } catch (error) {
    console.error("Error deleting setting:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar configuración"
    });
  }
}
