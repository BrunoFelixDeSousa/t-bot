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
  const dbOk = await testConnection();

  if (!dbOk) {
    console.log('   ❌ Erro na conexão com banco\n');
    return false;
  }
  console.log('   ✅ Banco de dados OK\n');

  // Teste 3: Logger
  console.log('3️⃣ Testando logger...');
  try {
    logger.info('Test log message');
    console.log('   ✅ Logger OK\n');
  } catch (error) {
    console.log('   ❌ Erro no logger\n', error);
    return false;
  }

  console.log('🎉 Fase 1 validada com sucesso!');
  return true;
}

testPhase1().then(success => {
  process.exit(success ? 0 : 1);
})