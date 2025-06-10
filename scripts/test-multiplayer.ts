#!/usr/bin/env ts-node

/**
 * Test script for multiplayer coin flip system
 */

import { GameService } from '../src/services/game.service';
import { UserService } from '../src/services/user.service';
import { logger } from '../src/utils/logger';

async function testMultiplayerCoinFlip() {
  console.log('🧪 Testing Multiplayer Coin Flip System...\n');

  try {
    const gameService = new GameService();
    const userService = new UserService();

    // Test 1: Create test users
    console.log('1. Creating test users...');
    
    const user1 = await userService.findOrCreateUser({
      telegramId: '111111',
      firstName: 'Player1',
      username: 'player1'
    });

    const user2 = await userService.findOrCreateUser({
      telegramId: '222222',
      firstName: 'Player2',
      username: 'player2'
    });

    // Add balance to both users
    await userService.updateUserBalance(user1.id, '100.00', 'add');
    await userService.updateUserBalance(user2.id, '100.00', 'add');

    console.log(`✅ Created users: ${user1.firstName} (ID: ${user1.id}) and ${user2.firstName} (ID: ${user2.id})`);

    // Test 2: Player 1 creates a game
    console.log('\n2. Player 1 creates a multiplayer game...');
    
    const game = await gameService.createGame(user1.id, {
      gameType: 'coin_flip',
      betAmount: 10.00,
      matchType: 'multiplayer'
    });

    console.log(`✅ Game created with ID: ${game.id}, Status: ${game.status}`);

    // Test 3: Check available games
    console.log('\n3. Checking available games...');
    
    const availableGames = await gameService.getAvailableGames('coin_flip');
    console.log(`✅ Found ${availableGames.length} available games`);

    if (availableGames.length > 0) {
      const gameInfo = availableGames[0];
      console.log(`   - Game #${gameInfo.id}: R$ ${parseFloat(gameInfo.betAmount).toFixed(2)}`);
    }

    // Test 4: Player 2 joins the game
    console.log('\n4. Player 2 joins the game...');
    
    const joinedGame = await gameService.joinGame(game.id, user2.id);
    console.log(`✅ Player 2 joined game #${joinedGame.id}, Status: ${joinedGame.status}`);

    // Test 5: Both players make moves
    console.log('\n5. Players make their moves...');
    
    // Player 1 chooses heads
    const move1 = await gameService.makeMove(game.id, user1.id, 'heads');
    console.log(`✅ Player 1 chose heads, waiting: ${move1.waiting}`);

    // Player 2 chooses tails
    const move2 = await gameService.makeMove(game.id, user2.id, 'tails');
    console.log(`✅ Player 2 chose tails, waiting: ${move2.waiting}`);

    if (!move2.waiting && move2.result) {
      console.log('\n6. Game completed!');
      const result = move2.result;
      console.log(`🏆 Winner: ${result.winnerName} (ID: ${result.winnerId})`);
      console.log(`💰 Prize: R$ ${result.prizeAmount.toFixed(2)}`);
      console.log(`🏛️ Rake: R$ ${result.rakeAmount.toFixed(2)}`);
      console.log(`🎯 Result: ${result.result}`);
    }

    // Test 6: Check final balances
    console.log('\n7. Checking final balances...');
    
    const finalUser1 = await userService.getUserById(user1.id);
    const finalUser2 = await userService.getUserById(user2.id);
    
    console.log(`💰 ${finalUser1?.firstName}: R$ ${finalUser1?.balance}`);
    console.log(`💰 ${finalUser2?.firstName}: R$ ${finalUser2?.balance}`);

    console.log('\n✅ All multiplayer tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    logger.error('Multiplayer test error:', error);
  }
}

// Run the test
if (require.main === module) {
  testMultiplayerCoinFlip()
    .then(() => {
      console.log('\n🎉 Test completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error);
      process.exit(1);
    });
}

export { testMultiplayerCoinFlip };
