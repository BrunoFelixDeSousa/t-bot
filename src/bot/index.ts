import { config } from '@/config';
import { logger } from '@/utils/logger';
import { Telegraf, session } from 'telegraf';
import { GameContext } from './context';
import { BotHandlers } from './handlers';
import { userMiddleware } from './middleware';

export class TelegramBot {
  private bot: Telegraf<GameContext>;
  private handlers: BotHandlers;

  constructor() {
    this.bot = new Telegraf<GameContext>(config.telegram.botToken);
    this.handlers = new BotHandlers();

    this.setupMiddleware();
    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupMiddleware() {
    // Session middleware
    this.bot.use(session({
      defaultSession: () => ({})
    }));

    // User middleware
    this.bot.use(userMiddleware);
  }

  private setupHandlers() {
    this.handlers.registerHandlers(this.bot);
  }

  private setupErrorHandling() {
    this.bot.catch((err, ctx) => {
      logger.error('Bot error:', {
        error: err instanceof Error ? err.message : 'Unknown error',
        userId: ctx.from?.id,
        updateType: ctx.updateType
      });

      ctx.reply('❌ Ocorreu um erro. Tente novamente.');
    });
  }

  async start() {
    try {
      await this.bot.launch();
      logger.info('🤖 Telegram bot started successfully', {
        botUsername: config.telegram.botUsername
      });

      // Graceful shutdown
      process.once('SIGINT', () => this.bot.stop('SIGINT'));
      process.once('SIGTERM', () => this.bot.stop('SIGTERM'));

    } catch (error) {
      logger.error('Failed to start Telegram bot:', error);
      throw error;
    }
  }

  async stop() {
    this.bot.stop();
    logger.info('🤖 Telegram bot stopped');
  }
}
