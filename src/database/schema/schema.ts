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

// Enums
export const userStatusEnum = pgEnum('user_status', [
  'active',
  'suspended',
  'banned',
]);
export const transactionTypeEnum = pgEnum('transaction_type', [
  'deposit',
  'withdrawal',
  'bet_win',
  'bet_loss',
]);
export const transactionStatusEnum = pgEnum('transaction_status', [
  'pending',
  'completed',
  'failed',
  'cancelled',
]);
export const gameTypeEnum = pgEnum('game_type', [
  'coin_flip',
  'rock_paper_scissors',
  'dice',
  'domino',
]);
export const gameStatusEnum = pgEnum('game_status', [
  'waiting',
  'active',
  'completed',
  'cancelled',
  'expired',
]);
export const matchTypeEnum = pgEnum('match_type', [
  'single_player',
  'multiplayer',
  'tournament',
]);

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: varchar('telegram_id', { length: 50 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  username: varchar('username', { length: 100 }),
  balance: decimal('balance', { precision: 10, scale: 2 })
    .default('0.00')
    .notNull(),
  status: userStatusEnum('status').default('active').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastActivity: timestamp('last_activity').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  type: transactionTypeEnum('type').notNull(),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  balanceBefore: decimal('balance_before', {
    precision: 10,
    scale: 2,
  }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 10, scale: 2 }).notNull(),
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
  winner: one(users, {
    fields: [games.winnerId],
    references: [users.id],
    relationName: 'winner',
  }),
}));
