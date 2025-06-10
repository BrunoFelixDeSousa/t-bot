import { Config } from '../types';

export const config: Config = {
  telegram: {
    botToken: process.env.BOT_TOKEN!,
    botUsername: process.env.BOT_USERNAME!,
  },
  app: {
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000'),
  },
  database: {
    url: process.env.DATABASE_URL!,
  },
  admin: {
    telegramIds: process.env.ADMIN_TELEGRAM_ID
      ? [parseInt(process.env.ADMIN_TELEGRAM_ID)]
      : [],
  },
};

// Validação atualizada
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'BOT_TOKEN', 'BOT_USERNAME'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente obrigatória: ${envVar}`);
  }
}
