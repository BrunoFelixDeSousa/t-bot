import { transactionRepository, userRepository } from '@/database/repositories';
import { AppError } from '@/types';
import { Transaction } from '@/types/transaction';
import { CreateUserInput, User } from '@/types/user';
import { isValidAmount } from '@/utils/helpers';
import { logger } from '@/utils/logger';

export class UserService {
  async findOrCreateUser(userData: CreateUserInput): Promise<User> {
    try {
      const existingUser = await userRepository.findByTelegramId(
        userData.telegramId,
      );
      if (existingUser) {
        return existingUser; // Retorna usuário existente ao invés de erro
      }

      const newUser = await userRepository.create(userData);
      logger.info('Novo usuário criado:', {
        userId: newUser.id,
        telegramId: newUser.telegramId,
      });
      
      return newUser;
    } catch (error) {
      logger.error('Erro em UserService.findOrCreateUser:', error);
      throw new AppError('Erro interno do servidor', 500);
    }
  }

  async getUserByTelegramId(telegramId: string): Promise<User | null> {
    try {
      const user = await userRepository.findByTelegramId(telegramId);
      return user; // Retorna user ou null se não encontrar
    } catch (error) {
      logger.error('Erro em UserService.getUserByTelegramId:', error);
      throw new AppError('Erro interno do servidor', 500);
    }
  }

  async getUserById(userId: number): Promise<User> {
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

  async checkSufficientBalance(userId: number, requiredAmount: string): Promise<boolean> {
    try {
      const user = await this.getUserById(userId);
      if (!user) return false;
      
      const currentBalance = parseFloat(user.balance);
      const required = parseFloat(requiredAmount);

      return currentBalance >= required;
    } catch (error) {
      logger.error('Erro ao verificar saldo:', error);
      return false;
    }
  }

  async updateLastActivity(userId: number): Promise<void> {
    try {
      await userRepository.updateLastActivity(userId);
    } catch (error) {
      logger.error('Erro ao atualizar última atividade:', error);
      // Não lança erro para não quebrar o fluxo principal
    }
  }
}
