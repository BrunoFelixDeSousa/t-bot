import { relations } from 'drizzle-orm';
import {
    boolean,
    decimal,
    integer,
    json,
    pgEnum,
    pgTable,
    serial,
    text,
    timestamp,
    varchar,
} from 'drizzle-orm/pg-core';

/**
 * Schema do banco de dados usando Drizzle ORM
 * Define todas as tabelas, enums e relacionamentos
 */

// Enums para tipagem segura

/** Enum para status de usuário */
export const userStatusEnum = pgEnum('user_status', [
  'active',
  'suspended',
  'banned',
]);

/** Enum para tipos de transação */
export const transactionTypeEnum = pgEnum('transaction_type', [
  'deposit',
  'withdrawal',
  'bet_win',
  'bet_loss',
]);

/** Enum para status de transação */
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'completed',
  'failed',
  'cancelled',
]);

/** Enum para tipos de jogo */
export const gameTypeEnum = pgEnum('game_type', [
  'coin_flip',
  'rock_paper_scissors',
  'dice',
  'domino',
  'tournament',
]);

/** Enum para status de jogo */
export const gameStatusEnum = pgEnum('game_status', [
  'waiting',
  'active',
  'completed',
  'cancelled',
  'expired',
]);

/** Enum para tipos de partida */
export const matchTypeEnum = pgEnum('match_type', [
  'single_player',
  'multiplayer',
  'tournament',
]);

// Definição das tabelas

/**
 * Tabela de usuários
 * Armazena informações dos usuários do Telegram
 */
export const users = pgTable('users', {
  /** ID único do usuário */
  id: serial('id').primaryKey(),
  /** ID único do usuário no Telegram */
  telegramId: varchar('telegram_id', { length: 50 }).notNull().unique(),
  /** ID do chat para notificações */
  chatId: varchar('chat_id', { length: 50 }),
  /** Primeiro nome do usuário */
  firstName: varchar('first_name', { length: 100 }),
  /** Sobrenome do usuário */
  lastName: varchar('last_name', { length: 100 }),
  /** Username do usuário no Telegram */
  username: varchar('username', { length: 100 }),
  /** Saldo atual do usuário */
  balance: decimal('balance', { precision: 10, scale: 2 })
    .default('0.00')
    .notNull(),
  /** Status do usuário */
  status: userStatusEnum('status').default('active').notNull(),
  /** Se o usuário está ativo */
  isActive: boolean('is_active').default(true).notNull(),
  /** Última atividade do usuário */
  lastActivity: timestamp('last_activity').defaultNow(),
  /** Data de criação */
  createdAt: timestamp('created_at').defaultNow().notNull(),
  /** Data da última atualização */
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Tabela de transações
 * Registra todas as movimentações financeiras
 */
export const transactions = pgTable('transactions', {
  /** ID único da transação */
  id: serial('id').primaryKey(),
  /** Referência ao usuário */
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  /** Tipo da transação */
  type: transactionTypeEnum('type').notNull(),
  /** Valor da transação */
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  /** Saldo antes da transação */
  balanceBefore: decimal('balance_before', {
    precision: 10,
    scale: 2,
  }).notNull(),
  /** Saldo após a transação */
  balanceAfter: decimal('balance_after', { precision: 10, scale: 2 }).notNull(),
  /** Status da transação */
  status: transactionStatusEnum('status').default('pending').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Games table
export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  creatorId: integer('creator_id')
    .references(() => users.id)
    .notNull(),
  player2Id: integer('player2_id').references(() => users.id),
  gameType: gameTypeEnum('game_type').notNull(),
  matchType: matchTypeEnum('match_type').default('single_player').notNull(),
  betAmount: decimal('bet_amount', { precision: 10, scale: 2 }).notNull(),
  status: gameStatusEnum('status').default('waiting').notNull(),
  gameData: json('game_data'), // Dados específicos do jogo
  winnerId: integer('winner_id').references(() => users.id),
  prize: decimal('prize', { precision: 10, scale: 2 }),
  rakeAmount: decimal('rake_amount', { precision: 10, scale: 2 }),
  expiresAt: timestamp('expires_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  transactions: many(transactions),
  createdGames: many(games, { relationName: 'creator' }),
  player2Games: many(games, { relationName: 'player2' }),
  wonGames: many(games, { relationName: 'winner' }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const gamesRelations = relations(games, ({ one }) => ({
  creator: one(users, {
    fields: [games.creatorId],
    references: [users.id],
    relationName: 'creator',
  }),
  player2: one(users, {
    fields: [games.player2Id],
    references: [users.id],
    relationName: 'player2',
  }),
  winner: one(users, {
    fields: [games.winnerId],
    references: [users.id],
    relationName: 'winner',
  }),
}));
