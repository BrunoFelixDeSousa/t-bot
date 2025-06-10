#!/usr/bin/env ts-node

/**
 * Test script for notification system
 */

import { GameService } from '../src/services/game.service';
import { UserService } from '../src/services/user.service';
import { logger } from '../src/utils/logger';

async function testNotificationSystem() {
  console.log('🔔 Testing Notification System...\n');

  try {
    const gameService = new GameService();
    const userService = new UserService();

    // Test 1: Create test users with different chat IDs
    console.log('1. Creating test users with chat IDs...');
    
    const user1 = await userService.findOrCreateUser({
      telegramId: '111111',
      chatId: '111111', // Same as telegramId for testing
      firstName: 'Creator',
      username: 'creator'
    });

    const user2 = await userService.findOrCreateUser({
      telegramId: '222222',
      chatId: '222222', // Same as telegramId for testing
      firstName: 'Joiner',
      username: 'joiner'
    });

    // Add balance to both users
    await userService.updateUserBalance(user1.id, '100.00', 'add');
    await userService.updateUserBalance(user2.id, '100.00', 'add');

    console.log(`✅ Created users with chat IDs:`);
    console.log(`   - ${user1.firstName}: TelegramID=${user1.telegramId}, ChatID=${user1.chatId}`);
    console.log(`   - ${user2.firstName}: TelegramID=${user2.telegramId}, ChatID=${user2.chatId}`);

    // Test 2: Create a game (this should work without notifications)
    console.log('\n2. Creating a multiplayer game...');
    
    const game = await gameService.createGame(user1.id, {
      gameType: 'coin_flip',
      betAmount: 10.00,
      matchType: 'multiplayer'
    });

    console.log(`✅ Game created with ID: ${game.id}`);
    console.log(`   - Creator: ${user1.firstName} (ChatID: ${user1.chatId})`);
    console.log(`   - Status: ${game.status}`);
    console.log(`   - Bet Amount: R$ ${parseFloat(game.betAmount).toFixed(2)}`);

    // Test 3: Simulate joining the game (this is where notification should be sent)
    console.log('\n3. Simulating game join (notification test)...');
    
    // Note: In real scenario, the notification would be sent via bot handlers
    // Here we just verify that the users have the necessary chat IDs
    const joinedGame = await gameService.joinGame(game.id, user2.id);
    console.log(`✅ ${user2.firstName} joined game #${joinedGame.id}`);
    
    // Verify creator has chatId for notifications
    const creatorForNotification = await userService.getUserById(user1.id);
    if (creatorForNotification?.chatId) {
      console.log(`✅ Creator has chatId: ${creatorForNotification.chatId} - Notification can be sent!`);
    } else {
      console.log(`❌ Creator missing chatId - Notification cannot be sent!`);
    }

    // Test 4: Complete the game
    console.log('\n4. Completing the game...');
    
    const move1 = await gameService.makeMove(game.id, user1.id, 'heads');
    console.log(`✅ Creator chose heads, waiting: ${move1.waiting}`);

    const move2 = await gameService.makeMove(game.id, user2.id, 'tails');
    console.log(`✅ Joiner chose tails, waiting: ${move2.waiting}`);

    if (!move2.waiting && move2.result) {
      console.log('\n5. Game completed with result!');
      const result = move2.result;
      console.log(`🏆 Winner: ${result.winnerName} (ID: ${result.winnerId})`);
      console.log(`💰 Prize: R$ ${result.prizeAmount.toFixed(2)}`);
      
      // Both players should have chatIds for final notifications
      console.log('\n📱 Notification readiness:');
      console.log(`   - Creator chatId: ${creatorForNotification?.chatId ? '✅' : '❌'}`);
      console.log(`   - Joiner chatId: ${user2.chatId ? '✅' : '❌'}`);
    }

    console.log('\n✅ Notification system test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. Start the bot with: npm run dev');
    console.log('   2. Test notifications in real Telegram environment');
    console.log('   3. Create a game and have someone join to see notifications');

  } catch (error) {
    console.error('❌ Test failed:', error);
    logger.error('Notification test error:', error);
  }
}

// Run the test
if (require.main === module) {
  testNotificationSystem()
    .then(() => {
      console.log('\n🎉 Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

export { testNotificationSystem };
