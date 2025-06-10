import 'dotenv/config';
import { TelegramBot } from '../src/bot';
import { config } from '../src/config';

async function testPhase3() {
  console.log('🧪 Testando Fase 3...\\n');

  try {
    // Teste 1: Configuração do bot
    console.log('1️⃣ Testando configuração do bot...');
    if (!config.telegram.botToken) {
      throw new Error('BOT_TOKEN não configurado');
    }
    console.log(`   ✅ Bot token configurado\\n`);

    // Teste 2: Inicialização do bot
    console.log('2️⃣ Testando inicialização do bot...');
    const bot = new TelegramBot();
    console.log('   ✅ Bot inicializado com sucesso\\n');

    // Teste 3: Parar bot (para não interferir)
    console.log('3️⃣ Testando parada do bot...');
    await bot.stop();
    console.log('   ✅ Bot parado com sucesso\\n');

    console.log('🎉 Fase 3 validada com sucesso!');
    console.log('\\n💡 Para testar o bot completamente:');
    console.log('   1. Configure BOT_TOKEN no .env');
    console.log('   2. Execute: npm run dev');
    console.log('   3. Teste os comandos no Telegram');

    return true;

  } catch (error) {
    console.error('❌ Erro na Fase 3:', error);
    return false;
  }
}

testPhase3().then(success => {
  process.exit(success ? 0 : 1);
});
