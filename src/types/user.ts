import { z } from 'zod';

/**
 * Interface que representa um usuário no sistema
 */
export interface User {
  /** ID único do usuário no banco de dados */
  id: number;
  /** ID único do usuário no Telegram */
  telegramId: string;
  /** ID do chat para notificações (opcional) */
  chatId?: string | null;
  /** Primeiro nome do usuário */
  firstName?: string | null;
  /** Sobrenome do usuário */
  lastName?: string | null;
  /** Username do usuário no Telegram (sem @) */
  username?: string | null;
  /** Saldo em string para representar valores decimais precisos */
  balance: string;
  /** Status atual do usuário */
  status: 'active' | 'suspended' | 'banned';
  /** Se o usuário está ativo no sistema */
  isActive: boolean;
  /** Data da última atividade do usuário */
  lastActivity?: Date | null;
  /** Data de criação do registro */
  createdAt: Date;
  /** Data da última atualização */
  updatedAt: Date;
}

/**
 * Schema de validação para criação de usuário usando Zod
 */
export const createUserSchema = z.object({
  /** ID do Telegram (obrigatório) */
  telegramId: z.string().min(1),
  /** ID do chat (opcional) */
  chatId: z.string().optional(),
  /** Primeiro nome (opcional) */
  firstName: z.string().optional(),
  /** Sobrenome (opcional) */
  lastName: z.string().optional(),
  /** Username (opcional) */
  username: z.string().optional(),
});

/**
 * Tipo inferido do schema de criação de usuário
 */
export type CreateUserInput = z.infer<typeof createUserSchema>;
