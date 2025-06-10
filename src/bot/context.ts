import { User } from '@/types/user';
import { Context } from 'telegraf';

export interface GameContext extends Context {
  session?: {
    activeMatchId?: number;
    activeMatch?: unknown;
    step?: string;
    data?: unknown;
    selectedGame?: string;
    betAmount?: number;
    [key: string]: unknown;
  };
  state: {
    user?: User;
    [key: string]: unknown;
  };
}
