import { z } from 'zod';

export type GameType = 'coin_flip' | 'rock_paper_scissors' | 'dice' | 'domino';
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
  gameType: z.enum(['coin_flip', 'rock_paper_scissors', 'dice', 'domino']),
  betAmount: z.number().min(1).max(10000),
  matchType: z.enum(['single_player', 'multiplayer']).default('single_player'),
});

export const coinFlipChoiceSchema = z.object({
  choice: z.enum(['heads', 'tails']),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type CoinFlipChoiceInput = z.infer<typeof coinFlipChoiceSchema>;

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
} as const;
