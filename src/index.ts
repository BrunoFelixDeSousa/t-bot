import { testConnection } from '@/database/connection';
import { appLogger } from '@/utils/logger';

class Application {
  async start() {
    try {
      appLogger.info('🚀 Iniciando aplicação...');

      // Testar conexão com o banco de dados
      const dbConnected = await testConnection();
      if (!dbConnected) {
        throw new Error('Falha na conexão com banco de dados');
      }

      appLogger.info('✅ Fase 1 completa - Fundação configurada!');
    } catch (error) {
      appLogger.error('❌ Erro ao iniciar a aplicação:', error);
      process.exit(1);
    }
  }
}

const app = new Application();
app.start();
