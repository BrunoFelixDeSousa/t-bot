import { config } from '../config';
import { gameRepository, transactionRepository } from '../database/repositories';
import { CoinFlip } from '../games/CoinFlip';
import { AppError } from '../types';
import { CoinFlipGameData, CreateGameInput, Game, GameMoveResult, GameResult, MultiplayerGameResult } from '../types/game';
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
      if (gameData.betAmount < config.game.minBetAmount / 100) {
        throw new AppError(
          `Aposta mínima: R$ ${(config.game.minBetAmount / 100).toFixed(2)}`,
          400
        );
      }

      if (gameData.betAmount > config.game.maxBetAmount / 100) {
        throw new AppError(
          `Aposta máxima: R$ ${(config.game.maxBetAmount / 100).toFixed(2)}`,
          400
        );
      }

      // Para jogos multiplayer, reservar saldo do criador
      await this.userService.updateUserBalance(
        userId,
        gameData.betAmount.toFixed(2),
        'subtract'
      );

      // Criar jogo no banco sempre como multiplayer
      const game = await gameRepository.create({
        creatorId: userId,
        gameType: gameData.gameType,
        matchType: 'multiplayer', // Sempre multiplayer
        betAmount: gameData.betAmount.toFixed(2),
        gameData: {},
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutos para alguém entrar
      });

      logger.info('Multiplayer game created, waiting for opponent', {
        gameId: game.id,
        creatorId: userId,
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
   * DEPRECATED: Use multiplayer system instead
   * Creates and immediately plays a game in one operation
   * Used for single-player games like coin flip
   */
  async createAndPlayGame(): Promise<{ gameId: number; result: { playerChoice: string; botChoice: string; winner: string; winnings: number } }> {
    throw new AppError('Single player games não são mais suportados. Use o sistema multiplayer.', 400);
  }

  /**
   * Join an existing multiplayer game
   */
  async joinGame(gameId: number, userId: number): Promise<Game> {
    try {
      const game = await gameRepository.findById(gameId);
      if (!game) {
        throw new AppError('Jogo não encontrado', 404);
      }

      // Validar se jogo está disponível para entrar
      if (game.status !== 'waiting') {
        throw new AppError('Este jogo não está mais disponível', 400);
      }

      // Validar se não é o próprio criador
      if (game.creatorId === userId) {
        throw new AppError('Você não pode entrar no seu próprio jogo', 400);
      }

      // Validar se o jogo não expirou
      if (game.expiresAt && new Date() > game.expiresAt) {
        await gameRepository.updateStatus(gameId, 'expired');
        throw new AppError('Este jogo expirou', 400);
      }

      // Validar usuário e saldo
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }

      const userBalance = parseFloat(user.balance);
      const betAmount = parseFloat(game.betAmount);
      
      if (userBalance < betAmount) {
        throw new AppError(
          `Saldo insuficiente. Necessário: R$ ${betAmount.toFixed(2)}`,
          400
        );
      }

      // Descontar aposta do segundo jogador
      await this.userService.updateUserBalance(
        userId,
        game.betAmount,
        'subtract'
      );

      // Atualizar jogo para ativo com segundo jogador
      const updatedGame = await gameRepository.updateGameWithPlayer2(gameId, userId);

      logger.info('Player joined multiplayer game', {
        gameId,
        creatorId: game.creatorId,
        player2Id: userId,
        gameType: game.gameType,
        betAmount: game.betAmount,
      });

      return updatedGame;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error joining game:', error);
      throw new AppError('Erro interno ao entrar no jogo', 500);
    }
  }

  /**
   * Join an existing multiplayer game with notifications
   */
  async joinGameWithNotification(gameId: number, userId: number, notificationService?: { notifyPlayerJoined: (chatId: string, playerName: string, gameId: number) => Promise<boolean> }): Promise<Game> {
    try {
      // Join the game normally
      const game = await this.joinGame(gameId, userId);
      
      // Send notification to creator if notification service is available
      if (notificationService) {
        const creator = await this.userService.getUserById(game.creatorId);
        const player2 = await this.userService.getUserById(userId);
        
        if (creator?.chatId && player2?.firstName) {
          await notificationService.notifyPlayerJoined(
            creator.chatId,
            player2.firstName,
            gameId
          );
        }
      }
      
      return game;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error joining game with notification:', error);
      throw new AppError('Erro interno ao entrar no jogo', 500);
    }
  }

  /**
   * Get available games waiting for players
   */
  async getAvailableGames(gameType?: string, limit: number = 10): Promise<Game[]> {
    try {
      return await gameRepository.findAvailableGames(gameType, limit);
    } catch (error) {
      logger.error('Error getting available games:', error);
      throw new AppError('Erro ao buscar jogos disponíveis', 500);
    }
  }

  /**
   * Make a move in a multiplayer game
   */
  async makeMove(gameId: number, userId: number, choice: 'heads' | 'tails'): Promise<GameMoveResult> {
    try {
      const game = await gameRepository.findById(gameId);
      if (!game) {
        throw new AppError('Jogo não encontrado', 404);
      }

      // Validar se é participante do jogo
      if (game.creatorId !== userId && game.player2Id !== userId) {
        throw new AppError('Você não é participante deste jogo', 403);
      }

      // Validar status do jogo
      if (game.status !== 'active') {
        throw new AppError('Jogo não está ativo', 400);
      }

      // Recuperar dados do jogo
      const gameData: CoinFlipGameData = (game.gameData as CoinFlipGameData) || {};
      
      // Registrar jogada
      if (game.creatorId === userId) {
        gameData.player1Choice = choice;
      } else {
        gameData.player2Choice = choice;
      }

      // Atualizar dados do jogo
      await gameRepository.updateGameData(gameId, gameData);

      // Verificar se ambos jogaram
      if (gameData.player1Choice && gameData.player2Choice) {
        // Ambos jogaram, processar resultado
        const result = await this.processMultiplayerResult(game, gameData);
        return { waiting: false, result };
      } else {
        // Ainda esperando o outro jogador
        return { waiting: true };
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error making move:', error);
      throw new AppError('Erro ao fazer jogada', 500);
    }
  }

  /**
   * Process multiplayer game result
   */
  private async processMultiplayerResult(game: Game, gameData: CoinFlipGameData): Promise<MultiplayerGameResult> {
    try {
      const betAmount = parseFloat(game.betAmount);
      const rakePercentage = config.game.rakePercentage / 100;
      const totalPool = betAmount * 2;
      const rakeAmount = totalPool * rakePercentage;
      const prizeAmount = totalPool - rakeAmount;

      let winnerId: number | null = null;
      let result: 'creator_wins' | 'player2_wins' | 'creator_wins_tie';

      // Gerar resultado da moeda
      const coinResult: 'heads' | 'tails' = Math.random() < 0.5 ? 'heads' : 'tails';

      // Para Coin Flip: comparar escolhas com o resultado da moeda
      if (gameData.player1Choice === gameData.player2Choice) {
        // Ambos escolheram o mesmo - quem criou o jogo ganha (regra de desempate)
        winnerId = game.creatorId;
        result = 'creator_wins_tie';
      } else {
        // Escolhas diferentes - quem acertou a moeda ganha
        if (gameData.player1Choice === coinResult) {
          winnerId = game.creatorId;
          result = 'creator_wins';
        } else if (gameData.player2Choice === coinResult) {
          winnerId = game.player2Id!; // Aqui preciso garantir que não é undefined
          result = 'player2_wins';
        } else {
          // Caso impossível, mas por segurança
          winnerId = game.creatorId;
          result = 'creator_wins_tie';
        }
      }

      // Validar que player2Id existe
      if (!game.player2Id) {
        throw new AppError('Jogador 2 não encontrado', 400);
      }

      // Pagar vencedor
      if (winnerId) {
        await this.userService.updateUserBalance(
          winnerId,
          prizeAmount.toFixed(2),
          'add'
        );

        // Registrar transação de ganho
        const winner = await this.userService.getUserById(winnerId);
        if (winner) {
          await transactionRepository.create({
            userId: winnerId,
            type: 'bet_win',
            amount: prizeAmount.toFixed(2),
            balanceBefore: (parseFloat(winner.balance) - prizeAmount).toFixed(2),
            balanceAfter: winner.balance,
            description: `Vitória PvP em ${game.gameType} - Jogo #${game.id}`,
          });
        }
      }

      // Registrar transação de derrota para o perdedor
      const loserId = winnerId === game.creatorId ? game.player2Id : game.creatorId;
      if (loserId) {
        const loser = await this.userService.getUserById(loserId);
        if (loser) {
          await transactionRepository.create({
            userId: loserId,
            type: 'bet_loss',
            amount: betAmount.toFixed(2),
            balanceBefore: (parseFloat(loser.balance) + betAmount).toFixed(2),
            balanceAfter: loser.balance,
            description: `Derrota PvP em ${game.gameType} - Jogo #${game.id}`,
          });
        }
      }

      // Completar jogo
      await gameRepository.completeGame(
        game.id,
        winnerId,
        prizeAmount.toFixed(2),
        rakeAmount.toFixed(2)
      );

      // Buscar nomes dos jogadores para o resultado
      const creator = await this.userService.getUserById(game.creatorId);
      const player2 = await this.userService.getUserById(game.player2Id);

      return {
        gameId: game.id,
        winnerId,
        winnerName: winnerId === game.creatorId ? creator?.firstName : player2?.firstName,
        creatorChoice: gameData.player1Choice,
        player2Choice: gameData.player2Choice,
        creatorName: creator?.firstName,
        player2Name: player2?.firstName,
        prizeAmount,
        rakeAmount,
        result,
        coinResult
      };
    } catch (error) {
      logger.error('Error processing multiplayer result:', error);
      throw error;
    }
  }

  async getGameById(gameId: number): Promise<Game | null> {
    return await gameRepository.findById(gameId);
  }

  async getUserGames(userId: number, limit: number = 20): Promise<Game[]> {
    return await gameRepository.findByCreatorId(userId, limit);
  }
}
