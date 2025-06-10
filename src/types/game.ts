import { z } from 'zod';

/**
 * Tipos de jogos suportados pelo sistema.
 * 
 * - coin_flip: Cara ou Coroa
 * - rock_paper_scissors: Pedra, Papel, Tesoura  
 * - dice: Dados (1-6)
 * - domino: Dominó multiplayer
 * - tournament: Torneios eliminatórios
 */
export type GameType = 'coin_flip' | 'rock_paper_scissors' | 'dice' | 'domino' | 'tournament';

/**
 * Estados possíveis de uma partida.
 * 
 * - waiting: Aguardando jogadores
 * - active: Jogo em andamento
 * - completed: Finalizado
 * - cancelled: Cancelado
 * - expired: Expirado por timeout
 */
export type GameStatus = 'waiting' | 'active' | 'completed' | 'cancelled' | 'expired';

/**
 * Modos de jogo disponíveis.
 * 
 * - single_player: Jogador vs casa
 * - multiplayer: Jogador vs jogador
 * - tournament: Múltiplos jogadores em eliminatórias
 */
export type MatchType = 'single_player' | 'multiplayer' | 'tournament';

/**
 * Interface principal representando uma partida no sistema.
 * 
 * Contém todos os dados necessários para identificar, controlar
 * e finalizar um jogo, incluindo jogadores, apostas, status e resultados.
 */
export interface Game {
  /** ID único da partida */
  id: number;
  /** ID do jogador que criou a partida */
  creatorId: number;
  /** ID do segundo jogador (para jogos multiplayer) */
  player2Id?: number | null;
  /** Tipo de jogo sendo jogado */
  gameType: GameType;
  /** Modo de jogo (single/multiplayer/tournament) */
  matchType: MatchType;
  /** Valor da aposta em formato string decimal */
  betAmount: string;
  /** Status atual da partida */
  status: GameStatus;
  /** Dados específicos do jogo em formato JSON */
  gameData: unknown;
  /** ID do jogador vencedor (quando finalizado) */
  winnerId?: number | null;
  /** Valor do prêmio distribuído */
  prize?: string | null;
  /** Valor da comissão da casa */
  rakeAmount?: string | null;
  /** Data/hora de expiração da partida */
  expiresAt?: Date | null;
  /** Data/hora de início da partida */
  startedAt?: Date | null;
  /** Data/hora de finalização */
  completedAt?: Date | null;
  /** Data/hora de criação */
  createdAt: Date;
  /** Data/hora da última atualização */
  updatedAt: Date;
}

/**
 * Resultado de uma partida finalizada.
 * 
 * Contém informações sobre vencedor, escolhas feitas,
 * prêmio obtido e detalhes descritivos do resultado.
 */
export interface GameResult {
  /** Vencedor da partida: jogador, casa ou empate */
  winner: 'player' | 'house' | 'tie';
  /** Escolha feita pelo jogador */
  playerChoice: string;
  /** Escolha/resultado da casa */
  houseChoice: string;
  /** Valor do prêmio em reais */
  prize: number;
  /** Descrição detalhada do resultado */
  details: string;
}

/**
 * Dados específicos para o jogo Cara ou Coroa.
 * 
 * Armazena a escolha do jogador e resultado da jogada
 * para partidas single-player.
 */
export interface CoinFlipData {
  /** Escolha do jogador: cara ou coroa */
  playerChoice: 'heads' | 'tails';
  /** Resultado da moeda (após jogada) */
  result?: 'heads' | 'tails';
  /** Se o jogador ganhou */
  isWin?: boolean;
}

/**
 * Opção de escolha no Cara ou Coroa com metadados visuais.
 * 
 * Define as opções disponíveis com emoji e rótulo
 * para exibição na interface do usuário.
 */
export interface CoinFlipChoice {
  /** Valor da escolha: cara ou coroa */
  choice: 'heads' | 'tails';
  /** Emoji representativo */
  emoji: string;
  /** Rótulo em português */
  label: string;
}

/**
 * Schema de validação para criação de novos jogos.
 * 
 * Valida tipo de jogo, valor da aposta e modo de jogo
 * antes de processar a criação.
 */
export const createGameSchema = z.object({
  gameType: z.enum(['coin_flip', 'rock_paper_scissors', 'dice', 'domino', 'tournament']),
  betAmount: z.number().min(1).max(10000),
  matchType: z.enum(['single_player', 'multiplayer']).default('single_player'),
});

/**
 * Schema de validação para escolhas no Cara ou Coroa.
 */
export const coinFlipChoiceSchema = z.object({
  choice: z.enum(['heads', 'tails']),
});

/** Tipo inferido do schema de criação de jogos */
export type CreateGameInput = z.infer<typeof createGameSchema>;

/** Tipo inferido do schema de escolha Cara ou Coroa */
export type CoinFlipChoiceInput = z.infer<typeof coinFlipChoiceSchema>;

/**
 * Dados de estado para jogos multiplayer de Cara ou Coroa.
 * 
 * Armazena as escolhas de ambos jogadores e resultado
 * da moeda para processamento do vencedor.
 */
export interface CoinFlipGameData {
  /** Escolha do primeiro jogador */
  player1Choice?: 'heads' | 'tails';
  /** Escolha do segundo jogador */
  player2Choice?: 'heads' | 'tails';
  /** Resultado da moeda */
  coinResult?: 'heads' | 'tails';
  /** Data/hora de finalização */
  completedAt?: Date;
}

/**
 * Resultado detalhado de partida multiplayer.
 * 
 * Inclui informações de ambos jogadores, prêmios,
 * comissões e resultado final da partida.
 */
export interface MultiplayerGameResult {
  /** ID da partida */
  gameId: number;
  /** ID do jogador vencedor */
  winnerId: number | null;
  /** Nome do jogador vencedor */
  winnerName?: string | null;
  /** Escolha do criador da partida */
  creatorChoice?: 'heads' | 'tails';
  /** Escolha do segundo jogador */
  player2Choice?: 'heads' | 'tails';
  /** Nome do criador da partida */
  creatorName?: string | null;
  /** Nome do segundo jogador */
  player2Name?: string | null;
  /** Valor do prêmio distribuído */
  prizeAmount: number;
  /** Valor da comissão da casa */
  rakeAmount: number;
  /** Tipo de resultado da partida */
  result: 'creator_wins' | 'player2_wins' | 'creator_wins_tie';
  /** Resultado da moeda (para Cara ou Coroa) */
  coinResult?: 'heads' | 'tails';
}

/**
 * Resultado de uma jogada em partida multiplayer.
 * 
 * Indica se ainda aguarda jogadas ou se a partida foi finalizada
 * com resultado completo.
 */
export interface GameMoveResult {
  /** Se ainda aguarda jogadas de outros jogadores */
  waiting: boolean;
  /** Resultado final (quando waiting = false) */
  result?: MultiplayerGameResult;
}

/**
 * Opções disponíveis para o jogo Cara ou Coroa.
 * 
 * Define as duas escolhas possíveis com seus respectivos
 * emojis e rótulos em português.
 */
export const COIN_FLIP_CHOICES: CoinFlipChoice[] = [
  { choice: 'heads', emoji: '😎', label: 'Cara' },
  { choice: 'tails', emoji: '👑', label: 'Coroa' },
];

/**
 * Informações descritivas de todos os tipos de jogos.
 * 
 * Metadados para exibição na interface incluindo nome,
 * emoji, descrição, limites de jogadores e tempo médio.
 */
export const GAME_TYPES_INFO = {
  coin_flip: {
    name: 'Cara ou Coroa',
    emoji: '🪙',
    description: 'Escolha cara ou coroa e teste sua sorte!',
    minPlayers: 1,
    maxPlayers: 1,
    averageTime: '10 segundos',
  },
  rock_paper_scissors: {
    name: 'Pedra, Papel, Tesoura',
    emoji: '✂️',
    description: 'Clássico jogo de estratégia!',
    minPlayers: 1,
    maxPlayers: 1,
    averageTime: '15 segundos',
  },
  dice: {
    name: 'Dados',
    emoji: '🎲',
    description: 'Escolha um número de 1 a 6!',
    minPlayers: 1,
    maxPlayers: 1,
    averageTime: '10 segundos',
  },
  domino: {
    name: 'Dominó',
    emoji: '🀱',
    description: 'Jogo de dominó multiplayer!',
    minPlayers: 2,
    maxPlayers: 4,
    averageTime: '10-15 minutos',
  },
  tournament: {
    name: 'Torneio',
    emoji: '🏆',
    description: 'Competição eliminatória entre múltiplos jogadores!',
    minPlayers: 4,
    maxPlayers: 16,
    averageTime: '30-60 minutos',
  },
} as const;

/**
 * Representa uma peça de dominó com seus valores numéricos.
 * 
 * Cada peça possui dois lados com valores de 0 a 6,
 * e um ID único para identificação durante o jogo.
 */
export interface DominoPiece {
  /** Valor numérico do lado esquerdo (0-6) */
  left: number;
  /** Valor numérico do lado direito (0-6) */
  right: number;
  /** Identificador único da peça */
  id: string;
}

/**
 * Estado completo de uma partida de Dominó.
 * 
 * Mantém controle de todas as peças, jogadores, turno atual
 * e estado da mesa para permitir jogadas e determinar vencedor.
 */
export interface DominoGameState {
  /** Peças restantes no deck para compra */
  deck: DominoPiece[];
  /** Peças já jogadas na mesa */
  table: DominoPiece[];
  /** Mãos de cada jogador organizadas por ID */
  playerHands: { [playerId: string]: DominoPiece[] };
  /** Valor da ponta esquerda da mesa */
  leftEnd: number | null;
  /** Valor da ponta direita da mesa */
  rightEnd: number | null;
  /** ID do jogador da vez */
  currentPlayer: string;
  /** Rodada atual */
  round: number;
  /** Número máximo de rodadas */
  maxRounds: number;
  /** Pontuação de cada jogador */
  scores: { [playerId: string]: number };
  /** Se o jogo já começou */
  gameStarted: boolean;
  /** Se o jogo está bloqueado (ninguém pode jogar) */
  isBlocked: boolean;
  /** Dados da última jogada realizada */
  lastMove?: {
    playerId: string;
    piece: DominoPiece;
    side: 'left' | 'right';
  };
}

/**
 * Dados de jogo para persistência no banco de dados.
 * 
 * Estrutura idêntica ao DominoGameState, utilizada para
 * armazenar estado de partidas em andamento.
 */
export interface DominoGameData {
  /** Peças restantes no deck para compra */
  deck: DominoPiece[];
  /** Peças já jogadas na mesa */
  table: DominoPiece[];
  /** Mãos de cada jogador organizadas por ID */
  playerHands: { [playerId: string]: DominoPiece[] };
  /** Valor da ponta esquerda da mesa */
  leftEnd: number | null;
  /** Valor da ponta direita da mesa */
  rightEnd: number | null;
  /** ID do jogador da vez */
  currentPlayer: string;
  /** Rodada atual */
  round: number;
  /** Número máximo de rodadas */
  maxRounds: number;
  /** Pontuação de cada jogador */
  scores: { [playerId: string]: number };
  /** Se o jogo já começou */
  gameStarted: boolean;
  /** Se o jogo está bloqueado (ninguém pode jogar) */
  isBlocked: boolean;
  /** Dados da última jogada realizada */
  lastMove?: {
    playerId: string;
    piece: DominoPiece;
    side: 'left' | 'right';
  };
}

/**
 * Entrada para uma jogada de Dominó.
 * 
 * Define a peça a ser jogada e o lado da mesa
 * onde deve ser colocada.
 */
export interface DominoMoveInput {
  /** ID da peça a ser jogada */
  pieceId: string;
  /** Lado da mesa onde jogar */
  side: 'left' | 'right';
}

/**
 * Resultado de uma jogada de Dominó.
 * 
 * Estende GameMoveResult com informações específicas
 * do dominó como estado atual e jogadas disponíveis.
 */
export interface DominoMoveResult extends GameMoveResult {
  /** Estado atual do jogo após a jogada */
  gameState?: DominoGameState;
  /** Jogadas disponíveis para o próximo turno */
  availableMoves?: Array<{ piece: DominoPiece; sides: ('left' | 'right')[] }>;
  /** Interface visual do jogo */
  gameInterface?: string;
}

/**
 * Schema de validação para jogadas de Dominó.
 */
export const dominoMoveSchema = z.object({
  pieceId: z.string(),
  side: z.enum(['left', 'right']),
});

/** Tipo validado para jogadas de Dominó */
export type DominoMoveInputValidated = z.infer<typeof dominoMoveSchema>;
