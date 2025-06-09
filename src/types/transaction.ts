import { z } from 'zod';

export interface Transaction {
  id: number;
  userId: number;
  type: 'deposit' | 'withdrawal' | 'bet_win' | 'bet_loss';
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const createTransactionSchema = z.object({
  userId: z.number().positive(),
  type: z.enum(['deposit', 'withdrawal', 'bet_win', 'bet_loss']),
  amount: z.string().regex(/^\\d+(\\.\\d{1,2})?$/),
  description: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
