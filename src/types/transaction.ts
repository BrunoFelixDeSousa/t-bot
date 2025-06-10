import { z } from 'zod';

/**
 * Interface que representa uma transação financeira no sistema
 */
export interface Transaction {
  /** ID único da transação */
  id: number;
  /** ID do usuário que realizou a transação */
  userId: number;
  /** Tipo da transação */
  type: 'deposit' | 'withdrawal' | 'bet_win' | 'bet_loss';
  /** Valor da transação em string para precisão decimal */
  amount: string;
  /** Saldo antes da transação */
  balanceBefore: string;
  /** Saldo após a transação */
  balanceAfter: string;
  /** Status atual da transação */
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  /** Descrição opcional da transação */
  description?: string | null;
  /** Data de criação da transação */
  createdAt: Date;
  /** Data da última atualização */
  updatedAt: Date;
}

/**
 * Schema de validação para criação de transação usando Zod
 */
export const createTransactionSchema = z.object({
  /** ID do usuário (obrigatório e positivo) */
  userId: z.number().positive(),
  /** Tipo da transação (enum) */
  type: z.enum(['deposit', 'withdrawal', 'bet_win', 'bet_loss']),
  /** Valor no formato decimal (ex: "10.50") */
  amount: z.string().regex(/^\\d+(\\.\\d{1,2})?$/),
  /** Descrição opcional */
  description: z.string().optional(),
});

/**
 * Tipo inferido do schema de criação de transação
 */
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
