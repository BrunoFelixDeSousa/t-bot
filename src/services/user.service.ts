import { transactionRepository, userRepository } from '@/database/repositories';
import { AppError } from '@/types';
import { Transaction } from '@/types/transaction';
import { CreateUserInput, User } from '@/types/user';
import { isValidAmount } from '@/utils/helpers';
import { logger } from '@/utils/logger';

export class UserService {
  async createUser(userData: CreateUserInput): Promise<User> {
    try {
      const existingUser = await userRepository.findByTelegramId(
        userData.telegramId,
      );
      if (existingUser) {
        throw new AppError('Usuário já existe', 400);
      }

      return await userRepository.create(userData);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erro em UserService.createUser:', error);
      throw new AppError('Erro interno do servidor', 500);
    }
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    try {
      const user = await userRepository.findByTelegramId(telegramId);
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }
      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erro em UserService.getUserByTelegramId:', error);
      throw new AppError('Erro interno do servidor', 500);
    }
  }

  async getUserById(userId: number): Promise<User | null> {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }
      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in UserService.getUserById:', error);
      throw new AppError('Erro interno do servidor', 500);
    }
  }

  async updateUserBalance(
    userId: number,
    amount: string,
    type: 'add' | 'subtract',
  ): Promise<boolean> {
    try {
      if (!isValidAmount(amount)) {
        throw new AppError('Valor inválido', 400);
      }

      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }

      const currentBalance = parseFloat(user.balance);
      const changeAmount = parseFloat(amount);
      const newBalance =
        type === 'add'
          ? currentBalance + changeAmount
          : currentBalance - changeAmount;

      if (newBalance < 0) {
        throw new AppError('Saldo insuficiente', 400);
      }

      await transactionRepository.create({
        userId,
        type: type === 'add' ? 'deposit' : 'withdrawal',
        amount: amount,
        balanceBefore: currentBalance.toFixed(2),
        balanceAfter: newBalance.toFixed(2),
        description: `${type === 'add' ? 'Depósito' : 'Saque'} manual`,
      });

      await userRepository.updateBalance(userId, newBalance.toFixed(2));

      logger.info('Saldo do usuário atualizado', {
        userId,
        oldBalance: currentBalance,
        newBalance,
        change: `${type} ${amount}`,
      });

      return true;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erro ao atualizar o saldo do usuário:', error);
      throw new AppError('Erro interno do servidor', 500);
    }
  }

  async getUserTransactions(
    userId: number,
    limit: number = 20,
  ): Promise<Transaction[]> {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError('Usuário não encontrado', 404);
      }

      return await transactionRepository.findByUserId(userId, limit);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Erro ao buscar transações do usuário:', error);
      throw new AppError('Erro interno do servidor', 500);
    }
  }
}
