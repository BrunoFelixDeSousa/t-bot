import { Config } from '@/types';

// Load environment variables from .env file
export const config: Config = {
  app: {
    environment: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || '3000'),
  },
  database: {
    url: process.env.DATABASE_URL!,
  },
  admin: {
    telegramIds: process.env.ADMIN_TELEGRAM_IDS
      ? [Number(process.env.ADMIN_TELEGRAM_IDS)]
      : [],
  },
};

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente obrigatória: ${envVar}`);
  }
}
