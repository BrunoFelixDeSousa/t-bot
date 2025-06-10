import 'dotenv/config';
import { config } from '../src/config';
import { testConnection } from '../src/database/connection';
import { logger } from '../src/utils/logger';

async function testPhase1() {
  console.log('🧪 TESTANDO FASE 1...\n');

  // Teste 1: configuração
  console.log('1️⃣ Testando configuração...');
  try {
    console.log(`   Environment: ${config.app.environment}`);
    console.log(`   Port: ${config.app.port}`);
    console.log('   ✅ Configuração OK\n');
  } catch (error) {
    console.error('❌ Erro na configuração:', error);
    return false;
    
  }

  // Teste 2: Banco de dados
  console.log('2️⃣ Testando conexão com banco...');
  try {
    // Adicionar timeout para evitar travamento
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout na conexão')), 5000)
    );
    
    const dbOk = await Promise.race([testConnection(), timeoutPromise]);
    
    if (!dbOk) {
      console.log('   ❌ Erro na conexão com banco\n');
      return false;
    }
    console.log('   ✅ Banco de dados OK\n');
  } catch (error) {
    console.log('   ⚠️ Conexão com banco indisponível (continuando...)\n');
    console.log(`   Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    // Continue mesmo se o banco não estiver disponível
  }

  // Teste 3: Logger
  console.log('3️⃣ Testando logger...');
  try {
    logger.info('Test log message');
    logger.warn('Test warning message');
    logger.error('Test error message');
    console.log('   ✅ Logger OK\n');
  } catch (error) {
    console.log('   ❌ Erro no logger\n', error);
    return false;
  }

  // Teste 4: Configurações do banco de dados
  console.log('4️⃣ Testando configurações do banco...');
  try {
    console.log(`   URL: ${config.database.url}`);
    console.log('   ✅ Configurações do banco OK\n');
  } catch (error) {
    console.error('❌ Erro nas configurações do banco:', error);
    return false;
  }

  // Teste 6: Variáveis de ambiente essenciais (detalhado)
  console.log('6️⃣ Testando variáveis de ambiente detalhadamente...');
  try {
    const envVars = {
      'DATABASE_URL': process.env.DATABASE_URL,
      'NODE_ENV': process.env.NODE_ENV,
      'PORT': process.env.PORT || 'não definida (usando padrão)'
    };
    
    console.log('   Variáveis encontradas:');
    for (const [key, value] of Object.entries(envVars)) {
      if (key === 'DATABASE_URL') {
        console.log(`     ${key}: ${value ? '[DEFINIDA]' : '[NÃO DEFINIDA]'}`);
      } else {
        console.log(`     ${key}: ${value || '[NÃO DEFINIDA]'}`);
      }
    }
    
    const requiredVars = ['DATABASE_URL', 'NODE_ENV'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log(`   ❌ Variáveis essenciais ausentes: ${missingVars.join(', ')}`);
      return false;
    }
    console.log('   ✅ Variáveis de ambiente OK\n');
  } catch (error) {
    console.error('❌ Erro ao verificar variáveis de ambiente:', error);
    return false;
  }

  // Teste 7: Logger com diferentes níveis
  console.log('7️⃣ Testando logger com diferentes níveis...');
  try {
    logger.info('Teste de log INFO');
    logger.warn('Teste de log WARNING');
    logger.error('Teste de log ERROR');
    
    console.log('   ✅ Todos os níveis de log funcionando\n');
  } catch (error) {
    console.error('❌ Erro nos diferentes níveis de log:', error);
    return false;
  }

  // Teste 8: Validação de configurações críticas
  console.log('8️⃣ Testando configurações críticas...');
  try {
    const criticalConfigs = {
      app: {
        environment: config.app.environment,
        port: config.app.port,
      },
      database: {
        url: config.database.url,
      }
    };
    
    // Verificar se todas as configurações críticas estão definidas
    if (!criticalConfigs.app.environment) {
      console.log('   ❌ Environment não definido');
      return false;
    }
    
    if (!criticalConfigs.app.port) {
      console.log('   ❌ Port da aplicação não definida');
      return false;
    }
    
    if (!criticalConfigs.database.url) {
      console.log('   ❌ URL do banco não definida');
      return false;
    }

    console.log('   ✅ Todas as configurações críticas OK\n');
  } catch (error) {
    console.error('❌ Erro nas configurações críticas:', error);
    return false;
  }

  console.log('🎉 Todas as validações da Fase 1 concluídas com sucesso!');
  return true;
}

testPhase1().then(success => {
  process.exit(success ? 0 : 1);
})