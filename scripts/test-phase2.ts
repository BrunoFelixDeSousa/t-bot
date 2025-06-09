import 'dotenv/config';
import { UserService } from '../src/services/user.service';

async function testPhase2() {
  console.log('🧪 TESTANDO FASE 2...\n');

  const userService = new UserService();

  try {
    // Teste 1: Criar usuário
    // console.log('1️⃣ Testando criação de usuário...');
    // const newUser = await userService.createUser({
    //   telegramId: '999888777',
    //   firstName: 'Teste',
    //   lastName: 'User',
    //   username: 'test_user'
    // });
    // console.log(`   ✅ Usuário criado: ${newUser.firstName} (ID: ${newUser.id})\n`);

    // Teste 2: Buscar usuário
    console.log('2️⃣ Testando busca de usuário...');
    const foundUser = await userService.getUserByTelegramId('999888777');
    if (foundUser) {
      console.log(`   ✅ Usuário encontrado: ${foundUser.firstName}\n`);
    } else {
      throw new Error('Usuário não encontrado');
    }

    // Teste 3: Atualizar saldo
    console.log('3️⃣ Testando atualização de saldo...');
    await userService.updateUserBalance(foundUser.id, '100.00', 'add');
    const updatedUser = await userService.getUserById(foundUser.id);
    console.log(`   ✅ Saldo atualizado: R$ ${updatedUser?.balance}\n`);

    // Teste 4: Histórico de transações
    console.log('4️⃣ Testando histórico de transações...');
    const transactions = await userService.getUserTransactions(foundUser.id);
    console.log(`   ✅ ${transactions.length} transação(ões) encontrada(s)\n`);

    // Teste 5: Teste de subtração de saldo
    console.log('5️⃣ Testando subtração de saldo...');
    await userService.updateUserBalance(foundUser.id, '25.50', 'subtract');
    const userAfterSubtract = await userService.getUserById(foundUser.id);
    console.log(`   ✅ Saldo após subtração: R$ ${userAfterSubtract?.balance}\n`);

    // Teste 6: Teste de saldo insuficiente
    console.log('6️⃣ Testando saldo insuficiente...');
    try {
      await userService.updateUserBalance(foundUser.id, '1000.00', 'subtract');
      throw new Error('Deveria ter falhado por saldo insuficiente');
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Saldo insuficiente')) {
        console.log(`   ✅ Erro esperado capturado: ${error.message}\n`);
      } else {
        throw error;
      }
    }

    // Teste 7: Teste de valor inválido
    console.log('7️⃣ Testando valor inválido...');
    try {
      await userService.updateUserBalance(foundUser.id, 'abc', 'add');
      throw new Error('Deveria ter falhado por valor inválido');
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Valor inválido')) {
        console.log(`   ✅ Erro esperado capturado: ${error.message}\n`);
      } else {
        throw error;
      }
    }

    // Teste 8: Teste de usuário inexistente
    console.log('8️⃣ Testando usuário inexistente...');
    try {
      await userService.getUserByTelegramId('999999999');
      throw new Error('Deveria ter falhado por usuário inexistente');
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Usuário não encontrado')) {
        console.log(`   ✅ Erro esperado capturado: ${error.message}\n`);
      } else {
        throw error;
      }
    }

    // Teste 9: Múltiplas transações
    console.log('9️⃣ Testando múltiplas transações...');
    await userService.updateUserBalance(foundUser.id, '10.00', 'add');
    await userService.updateUserBalance(foundUser.id, '5.00', 'subtract');
    await userService.updateUserBalance(foundUser.id, '15.25', 'add');
    
    const finalUser = await userService.getUserById(foundUser.id);
    const allTransactions = await userService.getUserTransactions(foundUser.id);
    console.log(`   ✅ Saldo final: R$ ${finalUser?.balance}`);
    console.log(`   ✅ Total de transações: ${allTransactions.length}\n`);

    // Teste 10: Validação de histórico detalhado
    console.log('🔟 Testando validação de histórico detalhado...');
    const recentTransactions = await userService.getUserTransactions(foundUser.id, 5);
    console.log(`   ✅ Últimas 5 transações recuperadas: ${recentTransactions.length}`);
    
    if (recentTransactions.length > 0) {
      const lastTransaction = recentTransactions[0];
      console.log(`   ✅ Última transação: ${lastTransaction.type} de R$ ${lastTransaction.amount}`);
    }

    // Teste 11: Validação de zero e valores decimais
    console.log('1️⃣1️⃣ Testando valores decimais e zero...');
    await userService.updateUserBalance(foundUser.id, '0.01', 'add');
    await userService.updateUserBalance(foundUser.id, '0.01', 'subtract');
    const userAfterDecimal = await userService.getUserById(foundUser.id);
    console.log(`   ✅ Saldo após operações decimais: R$ ${userAfterDecimal?.balance}\n`);

    // Teste 12: Tentativa de valor negativo
    console.log('1️⃣2️⃣ Testando valor negativo...');
    try {
      await userService.updateUserBalance(foundUser.id, '-10.00', 'add');
      throw new Error('Deveria ter falhado por valor negativo');
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('Valor inválido')) {
        console.log(`   ✅ Erro esperado capturado: ${error.message}\n`);
      } else {
        throw error;
      }
    }

    console.log('\n🎉 Todos os testes da Fase 2 validados com sucesso!');
    return true;

  } catch (error) {
    console.error('❌ Erro na Fase 2:', error);
    return false;
  }
}

testPhase2().then(success => {
  process.exit(success ? 0 : 1);
});
