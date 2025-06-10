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
  game: {
    minBetAmount: parseFloat(process.env.MIN_BET_AMOUNT || '5.00'),
    maxBetAmount: parseFloat(process.env.MAX_BET_AMOUNT || '1000.00'),
    rakePercentage: parseFloat(process.env.RAKE_PERCENTAGE || '5.0'),
    gameTimeout: parseInt(process.env.GAME_TIMEOUT || '15'), // 15 minutos (alinhado com projeto game)
    maxActiveGames: parseInt(process.env.MAX_ACTIVE_GAMES || '5'), // Máximo de jogos ativos por usuário
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
