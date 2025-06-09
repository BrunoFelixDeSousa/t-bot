import { config } from "@/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from './schema/schema';

// export const db = drizzle(sql, {
//   schema,
//   logger: config.app.environment === 'development'
// });

const sql = postgres(config.database.url);
export const db = drizzle({ client: sql, schema: schema, logger: config.app.environment === 'development' });

export async function testConnection() {
  try {
    await sql`SELECT 1`;
    console.log('✅ Conexão com banco de dados estabelecida');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com banco:', error);
    return false;
  }
}

export async function closeConnection() {
  try {
    await sql.end();
    console.log('✅ Conexão com banco de dados fechada');
  } catch (error) {
    console.error('❌ Erro ao fechar conexão com banco:', error);
  }
}

export type Database = typeof db;
export type Schema = typeof schema;