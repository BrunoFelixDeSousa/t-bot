import { Telegraf } from 'telegraf';
import { GameContext } from '../bot/context';
import { logger } from '../utils/logger';

export class NotificationService {
  private bot: Telegraf<GameContext>;

  constructor(bot: Telegraf<GameContext>) {
    this.bot = bot;
  }

  /**
   * Enviar notificação para um usuário específico
   */
  async sendNotification(chatId: string, message: string, options?: object): Promise<boolean> {
    try {
      await this.bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
        ...options
      });
      
      logger.info('Notification sent successfully', {
        chatId,
        messageLength: message.length
      });
      
      return true;
    } catch (error) {
      logger.error('Error sending notification:', error, {
        chatId,
        message: message.substring(0, 100) + '...'
      });
      return false;
    }
  }

  /**
   * Notificar que alguém entrou na partida
   */
  async notifyPlayerJoined(creatorChatId: string, playerName: string, gameId: number): Promise<boolean> {
    const message = `🎮 *${playerName} entrou na sua partida!*\n\n🆔 Partida: #${gameId}\n⏳ Aguardando sua jogada...\n\nFaça sua escolha:`;
    
    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '😎 Cara', callback_data: `make_move_${gameId}_heads` },
            { text: '👑 Coroa', callback_data: `make_move_${gameId}_tails` }
          ]
        ]
      }
    };

    return await this.sendNotification(creatorChatId, message, keyboard);
  }

  /**
   * Notificar resultado da partida
   */
  async notifyGameResult(chatId: string, isWinner: boolean, gameId: number, opponentName: string, prize?: number): Promise<boolean> {
    let message: string;
    
    if (isWinner) {
      message = `🎉 *VOCÊ GANHOU!*\n\n🆔 Partida: #${gameId}\n👤 Adversário: ${opponentName}\n💰 Prêmio: R$ ${prize?.toFixed(2)}\n\n🎮 Quer jogar novamente?`;
    } else {
      message = `😔 *VOCÊ PERDEU!*\n\n🆔 Partida: #${gameId}\n👤 Adversário: ${opponentName}\n\n🎮 Quer tentar novamente?`;
    }

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Jogar Novamente', callback_data: 'game_coin_flip' }],
          [{ text: '🏠 Menu Principal', callback_data: 'back_main' }]
        ]
      }
    };

    return await this.sendNotification(chatId, message, keyboard);
  }

  /**
   * Notificar que uma partida expirou
   */
  async notifyGameExpired(chatId: string, gameId: number): Promise<boolean> {
    const message = `⏰ *Partida Expirou*\n\n🆔 Partida: #${gameId}\n\nNinguém entrou na sua partida a tempo.\nSeu valor foi devolvido.`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🎮 Criar Nova Partida', callback_data: 'create_coin_flip' }],
          [{ text: '🏠 Menu Principal', callback_data: 'back_main' }]
        ]
      }
    };

    return await this.sendNotification(chatId, message, keyboard);
  }
}
