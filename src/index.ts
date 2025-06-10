import 'dotenv/config';
import { TelegramBot } from './bot';
import { testConnection } from './database/connection';
import { appLogger } from './utils/logger';

class Application {
  private bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot();
  }

  async start() {
    try {
      appLogger.info('🚀 Iniciando aplicação...');

      // Testar conexão com banco
      const dbConnected = await testConnection();
      if (!dbConnected) {
        throw new Error('Falha na conexão com banco de dados');
      }

      // Iniciar bot
      await this.bot.start();

      appLogger.info('✅ Aplicação iniciada com sucesso!');

    } catch (error) {
      appLogger.error('Erro ao iniciar aplicação:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown() {
    const shutdown = async (signal: string) => {
      appLogger.info(`Recebido sinal ${signal}. Encerrando aplicação...`);

      try {
        await this.bot.stop();
        appLogger.info('✅ Aplicação encerrada graciosamente');
        process.exit(0);
      } catch (error) {
        appLogger.error('Erro ao encerrar aplicação:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

const app = new Application();
app.start();
