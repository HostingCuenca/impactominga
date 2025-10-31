import pkg from 'pg';
const { Pool } = pkg;

// Configuración del pool de conexiones
export const pool = new Pool({
  host: process.env.DB_HOST || '167.235.20.41',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'AgroCursos2025',
  database: process.env.DB_NAME || 'proyectominga',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Función para testear conexión
export async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as time, version() as version');
    client.release();
    return {
      success: true,
      time: result.rows[0].time,
      version: result.rows[0].version
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      code: err.code
    };
  }
}

// Función para ejecutar queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
}
