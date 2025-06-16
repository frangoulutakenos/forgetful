const { Client } = require('pg');
require('dotenv').config();

async function cleanupDatabase() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('🔗 Conectado a la base de datos');

    const deleteTasksResult = await client.query('DELETE FROM tasks');
    console.log(`🗑️  Eliminadas ${deleteTasksResult.rowCount} tareas`);

    try {
      await client.query('DROP TABLE IF EXISTS user_tokens CASCADE');
      console.log('🗑️  Tabla user_tokens eliminada');
    } catch (error) {
      console.log('ℹ️  Tabla user_tokens no existía');
    }

    try {
      await client.query('DROP TABLE IF EXISTS users CASCADE');
      console.log('🗑️  Tabla users eliminada');
    } catch (error) {
      console.log('ℹ️  Tabla users no existía');
    }

    console.log('✅ Base de datos limpia y lista para OAuth');

  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

cleanupDatabase();
