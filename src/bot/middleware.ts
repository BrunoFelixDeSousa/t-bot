import { config } from '@/config';
import { UserService } from '@/services/user.service';
import { logger } from '@/utils/logger';
import { GameContext } from './context';

const userService = new UserService();

/**
 * Middleware para autenticação e gerenciamento de usuários
 * Busca ou cria usuário no banco de dados e adiciona ao contexto
 * @param ctx - Contexto do Telegram
 * @param next - Próxima função na cadeia de middleware
 */
export async function userMiddleware(ctx: GameContext, next: () => Promise<void>) {
  try {
    if (!ctx.from) {
      await ctx.reply('❌ Erro: Usuário não identificado');
      return;
    }

    const telegramId = ctx.from.id.toString();
    const chatId = ctx.chat?.id.toString();

    // Buscar usuário existente
    let user = await userService.getUserByTelegramId(telegramId);

    // Criar usuário se não existir
    if (!user) {
      user = await userService.findOrCreateUser({
        telegramId,
        chatId,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        username: ctx.from.username,
      });

      logger.info('New user registered', {
        userId: user.id,
        telegramId: user.telegramId,
        chatId: user.chatId,
        username: user.username
      });
    } else {
      // Atualizar chatId se mudou
      if (user.chatId !== chatId && chatId) {
        await userService.updateUserChatId(user.id, chatId);
        user.chatId = chatId;
      }
    }

    // Adicionar ao contexto seguindo a estrutura do projeto original
    ctx.state = { 
      ...ctx.state, 
      user,
      isAdmin: config.admin.telegramIds.includes(ctx.from.id)
    };

    await next();
  } catch (error) {
    logger.error('Error in user middleware:', error);
    await ctx.reply('❌ Erro interno. Tente novamente.');
  }
}

export function adminMiddleware(ctx: GameContext, next: () => Promise<void>) {
  if (!ctx.state?.isAdmin) {
    ctx.reply('❌ Acesso negado. Apenas administradores.');
    return Promise.resolve();
  }
  return next();
}
