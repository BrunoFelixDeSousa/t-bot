#!/usr/bin/env tsx
import 'dotenv/config';
import { GameService } from '../src/services/game.service';
import { UserService } from '../src/services/user.service';
import { logger } from '../src/utils/logger';

async function testCoinFlipGame() {
  try {
    console.log('🎮 Testing Coin Flip Game Implementation...\n');

    // Initialize services
    const userService = new UserService();
    const gameService = new GameService();

    // Create test user
    console.log('👤 Creating test user...');
    const testUser = await userService.findOrCreateUser({
      telegramId: '123456789',
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser'
    });
    console.log(`✅ User created: ${testUser.firstName} (ID: ${testUser.id})`);

    // Add some balance for testing
    await userService.updateUserBalance(testUser.id, "100.00", "add"); // R$ 100.00
    console.log('💰 Added R$ 100.00 to user balance');

    // Test coin flip game
    console.log('\n🪙 Testing Coin Flip Game...');
    
    const gameData = {
      userId: testUser.id,
      gameType: 'coin_flip' as const,
      betAmount: 1000, // R$ 10.00 in cents
      gameData: { playerChoice: 'heads' as const }
    };

    console.log('📊 Game parameters:', {
      betAmount: 'R$ 10.00',
      playerChoice: 'heads'
    });

    const gameResult = await gameService.createAndPlayGame(gameData);
    
    console.log('\n🎲 Game Result:');
    console.log('- Game ID:', gameResult.gameId);
    console.log('- Player Choice:', gameResult.result.playerChoice);
    console.log('- Bot Choice:', gameResult.result.botChoice);
    console.log('- Winner:', gameResult.result.winner);
    console.log('- Winnings:', gameResult.result.winnings ? `R$ ${gameResult.result.winnings.toFixed(2)}` : 'R$ 0.00');

    // Check user balance after game
    const updatedUser = await userService.getUserById(testUser.id);
    console.log('\n💰 Updated user balance:', `R$ ${(parseFloat(updatedUser!.balance) * 100 / 100).toFixed(2)}`);

    // Test multiple games
    console.log('\n🔄 Testing multiple games...');
    const results = { wins: 0, losses: 0, total: 0 };
    
    for (let i = 0; i < 10; i++) {
      const choice = Math.random() > 0.5 ? 'heads' : 'tails';
      const result = await gameService.createAndPlayGame({
        userId: testUser.id,
        gameType: 'coin_flip',
        betAmount: 500, // R$ 5.00 in cents
        gameData: { playerChoice: choice as 'heads' | 'tails' }
      });
      
      results.total++;
      if (result.result.winner === 'player') {
        results.wins++;
      } else {
        results.losses++;
      }
    }

    console.log('📈 Statistics after 10 games:');
    console.log(`- Wins: ${results.wins}`);
    console.log(`- Losses: ${results.losses}`);
    console.log(`- Win Rate: ${((results.wins / results.total) * 100).toFixed(1)}%`);

    // Final balance
    const finalUser = await userService.getUserById(testUser.id);
    console.log(`\n💰 Final balance: R$ ${(parseFloat(finalUser!.balance) * 100 / 100).toFixed(2)}`);

    console.log('\n✅ Coin Flip Game test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    logger.error('Coin flip test error:', error);
  }
}

// Run the test
testCoinFlipGame().catch(console.error);
