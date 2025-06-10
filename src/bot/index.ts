import { config } from '@/config';
import { logger } from '@/utils/logger';
import { Telegraf, session } from 'telegraf';
import { NotificationService } from '../services/notification.service';
import { GameContext } from './context';
import { BotHandlers } from './handlers';
import { userMiddleware } from './middleware';

/**
 * Classe principal do bot do Telegram
 * Gerencia a inicialização, middlewares, handlers e tratamento de erros
 */
export class TelegramBot {
  private bot: Telegraf<GameContext>;
  private handlers: BotHandlers;
  private notificationService: NotificationService;

  constructor() {
    this.bot = new Telegraf<GameContext>(config.telegram.botToken);
    this.handlers = new BotHandlers();
    this.notificationService = new NotificationService(this.bot);
    
    // Configure notification service in handlers
    this.handlers.setNotificationService(this.notificationService);

    this.setupMiddleware();
    this.setupHandlers();
    this.setupErrorHandling();
  }

  /**
   * Configura os middlewares do bot
   * Inclui session e middleware de usuário
   */
  private setupMiddleware() {
    // Session middleware
    this.bot.use(session({
      defaultSession: () => ({})
    }));

    // User middleware
    this.bot.use(userMiddleware);
  }

  /**
   * Registra todos os handlers do bot
   */
  private setupHandlers() {
    this.handlers.registerHandlers(this.bot);
  }

  /**
   * Configura o tratamento de erros global do bot
   */
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

  /**
   * Inicia o bot do Telegram
   * Configura o graceful shutdown e logging
   */
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

  /**
   * Para o bot do Telegram de forma graceful
   */
  async stop() {
    this.bot.stop();
    logger.info('🤖 Telegram bot stopped');
  }
}
