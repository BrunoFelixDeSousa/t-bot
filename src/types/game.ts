import { z } from 'zod';

export type GameType = 'coin_flip' | 'rock_paper_scissors' | 'dice' | 'domino' | 'tournament';
export type GameStatus = 'waiting' | 'active' | 'completed' | 'cancelled' | 'expired';
export type MatchType = 'single_player' | 'multiplayer' | 'tournament';

export interface Game {
  id: number;
  creatorId: number;
  player2Id?: number | null;
  gameType: GameType;
  matchType: MatchType;
  betAmount: string;
  status: GameStatus;
  gameData: unknown; // JSON com dados específicos do jogo
  winnerId?: number | null;
  prize?: string | null;
  rakeAmount?: string | null;
  expiresAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface GameResult {
  winner: 'player' | 'house' | 'tie';
  playerChoice: string;
  houseChoice: string;
  prize: number;
  details: string;
}

export interface CoinFlipData {
  playerChoice: 'heads' | 'tails';
  result?: 'heads' | 'tails';
  isWin?: boolean;
}

export interface CoinFlipChoice {
  choice: 'heads' | 'tails';
  emoji: string;
  label: string;
}

// Validation schemas
export const createGameSchema = z.object({
  gameType: z.enum(['coin_flip', 'rock_paper_scissors', 'dice', 'domino', 'tournament']),
  betAmount: z.number().min(1).max(10000),
  matchType: z.enum(['single_player', 'multiplayer']).default('single_player'),
});

export const coinFlipChoiceSchema = z.object({
  choice: z.enum(['heads', 'tails']),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type CoinFlipChoiceInput = z.infer<typeof coinFlipChoiceSchema>;

// Multiplayer game data types
export interface CoinFlipGameData {
  player1Choice?: 'heads' | 'tails';
  player2Choice?: 'heads' | 'tails';
  coinResult?: 'heads' | 'tails';
  completedAt?: Date;
}

export interface MultiplayerGameResult {
  gameId: number;
  winnerId: number | null;
  winnerName?: string | null;
  creatorChoice?: 'heads' | 'tails';
  player2Choice?: 'heads' | 'tails';
  creatorName?: string | null;
  player2Name?: string | null;
  prizeAmount: number;
  rakeAmount: number;
  result: 'creator_wins' | 'player2_wins' | 'creator_wins_tie';
  coinResult?: 'heads' | 'tails';
}

export interface GameMoveResult {
  waiting: boolean;
  result?: MultiplayerGameResult;
}

// Game constants
export const COIN_FLIP_CHOICES: CoinFlipChoice[] = [
  { choice: 'heads', emoji: '😎', label: 'Cara' },
  { choice: 'tails', emoji: '👑', label: 'Coroa' },
];

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

// Domino specific types
export interface DominoPiece {
  left: number;
  right: number;
  id: string;
}

export interface DominoGameState {
  deck: DominoPiece[];
  table: DominoPiece[];
  playerHands: { [playerId: string]: DominoPiece[] };
  leftEnd: number | null;
  rightEnd: number | null;
  currentPlayer: string;
  round: number;
  maxRounds: number;
  scores: { [playerId: string]: number };
  gameStarted: boolean;
  isBlocked: boolean;
  lastMove?: {
    playerId: string;
    piece: DominoPiece;
    side: 'left' | 'right';
  };
}

export interface DominoGameData {
  deck: DominoPiece[];
  table: DominoPiece[];
  playerHands: { [playerId: string]: DominoPiece[] };
  leftEnd: number | null;
  rightEnd: number | null;
  currentPlayer: string;
  round: number;
  maxRounds: number;
  scores: { [playerId: string]: number };
  gameStarted: boolean;
  isBlocked: boolean;
  lastMove?: {
    playerId: string;
    piece: DominoPiece;
    side: 'left' | 'right';
  };
}

export interface DominoMoveInput {
  pieceId: string;
  side: 'left' | 'right';
}

export interface DominoMoveResult extends GameMoveResult {
  gameState?: DominoGameState;
  availableMoves?: Array<{ piece: DominoPiece; sides: ('left' | 'right')[] }>;
  gameInterface?: string;
}

// Validation schemas
export const dominoMoveSchema = z.object({
  pieceId: z.string(),
  side: z.enum(['left', 'right']),
});

export type DominoMoveInputValidated = z.infer<typeof dominoMoveSchema>;
