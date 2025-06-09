import { CreateTransactionInput, Transaction } from '@/types/transaction';
import { logger } from '@/utils/logger';
import { eq } from 'drizzle-orm';
import { db } from '../connection';
import { transactions } from '../schema/schema';

export class TransactionRepository {
  async create(
    transactionData: CreateTransactionInput & {
      balanceBefore: string;
      balanceAfter: string;
    },
  ): Promise<Transaction> {
    try {
      const [newTransaction] = await db
        .insert(transactions)
        .values({
          userId: transactionData.userId,
          type: transactionData.type,
          amount: transactionData.amount,
          balanceBefore: transactionData.balanceBefore,
          balanceAfter: transactionData.balanceAfter,
          description: transactionData.description,
          status: 'completed',
        })
        .returning();

      logger.info('Transaction created', {
        transactionId: newTransaction.id,
        userId: newTransaction.userId,
        type: newTransaction.type,
        amount: newTransaction.amount,
      });

      return newTransaction;
    } catch (error) {
      logger.error('Erro ao criar transação:', error);
      throw new Error('Falha ao criar transação');
    }
  }

  async findByUserId(
    userId: number,
    limit: number = 20,
  ): Promise<Transaction[]> {
    try {
      const transactionsList = await db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .limit(limit);

      return transactionsList;
    } catch (error) {
      logger.error('Erro ao buscar transações por usuário:', error);
      throw new Error('Falha ao buscar transações');
    }
  }
}
