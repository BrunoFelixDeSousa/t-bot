import { and, desc, eq } from 'drizzle-orm';
import { Game, GameStatus, GameType } from '../../types/game';
import { logger } from '../../utils/logger';
import { db } from '../connection';
import { games } from '../schema/schema';

/**
 * Interface para dados necessários na criação de um novo jogo.
 * 
 * Define os campos obrigatórios e opcionais para instanciar
 * uma nova partida no banco de dados.
 */
export interface CreateGameInput {
  /** ID do usuário criador da partida */
  creatorId: number;
  /** Tipo de jogo a ser criado */
  gameType: GameType;
  /** Modo da partida: single-player, multiplayer ou torneio */
  matchType: 'single_player' | 'multiplayer' | 'tournament';
  /** Valor da aposta em formato string decimal */
  betAmount: string;
  /** Dados específicos do jogo em formato JSON */
  gameData?: unknown;
  /** Data/hora de expiração da partida */
  expiresAt?: Date;
}

/**
 * Repository para operações de banco de dados relacionadas a jogos.
 * 
 * Centraliza todas as operações CRUD e consultas específicas para
 * a tabela de jogos, incluindo criação, busca, atualização de status
 * e finalização de partidas.
 * 
 * @class GameRepository
 */
export class GameRepository {
  /**
   * Cria uma nova partida no banco de dados.
   * 
   * Insere uma nova entrada na tabela de jogos com status inicial 'waiting'
   * e registra a operação nos logs para auditoria.
   * 
   * @param gameData - Dados da partida a ser criada
   * 
   * @returns Promise com os dados completos da partida criada
   * 
   * @throws {Error} Erro de banco de dados durante inserção
   */
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

  /**
   * Busca uma partida específica pelo seu ID.
   * 
   * Retorna dados completos da partida ou null se não encontrada.
   * Útil para validações e carregamento de estado de jogo.
   * 
   * @param id - ID único da partida
   * 
   * @returns Promise com dados da partida ou null se não encontrada
   * 
   * @throws {Error} Erro de banco de dados durante consulta
   */
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

  /**
   * Busca partidas criadas por um usuário específico.
   * 
   * Retorna histórico de jogos do usuário ordenados por data de criação
   * (mais recentes primeiro), útil para exibir histórico e estatísticas.
   * 
   * @param creatorId - ID do usuário criador
   * @param limit - Número máximo de resultados (padrão: 20)
   * 
   * @returns Promise com array de partidas do usuário
   * 
   * @throws {Error} Erro de banco de dados durante consulta
   */
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

  /**
   * Atualiza o status de uma partida.
   * 
   * Modifica o estado da partida (waiting, active, completed, etc.)
   * e registra timestamp da atualização para controle temporal.
   * 
   * @param gameId - ID da partida a ser atualizada
   * @param status - Novo status da partida
   * 
   * @returns Promise<boolean> true se atualização bem-sucedida
   * 
   * @throws {Error} Erro de banco de dados durante atualização
   */
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

  /**
   * Finaliza uma partida com resultado e dados financeiros.
   * 
   * Marca partida como 'completed', registra vencedor, valores de prêmio
   * e comissão da casa, além do timestamp de finalização.
   * 
   * @param gameId - ID da partida a ser finalizada
   * @param winnerId - ID do jogador vencedor (null para empate)
   * @param prize - Valor do prêmio distribuído
   * @param rakeAmount - Valor da comissão da casa
   * 
   * @returns Promise<boolean> true se finalização bem-sucedida
   * 
   * @throws {Error} Erro de banco de dados durante atualização
   */
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

  /**
   * Busca partidas disponíveis para entrada de novos jogadores.
   * 
   * Retorna jogos com status 'waiting' ordenados por criação,
   * opcionalmente filtrados por tipo de jogo para exibição
   * na lista de partidas disponíveis.
   * 
   * @param gameType - Tipo específico de jogo para filtrar (opcional)
   * @param limit - Número máximo de resultados (padrão: 10)
   * 
   * @returns Promise com array de partidas aguardando jogadores
   * 
   * @throws {Error} Erro de banco de dados durante consulta
   */
  async findAvailableGames(gameType?: string, limit: number = 10): Promise<Game[]> {
    try {
      let whereClause;
      
      if (gameType) {
        whereClause = and(
          eq(games.status, 'waiting'),
          eq(games.gameType, gameType as GameType)
        );
      } else {
        whereClause = eq(games.status, 'waiting');
      }

      const availableGames = await db
        .select()
        .from(games)
        .where(whereClause)
        .orderBy(desc(games.createdAt))
        .limit(limit);

      return availableGames;
    } catch (error) {
      logger.error('Error finding available games:', error);
      throw error;
    }
  }

  /**
   * Adiciona segundo jogador a uma partida multiplayer.
   * 
   * Atualiza partida para incluir player2Id e modifica status para 'active',
   * indicando que o jogo está pronto para começar com ambos jogadores.
   * 
   * @param gameId - ID da partida a receber o segundo jogador
   * @param player2Id - ID do segundo jogador
   * 
   * @returns Promise com dados atualizados da partida
   * 
   * @throws {Error} Erro de banco de dados durante atualização
   */
  async updateGameWithPlayer2(gameId: number, player2Id: number): Promise<Game> {
    try {
      const [updatedGame] = await db
        .update(games)
        .set({
          player2Id,
          status: 'active',
          updatedAt: new Date(),
        })
        .where(eq(games.id, gameId))
        .returning();

      logger.info('Game updated with player 2', {
        gameId,
        player2Id,
        status: 'active',
      });

      return updatedGame;
    } catch (error) {
      logger.error('Error updating game with player 2:', error);
      throw error;
    }
  }

  /**
   * Atualiza dados específicos de uma partida em andamento.
   * 
   * Modifica campo gameData com estado atual do jogo (jogadas, turno, etc.),
   * permitindo persistir progresso de partidas complexas como Dominó.
   * 
   * @param gameId - ID da partida a ser atualizada
   * @param gameData - Novos dados do jogo em formato JSON
   * 
   * @returns Promise<boolean> true se atualização bem-sucedida
   * 
   * @throws {Error} Erro de banco de dados durante atualização
   */
  async updateGameData(gameId: number, gameData: unknown): Promise<boolean> {
    try {
      await db
        .update(games)
        .set({
          gameData,
          updatedAt: new Date(),
        })
        .where(eq(games.id, gameId));

      logger.info('Game data updated', { gameId });
      return true;
    } catch (error) {
      logger.error('Error updating game data:', error);
      throw error;
    }
  }
}
