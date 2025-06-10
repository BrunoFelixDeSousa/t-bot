import 'dotenv/config';
import { TelegramBot } from './bot';
import { testConnection } from './database/connection';
import { appLogger } from './utils/logger';

/**
 * Classe principal da aplicação que gerencia o bot do Telegram
 * e a conexão com o banco de dados
 */
class Application {
  private bot: TelegramBot;

  constructor() {
    this.bot = new TelegramBot();
  }

  /**
   * Inicia a aplicação conectando ao banco de dados e iniciando o bot
   * @throws {Error} Quando falha na conexão com o banco de dados
   */
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

  /**
   * Configura o encerramento gracioso da aplicação
   * Escuta por sinais SIGTERM e SIGINT para encerrar adequadamente
   */
  private setupGracefulShutdown() {
    /**
     * Função interna para processar o encerramento
     * @param signal - Sinal recebido (SIGTERM ou SIGINT)
     */
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

// Inicializar e executar a aplicação
const app = new Application();
app.start();
