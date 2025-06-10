import { Telegraf } from 'telegraf';
import { GameContext } from '../bot/context';
import { logger } from '../utils/logger';

/**
 * Serviço de notificações para o bot do Telegram
 * Responsável por enviar mensagens e notificações para usuários
 */
export class NotificationService {
  private bot: Telegraf<GameContext>;

  /**
   * Construtor do serviço de notificações
   * @param bot - Instância do bot Telegraf
   */
  constructor(bot: Telegraf<GameContext>) {
    this.bot = bot;
  }

  /**
   * Envia uma notificação para um usuário específico
   * @param chatId - ID do chat do usuário
   * @param message - Mensagem a ser enviada
   * @param options - Opções adicionais do Telegram (opcional)
   * @returns Promise<boolean> indicando se a notificação foi enviada com sucesso
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
   * Notifica o criador de uma partida que alguém entrou
   * @param creatorChatId - Chat ID do criador da partida
   * @param playerName - Nome do jogador que entrou
   * @param gameId - ID da partida
   * @returns Promise<boolean> indicando sucesso do envio
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
   * Notifica o resultado da partida para um jogador
   * @param chatId - Chat ID do jogador
   * @param isWinner - Se o jogador ganhou
   * @param gameId - ID da partida
   * @param opponentName - Nome do oponente
   * @param prize - Valor do prêmio (se ganhou)
   * @returns Promise<boolean> indicando sucesso do envio
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
   * Notifica que uma partida expirou
   * @param chatId - Chat ID do usuário
   * @param gameId - ID da partida que expirou
   * @returns Promise<boolean> indicando sucesso do envio
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
