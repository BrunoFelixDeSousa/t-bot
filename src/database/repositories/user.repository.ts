import { CreateUserInput, User } from '@/types/user';
import { logger } from '@/utils/logger';
import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { users } from '../schema/schema';

export class UserRepository {
  async create(userData: CreateUserInput): Promise<User> {
    try {
      const [newUser] = await db
        .insert(users)
        .values({
          telegramId: userData.telegramId,
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
        })
        .returning();

      logger.info('Usuário criado', {
        userId: newUser.id,
        telegramId: newUser.telegramId,
      });

      return newUser;
    } catch (error) {
      logger.error('Erro ao criar Usuário:', error);
      throw new Error('Falha ao criar usuário');
    }
  }

  async findByTelegramId(telegramId: string): Promise<User | null> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.telegramId, telegramId))
        .limit(1);

      return user.length > 0 ? user[0] : null;
    } catch (error) {
      logger.error('Erro ao buscar usuário por Telegram ID:', error);
      throw new Error('Falha ao buscar usuário');
    }
  }

  async findById(userId: number): Promise<User | null> {
    try {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      return user.length > 0 ? user[0] : null;
    } catch (error) {
      logger.error('Erro ao buscar usuário por ID:', error);
      throw new Error('Falha ao buscar usuário');
    }
  }

  async updateBalance(userId: number, newBalance: string): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({ balance: newBalance })
        .where(eq(users.id, userId));

      logger.info('Saldo atualizado com sucesso', {
        userId,
        newBalance,
      });
      return true;
    } catch (error) {
      logger.error(`Erro ao atualizar saldo do usuário ${userId}:`, error);
      throw new Error('Falha ao atualizar saldo do usuário');
    }
  }

  async updateLastActivity(userId: number): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({ lastActivity: new Date() })
        .where(eq(users.id, userId));

      return true;
    } catch (error) {
      logger.error(`Erro ao atualizar última atividade do usuário ${userId}:`, error);
      throw new Error('Falha ao atualizar última atividade');
    }
  }

  async updateChatId(userId: number, chatId: string): Promise<boolean> {
    try {
      await db
        .update(users)
        .set({ chatId })
        .where(eq(users.id, userId));

      logger.info('ChatId atualizado com sucesso', {
        userId,
        chatId,
      });
      return true;
    } catch (error) {
      logger.error(`Erro ao atualizar chatId do usuário ${userId}:`, error);
      throw new Error('Falha ao atualizar chatId do usuário');
    }
  }
}
