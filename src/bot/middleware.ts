import { config } from '@/config';
import { UserService } from '@/services/user.service';
import { logger } from '@/utils/logger';
import { GameContext } from './context';

const userService = new UserService();

export async function userMiddleware(ctx: GameContext, next: () => Promise<void>) {
  try {
    if (!ctx.from) {
      await ctx.reply('❌ Erro: Usuário não identificado');
      return;
    }

    const telegramId = ctx.from.id.toString();

    // Buscar usuário existente
    let user = await userService.getUserByTelegramId(telegramId);

    // Criar usuário se não existir
    if (!user) {
      user = await userService.createUser({
        telegramId,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        username: ctx.from.username,
      });

      logger.info('New user registered', {
        userId: user.id,
        telegramId: user.telegramId,
        username: user.username
      });
    }

    // Adicionar ao contexto
    ctx.user = user;
    ctx.isAdmin = config.admin.telegramIds.includes(ctx.from.id);

    await next();
  } catch (error) {
    logger.error('Error in user middleware:', error);
    await ctx.reply('❌ Erro interno. Tente novamente.');
  }
}

export function adminMiddleware(ctx: GameContext, next: () => Promise<void>) {
  if (!ctx.isAdmin) {
    ctx.reply('❌ Acesso negado. Apenas administradores.');
    return Promise.resolve();
  }
  return next();
}
