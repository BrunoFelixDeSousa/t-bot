import { Config } from '../types';

/**
 * Configurações da aplicação carregadas das variáveis de ambiente
 * Contém todas as configurações necessárias para o funcionamento do bot
 */
export const config: Config = {
  /** Configurações do Telegram */
  telegram: {
    /** Token do bot fornecido pelo BotFather */
    botToken: process.env.BOT_TOKEN!,
    /** Username do bot (sem @) */
    botUsername: process.env.BOT_USERNAME!,
  },
  /** Configurações da aplicação */
  app: {
    /** Ambiente de execução (development, production, test) */
    environment: process.env.NODE_ENV || 'development',
    /** Porta para o servidor (se necessário) */
    port: parseInt(process.env.PORT || '3000'),
  },
  /** Configurações do banco de dados */
  database: {
    /** URL de conexão com PostgreSQL */
    url: process.env.DATABASE_URL!,
  },
  /** Configurações dos jogos */
  game: {
    /** Valor mínimo de aposta em R$ */
    minBetAmount: parseFloat(process.env.MIN_BET_AMOUNT || '5.00'),
    /** Valor máximo de aposta em R$ */
    maxBetAmount: parseFloat(process.env.MAX_BET_AMOUNT || '1000.00'),
    /** Percentual de rake da casa (%) */
    rakePercentage: parseFloat(process.env.RAKE_PERCENTAGE || '5.0'),
    /** Timeout para jogos em minutos */
    gameTimeout: parseInt(process.env.GAME_TIMEOUT || '15'), // 15 minutos (alinhado com projeto game)
    /** Máximo de jogos ativos por usuário */
    maxActiveGames: parseInt(process.env.MAX_ACTIVE_GAMES || '5'), // Máximo de jogos ativos por usuário
  },
  /** Configurações de administração */
  admin: {
    /** IDs do Telegram dos administradores */
    telegramIds: process.env.ADMIN_TELEGRAM_ID
      ? [parseInt(process.env.ADMIN_TELEGRAM_ID)]
      : [],
  },
};

/**
 * Lista de variáveis de ambiente obrigatórias para o funcionamento da aplicação
 */
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'BOT_TOKEN', 'BOT_USERNAME'];

// Validação das variáveis de ambiente obrigatórias
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Variável de ambiente obrigatória: ${envVar}`);
  }
}
