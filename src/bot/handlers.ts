/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserService } from '@/services/user.service';
import { Telegraf } from 'telegraf';
import { COIN_CHOICES, COIN_CHOICE_LABELS, EMOJIS, GAME_TYPES, MESSAGES } from '../utils/constants';
import { formatCurrency } from '../utils/helpers';
import { logger } from '../utils/logger';
import { GameContext } from './context';
import {
  betAmountKeyboard,
  coinFlipChoiceKeyboard,
  gameMenuKeyboard,
  mainMenuKeyboard,
  playAgainKeyboard,
  walletMenuKeyboard,
} from './keyboards';

export class BotHandlers {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  registerHandlers(bot: Telegraf<GameContext>) {
    // Comandos básicos
    bot.start(this.handleStart.bind(this));
    bot.help(this.handleHelp.bind(this));
    bot.command('profile', this.handleProfile.bind(this));
    bot.command('balance', this.handleBalance.bind(this));

    // Callbacks do menu principal
    bot.action('main_play', this.handleGameMenu.bind(this));
    bot.action('main_wallet', this.handleWalletMenu.bind(this));
    bot.action('main_ranking', this.handleRanking.bind(this));
    bot.action('main_profile', this.handleProfile.bind(this));
    bot.action('main_help', this.handleHelp.bind(this));

    // Callbacks de navegação
    bot.action('back_main', this.handleBackToMain.bind(this));
    bot.action('wallet_balance', this.handleWalletBalance.bind(this));
    
    // Callbacks de carteira
    bot.action(/^wallet_(.+)$/, this.handleWalletAction.bind(this));
    
    // Callbacks de jogos
    bot.action(/^game_(.+)$/, this.handleGameSelection.bind(this));
    
    // Callbacks de apostas
    bot.action(/^bet_(.+)$/, this.handleBetSelection.bind(this));
    
    // Callbacks de escolhas do jogo
    bot.action(/^choice_(.+)$/, this.handleGameChoice.bind(this));
    
    // Callbacks de navegação específica
    bot.action('back_games', this.handleGameMenu.bind(this));
    bot.action('back_bet_amount', this.handleBetAmountMenu.bind(this));
  }

  async handleStart(ctx: GameContext) {
    try {
      const welcomeMessage = `
        🎮 **Bem-vindo ao Game Bot!**

        Olá ${ctx.state?.user?.firstName || 'jogador'}!

        Este bot oferece diversos jogos onde você pode apostar e ganhar prêmios.

        **Funcionalidades:**
        ${EMOJIS.GAME} Jogos variados
        ${EMOJIS.MONEY} Sistema de carteira
        ${EMOJIS.TROPHY} Ranking de jogadores
        ${EMOJIS.INFO} Perfil detalhado

        Use o menu abaixo para navegar:
      `;

      await ctx.reply(welcomeMessage, {
        parse_mode: 'Markdown',
        ...mainMenuKeyboard,
      });

      logger.info('User started bot', {
        userId: ctx.state?.user?.id,
        telegramId: ctx.state?.user?.telegramId,
      });
    } catch (error) {
      logger.error('Error in start handler:', error);
      await ctx.reply('❌ Erro ao iniciar. Tente novamente.');
    }
  }

  async handleHelp(ctx: GameContext) {
    const helpMessage = `
      ❓ **Ajuda - Game Bot**

      **Comandos Disponíveis:**
      /start - Iniciar o bot
      /help - Mostrar esta ajuda
      /profile - Ver seu perfil
      /balance - Ver seu saldo

      **Como Jogar:**
      1. Use "🎮 Jogar" para escolher um jogo
      2. Defina o valor da aposta
      3. Faça sua jogada
      4. Receba o resultado!

      **Sistema de Carteira:**
      - Deposite fundos via PIX
      - Saque seus ganhos
      - Acompanhe seu histórico

      **Suporte:**
      Em caso de dúvidas, entre em contato com @suporte
    `;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(helpMessage, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '⬅️ Voltar', callback_data: 'back_main' }]]
        }
      });
    } else {
      await ctx.reply(helpMessage, { parse_mode: 'Markdown' });
    }
  }

  async handleProfile(ctx: GameContext) {
    try {
      if (!ctx.state?.user) {
        await ctx.reply('❌ Erro: Usuário não encontrado');
        return;
      }

      const user = ctx.state.user;
      const profileMessage = `
        👤 **Seu Perfil**

        **Informações:**
        • Nome: ${user.firstName} ${user.lastName || ''}
        • Username: @${user.username || 'não definido'}
        • ID: ${user.telegramId}

        **Estatísticas:**
        • Saldo atual: ${formatCurrency(user.balance)}
        • Status: ${user.status === 'active' ? '✅ Ativo' : '❌ Inativo'}
        • Membro desde: ${user.createdAt.toLocaleDateString('pt-BR')}

        ${ctx.state?.isAdmin ? '👑 **Administrador**' : ''}
      `;

      if (ctx.callbackQuery) {
        await ctx.editMessageText(profileMessage, { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '⬅️ Voltar', callback_data: 'back_main' }]]
          }
        });
      } else {
        await ctx.reply(profileMessage, { parse_mode: 'Markdown' });
      }
    } catch (error) {
      logger.error('Error in profile handler:', error);
      await ctx.reply('❌ Erro ao carregar perfil.');
    }
  }

  async handleBalance(ctx: GameContext) {
    try {
      if (!ctx.state?.user) {
        await ctx.reply('❌ Erro: Usuário não encontrado');
        return;
      }

      const balanceMessage = `
        💰 **Seu Saldo**

        Saldo atual: **${formatCurrency(ctx.state.user.balance)}**

        Use "${EMOJIS.MONEY} Carteira" para depositar, sacar ou ver o histórico.
      `;

      await ctx.reply(balanceMessage, { parse_mode: 'Markdown' });
    } catch (error) {
      logger.error('Error in balance handler:', error);
      await ctx.reply('❌ Erro ao carregar saldo.');
    }
  }

  async handleGameMenu(ctx: GameContext) {
    const gameMessage = `
      🎮 **Menu de Jogos**

      Escolha um jogo para começar a apostar:

      🪙 **Cara ou Coroa** - Apostas simples
      ✂️ **Pedra/Papel/Tesoura** - Clássico jogo
      🎲 **Dados** - Teste sua sorte

      Mais jogos em breve!
    `;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(gameMessage, {
        parse_mode: 'Markdown',
        ...gameMenuKeyboard,
      });
    } else {
      await ctx.reply(gameMessage, {
        parse_mode: 'Markdown',
        ...gameMenuKeyboard,
      });
    }
  }

  async handleWalletMenu(ctx: GameContext) {
    const walletMessage = `
      💰 **Carteira Digital**

      Gerencie seus fundos:

      • **Ver Saldo** - Consulte seu saldo atual
      • **Depositar** - Adicione fundos via PIX
      • **Sacar** - Retire seus ganhos
      • **Histórico** - Veja suas transações

      Saldo atual: **${formatCurrency(ctx.state?.user?.balance || '0.00')}**
    `;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(walletMessage, {
        parse_mode: 'Markdown',
        ...walletMenuKeyboard,
      });
    } else {
      await ctx.reply(walletMessage, {
        parse_mode: 'Markdown',
        ...walletMenuKeyboard,
      });
    }
  }

  async handleRanking(ctx: GameContext) {
    const rankingMessage = `
      🏆 **Ranking de Jogadores**

      📍 Em construção!

      Em breve você poderá ver:
      • Top 10 jogadores
      • Maiores ganhos
      • Estatísticas gerais
      • Seu ranking atual

      Continue jogando para subir no ranking!
    `;

    if (ctx.callbackQuery) {
      await ctx.editMessageText(rankingMessage, { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [[{ text: '⬅️ Voltar', callback_data: 'back_main' }]]
        }
      });
    } else {
      await ctx.reply(rankingMessage, { parse_mode: 'Markdown' });
    }
  }

  async handleBackToMain(ctx: GameContext) {
    const mainMessage = `
      🏠 **Menu Principal**

      Bem-vindo de volta! O que você gostaria de fazer?
    `;

    await ctx.editMessageText(mainMessage, {
      parse_mode: 'Markdown',
      ...mainMenuKeyboard,
    });
  }

  async handleWalletBalance(ctx: GameContext) {
    const balanceMessage = `
      💰 **Saldo Detalhado**

      Saldo atual: **${formatCurrency(ctx.state?.user?.balance || '0.00')}**

      • Última atualização: ${new Date().toLocaleString('pt-BR')}
      • Status da conta: ${ctx.state?.user?.status === 'active' ? '✅ Ativa' : '❌ Inativa'}

      Use os botões abaixo para gerenciar sua carteira.
    `;

    await ctx.editMessageText(balanceMessage, {
      parse_mode: 'Markdown',
      ...walletMenuKeyboard,
    });
  }

  async handleWalletAction(ctx: GameContext) {
    const action = (ctx as any).match?.[1];

    switch (action) {
      case 'deposit':
        await ctx.answerCbQuery('💳 Função de depósito em desenvolvimento!');
        break;
      case 'withdraw':
        await ctx.answerCbQuery('💸 Função de saque em desenvolvimento!');
        break;
      case 'history':
        await ctx.answerCbQuery('📋 Histórico em desenvolvimento!');
        break;
      default:
        await ctx.answerCbQuery('Função não encontrada.');
    }
  }

  async handleGameSelection(ctx: GameContext) {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

      const action = (ctx as any).match?.[1];

      switch (action) {
        case 'coin_flip':
          // Show bet amount selection for coin flip
          await ctx.editMessageText(MESSAGES.SELECT_BET_AMOUNT, {
            parse_mode: 'Markdown',
            ...betAmountKeyboard,
          });
          // Store selected game in session
          if (ctx.session) {
            ctx.session.selectedGame = GAME_TYPES.COIN_FLIP;
          }
          break;
        case 'rock_paper_scissors':
          await ctx.answerCbQuery('✂️ Pedra/Papel/Tesoura em desenvolvimento!');
          break;
        case 'dice':
          await ctx.answerCbQuery('🎲 Dados em desenvolvimento!');
          break;
        default:
          await ctx.answerCbQuery('Jogo não encontrado.');
      }
    } catch (error) {
      logger.error('Error in game selection:', error);
      await ctx.answerCbQuery('❌ Erro ao selecionar jogo.');
    }
  }

  async handleBetSelection(ctx: GameContext) {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

      const betData = (ctx as any).match?.[1];
      
      if (betData === 'custom') {
        await ctx.editMessageText('💰 Digite o valor da aposta (ex: 10.50):');
        await ctx.answerCbQuery();
        return;
      }

      const betAmount = parseInt(betData) / 100; // Convert cents to reais
      
      // Store bet amount in session
      if (ctx.session) {
        ctx.session.betAmount = betAmount;
      }

      // Show coin flip choices
      await ctx.editMessageText(MESSAGES.COIN_FLIP_CHOICE(betAmount), {
        parse_mode: 'Markdown',
        ...coinFlipChoiceKeyboard,
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error in bet selection:', error);
      await ctx.answerCbQuery('❌ Erro ao selecionar aposta.');
    }
  }

  async handleGameChoice(ctx: GameContext) {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || !ctx.state?.user) return;

      const choice = (ctx as any).match?.[1];
      const betAmount = ctx.session?.betAmount;
      const gameType = ctx.session?.selectedGame;

      if (!betAmount || !gameType) {
        await ctx.answerCbQuery(MESSAGES.INVALID_SESSION);
        return;
      }

      // Check balance
      const userBalance = parseFloat(ctx.state.user.balance);
      if (userBalance < betAmount) {
        await ctx.answerCbQuery(MESSAGES.INSUFFICIENT_BALANCE);
        return;
      }

      if (gameType === GAME_TYPES.COIN_FLIP && (choice === COIN_CHOICES.HEADS || choice === COIN_CHOICES.TAILS)) {
        // Import GameService
        const { GameService } = await import('../services/game.service');
        const gameService = new GameService();

        // Create and play the game
        const gameResult = await gameService.createAndPlayGame({
          userId: ctx.state.user.id,
          gameType: 'coin_flip',
          betAmount: betAmount * 100, // Convert to cents
          gameData: { playerChoice: choice }
        });

        // Format result message
        let resultMessage: string;
        const playerChoiceLabel = COIN_CHOICE_LABELS[choice as keyof typeof COIN_CHOICE_LABELS];
        const botChoiceLabel = COIN_CHOICE_LABELS[gameResult.result.botChoice as keyof typeof COIN_CHOICE_LABELS];

        if (gameResult.result.winner === 'player') {
          resultMessage = MESSAGES.COIN_FLIP_WIN(betAmount, gameResult.result.winnings, playerChoiceLabel, botChoiceLabel);
        } else {
          resultMessage = MESSAGES.COIN_FLIP_LOSE(betAmount, playerChoiceLabel, botChoiceLabel);
        }

        await ctx.editMessageText(resultMessage, {
          parse_mode: 'Markdown',
          ...playAgainKeyboard,
        });

        // Clear session
        if (ctx.session) {
          delete ctx.session.selectedGame;
          delete ctx.session.betAmount;
        }
      }

      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error in game choice:', error);
      await ctx.answerCbQuery('❌ Erro ao processar jogada.');
    }
  }

  async handleBetAmountMenu(ctx: GameContext) {
    try {
      await ctx.editMessageText(MESSAGES.SELECT_BET_AMOUNT, {
        parse_mode: 'Markdown',
        ...betAmountKeyboard,
      });
      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error in bet amount menu:', error);
      await ctx.answerCbQuery('❌ Erro ao carregar menu de apostas.');
    }
  }
}
