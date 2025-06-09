import {
  boolean,
  decimal,
  pgEnum,
  pgTable,
  serial,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

// Define an enum for user status
export const userStatusEnum = pgEnum('user_status', [
  'active',
  'suspended',
  'banned',
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  telegramId: varchar('telegram_id', { length: 50 }).notNull().unique(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  username: varchar('username', { length: 100 }),
  balance: decimal('balance', { precision: 10, scale: 2 })
    .default('0.0')
    .notNull(),
  status: userStatusEnum('status').default('active').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastActivity: timestamp('last_activity').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
