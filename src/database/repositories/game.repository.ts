import { desc, eq } from 'drizzle-orm';
import { Game, GameStatus, GameType } from '../../types/game';
import { logger } from '../../utils/logger';
import { db } from '../connection';
import { games } from '../schema/schema';

export interface CreateGameInput {
  creatorId: number;
  gameType: GameType;
  matchType: 'single_player' | 'multiplayer' | 'tournament';
  betAmount: string;
  gameData?: unknown;
  expiresAt?: Date;
}

export class GameRepository {
  async create(gameData: CreateGameInput): Promise<Game> {
    try {
      const [newGame] = await db
        .insert(games)
        .values({
          creatorId: gameData.creatorId,
          gameType: gameData.gameType,
          matchType: gameData.matchType,
          betAmount: gameData.betAmount,
          gameData: gameData.gameData,
          expiresAt: gameData.expiresAt,
          status: 'waiting',
        })
        .returning();

      logger.info('Game created', {
        gameId: newGame.id,
        creatorId: newGame.creatorId,
        gameType: newGame.gameType,
        betAmount: newGame.betAmount,
      });

      return newGame;
    } catch (error) {
      logger.error('Error creating game:', error);
      throw error;
    }
  }

  async findById(id: number): Promise<Game | null> {
    try {
      const game = await db
        .select()
        .from(games)
        .where(eq(games.id, id))
        .limit(1);

      return game[0] || null;
    } catch (error) {
      logger.error('Error finding game by ID:', error);
      throw error;
    }
  }

  async findByCreatorId(creatorId: number, limit: number = 20): Promise<Game[]> {
    try {
      const userGames = await db
        .select()
        .from(games)
        .where(eq(games.creatorId, creatorId))
        .orderBy(desc(games.createdAt))
        .limit(limit);

      return userGames;
    } catch (error) {
      logger.error('Error finding games by creator:', error);
      throw error;
    }
  }

  async updateStatus(gameId: number, status: GameStatus): Promise<boolean> {
    try {
      await db
        .update(games)
        .set({
          status,
          updatedAt: new Date(),
        })
        .where(eq(games.id, gameId));

      logger.info('Game status updated', { gameId, status });
      return true;
    } catch (error) {
      logger.error('Error updating game status:', error);
      throw error;
    }
  }

  async completeGame(
    gameId: number,
    winnerId: number | null,
    prize: string,
    rakeAmount: string
  ): Promise<boolean> {
    try {
      await db
        .update(games)
        .set({
          status: 'completed',
          winnerId,
          prize,
          rakeAmount,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(games.id, gameId));

      logger.info('Game completed', {
        gameId,
        winnerId,
        prize,
        rakeAmount,
      });

      return true;
    } catch (error) {
      logger.error('Error completing game:', error);
      throw error;
    }
  }
}
