import { config } from '../config';
import { gameRepository, transactionRepository } from '../database/repositories';
import { CoinFlip } from '../games/CoinFlip';
import { Domino } from '../games/Domino';
import { AppError } from '../types';
import { CoinFlipGameData, CreateGameInput, DominoGameData, DominoMoveResult, DominoPiece, Game, GameMoveResult, GameResult, MultiplayerGameResult } from '../types/game';
import { logger } from '../utils/logger';
import { UserService } from './user.service';

/**
 * Serviço responsável pela gestão completa do sistema de jogos multiplayer.
 * 
 * Gerencia a criação, execução e finalização de jogos como Coin Flip e Dominó,
 * incluindo validações, processamento de apostas, distribuição de prêmios e
 * manutenção do histórico de transações.
 * 
 * @class GameService
 */
export class GameService {
  /** Instância do serviço de usuários para validações e operações de saldo */
  private userService: UserService;

  /**
   * Inicializa o serviço de jogos com suas dependências.
   * 
   * @constructor
   */
  constructor() {
    this.userService = new UserService();
  }

  /**
   * Cria um novo jogo multiplayer no sistema.
   * 
   * Valida o usuário, suas limitações de jogos ativos, saldo disponível
   * e processa a reserva da aposta para criação de uma partida multiplayer
   * aguardando oponente.
   * 
   * @param userId - ID do usuário criador do jogo
   * @param gameData - Dados de configuração do jogo (tipo, valor da aposta)
   * 
   * @returns Promise com os dados do jogo criado
   * 
   * @throws {AppError} 404 - Usuário não encontrado
   * @throws {AppError} 400 - Máximo de jogos ativos excedido
   * @throws {AppError} 400 - Saldo insuficiente
   * @throws {AppError} 400 - Valor de aposta fora dos limites permitidos
   * @throws {AppError} 500 - Erro interno do servidor
   */
  async createGame(userId: number, gameData: CreateGameInput): Promise<Game> {
    try {
      // Validar usuário
      const user = await this.userService.getUserById(userId);
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }

      // Validar máximo de jogos ativos
      const activeGames = await this.findUserActiveMatches(userId);
      if (activeGames.length >= config.game.maxActiveGames) {
        throw new AppError(
          `Máximo de ${config.game.maxActiveGames} jogos ativos permitido`,
          400
        );
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
        expiresAt: new Date(Date.now() + config.game.gameTimeout * 60 * 1000), // Usar configuração de timeout
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

  /**
   * Executa uma partida de Coin Flip no modo single-player.
   * 
   * Valida o jogo, processa a escolha do jogador, executa a lógica
   * da moeda e processa o resultado final com distribuição de prêmios.
   * 
   * @param gameId - ID do jogo a ser executado
   * @param userId - ID do usuário jogador
   * @param choice - Escolha do jogador: 'heads' (cara) ou 'tails' (coroa)
   * 
   * @returns Promise com o resultado da partida
   * 
   * @throws {AppError} 404 - Jogo não encontrado
   * @throws {AppError} 403 - Usuário não é proprietário do jogo
   * @throws {AppError} 400 - Jogo não está disponível para jogar
   * @throws {AppError} 400 - Tipo de jogo inválido
   * @throws {AppError} 500 - Erro interno do servidor
   */
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

  /**
   * Processa o resultado de um jogo, atualizando saldos e criando transações.
   * 
   * Calcula prêmios, rake da casa, atualiza saldo do jogador e registra
   * transações de ganho ou perda conforme o resultado obtido.
   * 
   * @param game - Dados do jogo a ser processado
   * @param result - Resultado obtido na partida
   * @param userId - ID do usuário que jogou
   * 
   * @returns Promise<void>
   * 
   * @throws {Error} Erro ao processar resultado do jogo
   * 
   * @private
   */
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
   * Permite que um usuário se junte a um jogo multiplayer existente.
   * 
   * Valida disponibilidade do jogo, saldo do usuário, desconta a aposta
   * e ativa o jogo com dois jogadores prontos para jogar.
   * 
   * @param gameId - ID do jogo a ser entrado
   * @param userId - ID do usuário que deseja entrar
   * 
   * @returns Promise com os dados do jogo atualizado
   * 
   * @throws {AppError} 404 - Jogo não encontrado
   * @throws {AppError} 400 - Jogo não está mais disponível
   * @throws {AppError} 400 - Usuário não pode entrar no próprio jogo
   * @throws {AppError} 400 - Jogo expirado
   * @throws {AppError} 404 - Usuário não encontrado
   * @throws {AppError} 400 - Saldo insuficiente
   * @throws {AppError} 500 - Erro interno do servidor
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
   * Permite entrar em um jogo com notificação automática ao criador.
   * 
   * Combina a funcionalidade de entrar no jogo com envio de notificação
   * para informar o criador sobre a entrada de um novo jogador.
   * 
   * @param gameId - ID do jogo a ser entrado
   * @param userId - ID do usuário que deseja entrar
   * @param notificationService - Serviço opcional para envio de notificações
   * 
   * @returns Promise com os dados do jogo atualizado
   * 
   * @throws {AppError} Erros propagados do método joinGame()
   * @throws {AppError} 500 - Erro interno ao processar notificação
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
   * Busca jogos disponíveis aguardando jogadores.
   * 
   * Retorna lista de jogos no status 'waiting' que estão disponíveis
   * para outros usuários entrarem, com filtro opcional por tipo de jogo.
   * 
   * @param gameType - Tipo de jogo para filtrar (opcional)
   * @param limit - Número máximo de jogos a retornar (padrão: 10)
   * 
   * @returns Promise com array de jogos disponíveis
   * 
   * @throws {AppError} 500 - Erro ao buscar jogos disponíveis
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
   * Registra uma jogada em partida multiplayer ativa.
   * 
   * Valida participação do usuário, registra sua escolha no jogo
   * e processa resultado final se ambos jogadores já fizeram suas jogadas.
   * 
   * @param gameId - ID do jogo ativo
   * @param userId - ID do usuário fazendo a jogada
   * @param choice - Escolha do jogador: 'heads' ou 'tails'
   * 
   * @returns Promise com resultado da jogada ou indicação de espera
   * 
   * @throws {AppError} 404 - Jogo não encontrado
   * @throws {AppError} 403 - Usuário não é participante do jogo
   * @throws {AppError} 400 - Jogo não está ativo
   * @throws {AppError} 500 - Erro ao processar jogada
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
   * Processa o resultado final de uma partida multiplayer.
   * 
   * Determina vencedor baseado nas escolhas dos jogadores e resultado da moeda,
   * calcula prêmios e rake, distribui valores e registra transações para ambos jogadores.
   * 
   * @param game - Dados do jogo a ser finalizado
   * @param gameData - Estado atual do jogo com escolhas dos jogadores
   * 
   * @returns Promise com resultado detalhado da partida multiplayer
   * 
   * @throws {AppError} 400 - Jogador 2 não encontrado
   * @throws {Error} Erro ao processar resultado multiplayer
   * 
   * @private
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

  /**
   * Busca um jogo específico pelo seu ID.
   * 
   * @param gameId - ID do jogo a ser buscado
   * 
   * @returns Promise com dados do jogo ou null se não encontrado
   */
  async getGameById(gameId: number): Promise<Game | null> {
    return await gameRepository.findById(gameId);
  }

  /**
   * Busca histórico de jogos de um usuário específico.
   * 
   * @param userId - ID do usuário
   * @param limit - Número máximo de jogos a retornar (padrão: 20)
   * 
   * @returns Promise com array de jogos do usuário
   */
  async getUserGames(userId: number, limit: number = 20): Promise<Game[]> {
    return await gameRepository.findByCreatorId(userId, limit);
  }

  /**
   * Cria um novo jogo de Dominó multiplayer.
   * 
   * Método específico para criação de jogos de Dominó, utilizando
   * a funcionalidade base de criação de jogos multiplayer.
   * 
   * @param userId - ID do usuário criador
   * @param betAmount - Valor da aposta em reais
   * 
   * @returns Promise com dados do jogo de Dominó criado
   * 
   * @throws {AppError} Erros propagados do método createGame()
   */
  async createDominoGame(userId: number, betAmount: number): Promise<Game> {
    return this.createGame(userId, {
      gameType: 'domino',
      betAmount,
      matchType: 'multiplayer'
    });
  }

  /**
   * Executa uma jogada no jogo de Dominó.
   * 
   * Valida a jogada, atualiza estado do jogo, verifica fim de partida
   * e processa resultado se o jogo terminou.
   * 
   * @param gameId - ID do jogo de Dominó
   * @param userId - ID do usuário fazendo a jogada
   * @param pieceId - ID da peça de dominó sendo jogada
   * @param side - Lado do tabuleiro onde jogar: 'left' ou 'right'
   * 
   * @returns Promise com resultado da jogada
   * 
   * @throws {AppError} 404 - Jogo não encontrado
   * @throws {AppError} 403 - Usuário não é participante do jogo
   * @throws {AppError} 400 - Jogo não está ativo
   * @throws {AppError} 400 - Tipo de jogo inválido
   * @throws {AppError} 400 - Não é a vez do jogador
   * @throws {AppError} 400 - Jogada inválida
   * @throws {AppError} 500 - Erro interno ao processar jogada
   */
  async makeDominoMove(gameId: number, userId: number, pieceId: string, side: 'left' | 'right'): Promise<DominoMoveResult> {
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

      // Validar tipo de jogo
      if (game.gameType !== 'domino') {
        throw new AppError('Tipo de jogo inválido para esta operação', 400);
      }

      // Recuperar ou criar estado do jogo
      let gameData: DominoGameData = (game.gameData as DominoGameData);
      
      // Se não há gameData, inicializar o jogo Domino
      if (!gameData || !gameData.deck) {
        const dominoGame = Domino.create(parseFloat(game.betAmount), game.creatorId, game.player2Id!);
        gameData = dominoGame.getGameState();
        await gameRepository.updateGameData(gameId, gameData);
      }

      // Criar instância do jogo com estado atual
      const dominoGame = Domino.create(parseFloat(game.betAmount), game.creatorId, game.player2Id!);
      dominoGame.setGameState(gameData);

      // Verificar se é a vez do jogador
      if (dominoGame.getGameState().currentPlayer !== userId.toString()) {
        throw new AppError('Não é sua vez de jogar', 400);
      }

      // Fazer a jogada
      const moveSuccess = dominoGame.makeMove(userId.toString(), pieceId, side);
      if (!moveSuccess) {
        throw new AppError('Jogada inválida', 400);
      }

      // Atualizar estado no banco
      const updatedGameData = dominoGame.getGameState();
      await gameRepository.updateGameData(gameId, updatedGameData);

      // Verificar se o jogo terminou
      if (dominoGame.isGameOver()) {
        const result = dominoGame.determineWinner(game.creatorId.toString(), game.player2Id!.toString());
        const multiplayerResult = await this.processDominoResult(game, result);
        
        return { 
          waiting: false, 
          result: multiplayerResult,
          gameState: updatedGameData,
          gameInterface: dominoGame.generateGameInterface(userId.toString())
        };
      } else {
        // Jogo continua
        const availableMoves = dominoGame.getAvailableMoves(updatedGameData.currentPlayer);
        
        return { 
          waiting: true,
          gameState: updatedGameData,
          availableMoves,
          gameInterface: dominoGame.generateGameInterface(updatedGameData.currentPlayer)
        };
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error making domino move:', error);
      throw new AppError('Erro ao fazer jogada no dominó', 500);
    }
  }

  /**
   * Obtém o estado atual de um jogo de Dominó.
   * 
   * Retorna estado completo do jogo, interface visual para o jogador
   * e jogadas disponíveis para o turno atual.
   * 
   * @param gameId - ID do jogo de Dominó
   * @param userId - ID do usuário solicitante
   * 
   * @returns Promise com estado completo do jogo
   * 
   * @throws {AppError} 404 - Jogo não encontrado
   * @throws {AppError} 403 - Usuário não é participante do jogo
   * @throws {AppError} 400 - Tipo de jogo inválido
   * @throws {AppError} 400 - Estado do jogo não encontrado
   * @throws {AppError} 500 - Erro interno ao obter estado
   */
  async getDominoGameState(gameId: number, userId: number): Promise<{ gameState: DominoGameData; gameInterface: string; availableMoves: Array<{ piece: DominoPiece; sides: ('left' | 'right')[] }> }> {
    try {
      const game = await gameRepository.findById(gameId);
      if (!game) {
        throw new AppError('Jogo não encontrado', 404);
      }

      // Validar se é participante do jogo
      if (game.creatorId !== userId && game.player2Id !== userId) {
        throw new AppError('Você não é participante deste jogo', 403);
      }

      // Validar tipo de jogo
      if (game.gameType !== 'domino') {
        throw new AppError('Tipo de jogo inválido', 400);
      }

      const gameData: DominoGameData = (game.gameData as DominoGameData);
      if (!gameData || !gameData.deck) {
        throw new AppError('Estado do jogo não encontrado', 400);
      }

      // Criar instância do jogo com estado atual
      const dominoGame = Domino.create(parseFloat(game.betAmount), game.creatorId, game.player2Id!);
      dominoGame.setGameState(gameData);

      const availableMoves = dominoGame.getAvailableMoves(userId.toString());
      const gameInterface = dominoGame.generateGameInterface(userId.toString());

      return {
        gameState: gameData,
        gameInterface,
        availableMoves
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error getting domino game state:', error);
      throw new AppError('Erro ao obter estado do jogo', 500);
    }
  }

  /**
   * Processa o resultado final de uma partida de Dominó.
   * 
   * Calcula vencedor, prêmios, rake da casa e distribui valores.
   * Trata casos especiais como empate com devolução das apostas.
   * 
   * @param game - Dados do jogo de Dominó
   * @param result - Resultado obtido na partida
   * 
   * @returns Promise com resultado detalhado da partida
   * 
   * @throws {Error} Erro ao processar resultado do dominó
   * 
   * @private
   */
  private async processDominoResult(game: Game, result: GameResult): Promise<MultiplayerGameResult> {
    try {
      const betAmount = parseFloat(game.betAmount);
      const rakePercentage = config.game.rakePercentage / 100;
      const totalPool = betAmount * 2;
      const rakeAmount = totalPool * rakePercentage;
      const prizeAmount = totalPool - rakeAmount;

      let winnerId: number | null = null;
      let resultType: 'creator_wins' | 'player2_wins' | 'creator_wins_tie';

      if (result.winner === 'player') {
        winnerId = game.creatorId;
        resultType = 'creator_wins';
      } else if (result.winner === 'house') {
        winnerId = game.player2Id!;
        resultType = 'player2_wins';
      } else {
        // Empate - devolver apostas
        winnerId = null;
        resultType = 'creator_wins_tie';
      }

      // Processar pagamentos
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
            description: `Vitória Dominó PvP - Jogo #${game.id}`,
          });
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
              description: `Derrota Dominó PvP - Jogo #${game.id}`,
            });
          }
        }
      } else {
        // Empate - devolver apostas aos dois jogadores
        await this.userService.updateUserBalance(game.creatorId, betAmount.toFixed(2), 'add');
        await this.userService.updateUserBalance(game.player2Id!, betAmount.toFixed(2), 'add');

        // Registrar transações de devolução
        const creator = await this.userService.getUserById(game.creatorId);
        const player2 = await this.userService.getUserById(game.player2Id!);

        if (creator) {
          await transactionRepository.create({
            userId: game.creatorId,
            type: 'bet_win',
            amount: betAmount.toFixed(2),
            balanceBefore: (parseFloat(creator.balance) - betAmount).toFixed(2),
            balanceAfter: creator.balance,
            description: `Empate Dominó - Devolução Jogo #${game.id}`,
          });
        }

        if (player2) {
          await transactionRepository.create({
            userId: game.player2Id!,
            type: 'bet_win',
            amount: betAmount.toFixed(2),
            balanceBefore: (parseFloat(player2.balance) - betAmount).toFixed(2),
            balanceAfter: player2.balance,
            description: `Empate Dominó - Devolução Jogo #${game.id}`,
          });
        }
      }

      // Completar jogo
      const finalPrize = winnerId ? prizeAmount : betAmount;
      await gameRepository.completeGame(
        game.id,
        winnerId,
        finalPrize.toFixed(2),
        rakeAmount.toFixed(2)
      );

      // Buscar nomes dos jogadores para o resultado
      const creator = await this.userService.getUserById(game.creatorId);
      const player2 = await this.userService.getUserById(game.player2Id!);

      return {
        gameId: game.id,
        winnerId,
        winnerName: winnerId === game.creatorId ? creator?.firstName : player2?.firstName,
        creatorChoice: 'domino' as 'heads' | 'tails',
        player2Choice: 'domino' as 'heads' | 'tails',
        creatorName: creator?.firstName,
        player2Name: player2?.firstName,
        prizeAmount: finalPrize,
        rakeAmount,
        result: resultType,
      };
    } catch (error) {
      logger.error('Error processing domino result:', error);
      throw error;
    }
  }

  // ==========================================
  // ALIASES PARA COMPATIBILIDADE COM PROJETO GAME
  // ==========================================

  /**
   * Alias para createGame() - mantém compatibilidade com projeto Game.
   * 
   * @param userId - ID do usuário criador
   * @param gameData - Dados de configuração do jogo
   * 
   * @returns Promise com dados do jogo criado
   * 
   * @deprecated Use createGame() diretamente
   */
  async createMatch(userId: number, gameData: CreateGameInput): Promise<Game> {
    return this.createGame(userId, gameData);
  }

  /**
   * Alias para joinGame() - mantém compatibilidade com projeto Game.
   * 
   * @param gameId - ID do jogo a ser entrado
   * @param userId - ID do usuário
   * 
   * @returns Promise com dados do jogo atualizado
   * 
   * @deprecated Use joinGame() diretamente
   */
  async joinMatch(gameId: number, userId: number): Promise<Game> {
    return this.joinGame(gameId, userId);
  }

  /**
   * Alias para getAvailableGames() - mantém compatibilidade com projeto Game.
   * 
   * @param gameType - Tipo de jogo para filtrar
   * @param limit - Número máximo de resultados
   * 
   * @returns Promise com jogos aguardando jogadores
   * 
   * @deprecated Use getAvailableGames() diretamente
   */
  async findWaitingMatches(gameType?: string, limit: number = 10): Promise<Game[]> {
    return this.getAvailableGames(gameType, limit);
  }

  /**
   * Busca partidas ativas do usuário - mantém compatibilidade com projeto Game.
   * 
   * Retorna jogos criados pelo usuário que estão com status 'active' ou 'waiting',
   * útil para validar limites de jogos simultâneos.
   * 
   * @param userId - ID do usuário
   * 
   * @returns Promise com array de jogos ativos do usuário
   * 
   * @throws {AppError} 500 - Erro ao buscar partidas ativas
   */
  async findUserActiveMatches(userId: number): Promise<Game[]> {
    try {
      const activeGames = await gameRepository.findByCreatorId(userId, 50);
      return activeGames.filter(game => 
        game.status === 'active' || game.status === 'waiting'
      );
    } catch (error) {
      logger.error('Error finding user active matches:', error);
      throw new AppError('Erro ao buscar partidas ativas', 500);
    }
  }
}
