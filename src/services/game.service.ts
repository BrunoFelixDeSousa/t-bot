import { config } from '../config';
import { gameRepository, transactionRepository } from '../database/repositories';
import { CoinFlip } from '../games/CoinFlip';
import { AppError } from '../types';
import { CreateGameInput, Game, GameResult } from '../types/game';
import { logger } from '../utils/logger';
import { UserService } from './user.service';

export class GameService {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  async createGame(userId: number, gameData: CreateGameInput): Promise<Game> {
    try {
      // Validar usuário
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }

      // Validar saldo
      const userBalance = parseFloat(user.balance);
      if (userBalance < gameData.betAmount) {
        throw new AppError(
          `Saldo insuficiente. Saldo atual: R$ ${userBalance.toFixed(2)}`,
          400
        );
      }

      // Validar limites de aposta
      if (gameData.betAmount < config.game.minBetAmount) {
        throw new AppError(
          `Aposta mínima: R$ ${config.game.minBetAmount}`,
          400
        );
      }

      if (gameData.betAmount > config.game.maxBetAmount) {
        throw new AppError(
          `Aposta máxima: R$ ${config.game.maxBetAmount}`,
          400
        );
      }

      // Reservar saldo (descontar aposta)
      await this.userService.updateUserBalance(
        userId,
        gameData.betAmount.toFixed(2),
        'subtract'
      );

      // Criar jogo no banco
      const game = await gameRepository.create({
        creatorId: userId,
        gameType: gameData.gameType,
        matchType: gameData.matchType || 'single_player',
        betAmount: gameData.betAmount.toFixed(2),
        gameData: {},
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
      });

      logger.info('Game created successfully', {
        gameId: game.id,
        userId,
        gameType: gameData.gameType,
        betAmount: gameData.betAmount,
      });

      return game;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error creating game:', error);
      throw new AppError('Erro interno ao criar jogo', 500);
    }
  }

  async playCoinFlip(gameId: number, userId: number, choice: 'heads' | 'tails'): Promise<GameResult> {
    try {
      // Buscar jogo
      const game = await gameRepository.findById(gameId);
      if (!game) {
        throw new AppError('Jogo não encontrado', 404);
      }

      // Validar proprietário
      if (game.creatorId !== userId) {
        throw new AppError('Você não pode jogar este jogo', 403);
      }

      // Validar status
      if (game.status !== 'waiting') {
        throw new AppError('Jogo não está disponível para jogar', 400);
      }

      // Validar tipo de jogo
      if (game.gameType !== 'coin_flip') {
        throw new AppError('Tipo de jogo inválido', 400);
      }

      // Marcar jogo como ativo
      await gameRepository.updateStatus(gameId, 'active');

      // Executar jogo
      const coinFlipGame = new CoinFlip(parseFloat(game.betAmount));
      const result = await coinFlipGame.play(choice);

      // Processar resultado
      await this.processGameResult(game, result, userId);

      logger.info('Coin flip game completed', {
        gameId,
        userId,
        choice,
        result: result.winner,
        prize: result.prize,
      });

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error playing coin flip:', error);
      throw new AppError('Erro interno ao jogar', 500);
    }
  }

  private async processGameResult(game: Game, result: GameResult, userId: number): Promise<void> {
    try {
      const betAmount = parseFloat(game.betAmount);
      let winnerId: number | null = null;
      let rakeAmount = 0;

      // Processar vitória
      if (result.winner === 'player' && result.prize > 0) {
        winnerId = userId;

        // Calcular rake
        const grossPrize = betAmount * 1.95;
        rakeAmount = grossPrize - result.prize;

        // Adicionar prêmio ao saldo
        await this.userService.updateUserBalance(
          userId,
          result.prize.toFixed(2),
          'add'
        );

        // Criar transação de ganho
        const user = await this.userService.getUserById(userId);
        if (user) {
          await transactionRepository.create({
            userId,
            type: 'bet_win',
            amount: result.prize.toFixed(2),
            balanceBefore: (parseFloat(user.balance) - result.prize).toFixed(2),
            balanceAfter: user.balance,
            description: `Vitória em ${game.gameType} - Jogo #${game.id}`,
          });
        }
      } else {
        // Jogador perdeu - criar transação de perda
        const user = await this.userService.getUserById(userId);
        if (user) {
          await transactionRepository.create({
            userId,
            type: 'bet_loss',
            amount: betAmount.toFixed(2),
            balanceBefore: (parseFloat(user.balance) + betAmount).toFixed(2),
            balanceAfter: user.balance,
            description: `Derrota em ${game.gameType} - Jogo #${game.id}`,
          });
        }
        rakeAmount = betAmount; // Casa fica com tudo
      }

      // Completar jogo
      await gameRepository.completeGame(
        game.id,
        winnerId,
        result.prize.toFixed(2),
        rakeAmount.toFixed(2)
      );

    } catch (error) {
      logger.error('Error processing game result:', error);
      throw error;
    }
  }

  /**
   * Creates and immediately plays a game in one operation
   * Used for single-player games like coin flip
   */
  async createAndPlayGame(gameData: {
    userId: number;
    gameType: 'coin_flip';
    betAmount: number; // in cents
    gameData: { playerChoice: 'heads' | 'tails' };
  }): Promise<{ gameId: number; result: { playerChoice: string; botChoice: string; winner: string; winnings: number } }> {
    try {
      // Convert betAmount from cents to reais
      const betAmountReais = gameData.betAmount / 100;

      // Create the game
      const game = await this.createGame(gameData.userId, {
        gameType: gameData.gameType,
        matchType: 'single_player',
        betAmount: betAmountReais,
      });

      // Immediately play the game
      const result = await this.playCoinFlip(
        game.id,
        gameData.userId,
        gameData.gameData.playerChoice
      );

      // Return both game ID and result
      return {
        gameId: game.id,
        result: {
          playerChoice: gameData.gameData.playerChoice,
          botChoice: result.houseChoice, // The actual coin flip result
          winner: result.winner,
          winnings: result.prize,
        },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in createAndPlayGame:', error);
      throw new AppError('Erro interno ao criar e jogar', 500);
    }
  }

  async getGameById(gameId: number): Promise<Game | null> {
    return await gameRepository.findById(gameId);
  }

  async getUserGames(userId: number, limit: number = 20): Promise<Game[]> {
    return await gameRepository.findByCreatorId(userId, limit);
  }
}
