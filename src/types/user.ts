import { z } from 'zod';

export interface User {
  id: number;
  telegramId: string;
  chatId?: string | null; // Para notificações
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
  balance: string; // Using string to represent decimal values
  status: 'active' | 'suspended' | 'banned';
  isActive: boolean;
  lastActivity?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const createUserSchema = z.object({
  telegramId: z.string().min(1),
  chatId: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  username: z.string().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
