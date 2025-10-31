import pkg from 'pg';
const { Client } = pkg;

const config = {
  host: '167.235.20.41',
  user: 'postgres',
  password: 'AgroCursos2025',
  database: 'proyectominga',
  port: 5432,
  ssl: false
};

async function testConnection() {
  const client = new Client(config);

  try {
    console.log('🔌 Intentando conectar a PostgreSQL...');
    console.log(`📍 Host: ${config.host}:${config.port}`);
    console.log(`🗄️  Database: ${config.database}`);

    await client.connect();
    console.log('✅ Conexión exitosa!');

    // Probar query simple
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('\n⏰ Hora del servidor:', result.rows[0].current_time);
    console.log('📦 Versión PostgreSQL:', result.rows[0].pg_version.split(' ')[0] + ' ' + result.rows[0].pg_version.split(' ')[1]);

    // Verificar tablas existentes
    const tables = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Tablas existentes:', tables.rows.length);
    if (tables.rows.length > 0) {
      console.log('Tablas:');
      tables.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('  (Base de datos vacía)');
    }

    await client.end();
    console.log('\n✅ Conexión cerrada correctamente');

  } catch (err) {
    console.error('\n❌ Error de conexión:', err.message);
    console.error('Código de error:', err.code);

    if (err.code === 'ECONNREFUSED') {
      console.error('\n💡 Posibles causas:');
      console.error('  - PostgreSQL no está corriendo');
      console.error('  - Firewall bloqueando el puerto 5432');
      console.error('  - IP o puerto incorrectos');
    } else if (err.code === '28P01') {
      console.error('\n💡 Error de autenticación: Usuario o contraseña incorrectos');
    } else if (err.code === '3D000') {
      console.error('\n💡 La base de datos no existe');
    }

    process.exit(1);
  }
}

testConnection();
