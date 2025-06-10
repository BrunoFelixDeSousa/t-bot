import { User } from '@/types/user';
import { Context } from 'telegraf';

export interface GameContext extends Context {
  user?: User;
  isAdmin?: boolean;
}
