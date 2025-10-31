import { Request, Response } from "express";
import { testConnection, pool } from "../db/config";

export async function handleDbTest(_req: Request, res: Response) {
  try {
    const connectionTest = await testConnection();

    if (!connectionTest.success) {
      return res.status(500).json({
        success: false,
        error: connectionTest.error,
        code: connectionTest.code,
        message: 'Error al conectar con la base de datos'
      });
    }

    // Obtener tablas existentes
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    return res.json({
      success: true,
      message: 'Conexión exitosa a PostgreSQL',
      database: process.env.DB_NAME,
      host: process.env.DB_HOST,
      serverTime: connectionTest.time,
      postgresVersion: connectionTest.version.split(' ')[1],
      tablesCount: tablesResult.rows.length,
      tables: tablesResult.rows.map(r => r.table_name)
    });

  } catch (err: any) {
    console.error('Error en DB test:', err);
    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
