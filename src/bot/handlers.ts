/* eslint-disable @typescript-eslint/no-explicit-any */
import { UserService } from '@/services/user.service';
import { Telegraf } from 'telegraf';
import { NotificationService } from '../services/notification.service';
import { COIN_CHOICE_LABELS, EMOJIS, MESSAGES } from '../utils/constants';
import { formatCurrency } from '../utils/helpers';
import { logger } from '../utils/logger';
import { GameContext } from './context';
import {
  betAmountKeyboard,
  coinFlipChoiceKeyboard,
  gameMenuKeyboard,
  mainMenuKeyboard,
  walletMenuKeyboard,
} from './keyboards';

export class BotHandlers {
  private userService: UserService;
  private notificationService: NotificationService | null = null;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * Define o serviço de notificações para o bot
   * @param notificationService - Instância do serviço de notificações
   */
  setNotificationService(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Registra todos os handlers do bot Telegram
   * @param bot - Instância do bot Telegraf
   */
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
    
    // Callbacks específicos do Coin Flip multiplayer
    bot.action('create_coin_flip', this.handleCreateCoinFlip.bind(this));
    bot.action('join_coin_flip', this.handleJoinCoinFlip.bind(this));
    bot.action(/^join_game_(.+)$/, this.handleJoinSpecificGame.bind(this));
    bot.action(/^make_move_(.+)_(.+)$/, this.handleMakeMove.bind(this));
    
    // Callbacks específicos do Domino multiplayer
    bot.action('create_domino', this.handleCreateDomino.bind(this));
    bot.action('join_domino', this.handleJoinDomino.bind(this));
    bot.action(/^join_domino_(.+)$/, this.handleJoinSpecificDomino.bind(this));
    bot.action(/^domino_state_(.+)$/, this.handleDominoState.bind(this));
    bot.action(/^domino_move_(.+)_(.+)_(.+)$/, this.handleDominoMove.bind(this));
    bot.action(/^domino_pass_(.+)$/, this.handleDominoPass.bind(this));
    
    // Callbacks de apostas
    bot.action(/^bet_(.+)$/, this.handleBetSelection.bind(this));
    
    // Callbacks de escolhas do jogo
    bot.action(/^choice_(.+)$/, this.handleGameChoice.bind(this));
    
    // Callbacks de navegação específica
    bot.action('back_games', this.handleGameMenu.bind(this));
    bot.action('back_bet_amount', this.handleBetAmountMenu.bind(this));
  }

  /**
   * Handler para o comando /start
   * Inicializa o bot e exibe mensagem de boas-vindas com menu principal
   * @param ctx - Contexto do Telegram
   */
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

  /**
   * Handler para o comando /help
   * Exibe informações de ajuda sobre o bot e seus comandos
   * @param ctx - Contexto do Telegram
   */
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

  /**
   * Handler para o comando /profile
   * Exibe informações detalhadas do perfil do usuário
   * @param ctx - Contexto do Telegram
   */
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

  /**
   * Handler para o comando /balance
   * Exibe o saldo atual do usuário
   * @param ctx - Contexto do Telegram
   */
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

  /**
   * Handler para exibir o menu de jogos
   * Mostra os jogos disponíveis para o usuário escolher
   * @param ctx - Contexto do Telegram
   */
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

  /**
   * Handler para exibir o menu da carteira
   * Mostra opções de gerenciamento de saldo e transações
   * @param ctx - Contexto do Telegram
   */
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

  /**
   * Handler para exibir o ranking de jogadores
   * Mostra informações sobre ranking e estatísticas (em desenvolvimento)
   * @param ctx - Contexto do Telegram
   */
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

  /**
   * Handler para voltar ao menu principal
   * Exibe novamente o menu principal do bot
   * @param ctx - Contexto do Telegram
   */
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

  /**
   * Handler para exibir saldo detalhado da carteira
   * Mostra informações detalhadas sobre o saldo do usuário
   * @param ctx - Contexto do Telegram
   */
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

  /**
   * Handler para ações da carteira (depósito, saque, histórico)
   * Processa diferentes ações relacionadas à carteira do usuário
   * @param ctx - Contexto do Telegram
   */
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

  /**
   * Handler para seleção de jogos
   * Processa a seleção de diferentes tipos de jogos pelo usuário
   * @param ctx - Contexto do Telegram
   */
  async handleGameSelection(ctx: GameContext) {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery)) return;

      const action = (ctx as any).match?.[1];

      switch (action) {
        case 'coin_flip':
          // Show multiplayer options for coin flip
          await ctx.editMessageText(MESSAGES.COIN_FLIP_MULTIPLAYER_OPTIONS, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🆕 Criar Partida', callback_data: 'create_coin_flip' }],
                [{ text: '🔍 Entrar em Partida', callback_data: 'join_coin_flip' }],
                [{ text: '⬅️ Voltar', callback_data: 'back_games' }]
              ]
            }
          });
          break;
        case 'rock_paper_scissors':
          await ctx.answerCbQuery('✂️ Pedra/Papel/Tesoura em desenvolvimento!');
          break;
        case 'dice':
          await ctx.answerCbQuery('🎲 Dados em desenvolvimento!');
          break;
        case 'domino':
          // Show multiplayer options for domino
          await ctx.editMessageText(MESSAGES.DOMINO_MULTIPLAYER_OPTIONS, {
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🆕 Criar Partida', callback_data: 'create_domino' }],
                [{ text: '🔍 Entrar em Partida', callback_data: 'join_domino' }],
                [{ text: '⬅️ Voltar', callback_data: 'back_games' }]
              ]
            }
          });
          break;
        default:
          await ctx.answerCbQuery('Jogo não encontrado.');
      }
    } catch (error) {
      logger.error('Error in game selection:', error);
      await ctx.answerCbQuery('❌ Erro ao selecionar jogo.');
    }
  }

  /**
   * Handler para seleção de valor de aposta
   * Processa a escolha do valor da aposta e cria jogos baseado no contexto
   * @param ctx - Contexto do Telegram
   */
  async handleBetSelection(ctx: GameContext) {
    try {
      if (!ctx.callbackQuery || !('data' in ctx.callbackQuery) || !ctx.state?.user) return;

      const betData = (ctx as any).match?.[1];
      
      if (betData === 'custom') {
        await ctx.editMessageText('💰 Digite o valor da aposta (ex: 10.50):');
        await ctx.answerCbQuery();
        return;
      }

      const betAmount = parseInt(betData) / 100; // Convert cents to reais
      
      // Check if we're creating a coin flip game
      if (ctx.session?.action === 'create_coin_flip') {
        // Check balance
        const userBalance = parseFloat(ctx.state.user.balance);
        if (userBalance < betAmount) {
          await ctx.answerCbQuery(MESSAGES.INSUFFICIENT_BALANCE);
          return;
        }

        // Create multiplayer game
        const { GameService } = await import('../services/game.service');
        const gameService = new GameService();
        
        const game = await gameService.createGame(ctx.state.user.id, {
          gameType: 'coin_flip',
          betAmount,
          matchType: 'multiplayer'
        });

        await ctx.editMessageText(MESSAGES.GAME_CREATED_WAITING(game.id, betAmount), {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Criar Outra Partida', callback_data: 'create_coin_flip' }],
              [{ text: '🏠 Menu Principal', callback_data: 'back_main' }]
            ]
          }
        });
        
        // Clear session
        if (ctx.session) {
          delete ctx.session.action;
        }
      } else if (ctx.session?.action === 'create_domino') {
        // Check balance for domino
        const userBalance = parseFloat(ctx.state.user.balance);
        if (userBalance < betAmount) {
          await ctx.answerCbQuery(MESSAGES.INSUFFICIENT_BALANCE);
          return;
        }

        // Create multiplayer domino game
        const { GameService } = await import('../services/game.service');
        const gameService = new GameService();
        
        const game = await gameService.createGame(ctx.state.user.id, {
          gameType: 'domino',
          betAmount,
          matchType: 'multiplayer'
        });

        await ctx.editMessageText(MESSAGES.DOMINO_GAME_CREATED(game.id, betAmount), {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Criar Outra Partida', callback_data: 'create_domino' }],
              [{ text: '🏠 Menu Principal', callback_data: 'back_main' }]
            ]
          }
        });
        
        // Clear session
        if (ctx.session) {
          delete ctx.session.action;
        }
      } else {
        // Legacy single player flow - deprecated
        if (ctx.session) {
          ctx.session.betAmount = betAmount;
        }

        await ctx.editMessageText(MESSAGES.COIN_FLIP_CHOICE(betAmount), {
          parse_mode: 'Markdown',
          ...coinFlipChoiceKeyboard,
        });
      }
      
      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error in bet selection:', error);
      await ctx.answerCbQuery('❌ ' + (error instanceof Error ? error.message : 'Erro ao selecionar aposta'));
    }
  }

  /**
   * Handler para escolhas no jogo (DEPRECIADO)
   * Método legado para jogos single-player, substituído pelo sistema multiplayer
   * @param ctx - Contexto do Telegram
   * @deprecated Use o sistema multiplayer em vez de jogos single-player
   */
  async handleGameChoice(ctx: GameContext) {
    // DEPRECATED: This method was used for single-player games
    // All games are now multiplayer PvP
    try {
      await ctx.answerCbQuery('⚠️ Este sistema foi substituído pelo multiplayer. Use "🎮 Jogar" para criar ou entrar em partidas.');
    } catch (error) {
      logger.error('Error in deprecated game choice:', error);
      await ctx.answerCbQuery('❌ Erro ao processar.');
    }
  }

  /**
   * Handler para menu de seleção de valor de aposta
   * Exibe o menu com opções de valores para apostar
   * @param ctx - Contexto do Telegram
   */
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

  // Multiplayer handlers
  /**
   * Handler para criar partida de Cara ou Coroa
   * Inicia o processo de criação de uma nova partida multiplayer de Cara ou Coroa
   * @param ctx - Contexto do Telegram
   */
  async handleCreateCoinFlip(ctx: GameContext) {
    try {
      // Show bet amount selection for creating a coin flip game
      await ctx.editMessageText(MESSAGES.SELECT_BET_AMOUNT, {
        parse_mode: 'Markdown',
        ...betAmountKeyboard,
      });
      
      // Store that we're creating a coin flip game
      if (ctx.session) {
        ctx.session.action = 'create_coin_flip';
      }
      
      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error in create coin flip:', error);
      await ctx.answerCbQuery('❌ Erro ao criar partida.');
    }
  }

  /**
   * Handler para entrar em partida de Cara ou Coroa
   * Exibe partidas disponíveis de Cara ou Coroa para o usuário entrar
   * @param ctx - Contexto do Telegram
   */
  async handleJoinCoinFlip(ctx: GameContext) {
    try {
      const { GameService } = await import('../services/game.service');
      const gameService = new GameService();
      
      // Get available coin flip games
      const availableGames = await gameService.getAvailableGames('coin_flip', 10);
      
      if (availableGames.length === 0) {
        await ctx.editMessageText(MESSAGES.NO_AVAILABLE_GAMES, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🆕 Criar Partida', callback_data: 'create_coin_flip' }],
              [{ text: '⬅️ Voltar', callback_data: 'back_games' }]
            ]
          }
        });
        await ctx.answerCbQuery();
        return;
      }

      // Show available games
      const keyboard = availableGames.map(game => [{
        text: `🎮 Partida #${game.id} - R$ ${parseFloat(game.betAmount).toFixed(2)}`,
        callback_data: `join_game_${game.id}`
      }]);
      
      keyboard.push([{ text: '⬅️ Voltar', callback_data: 'back_games' }]);

      await ctx.editMessageText(MESSAGES.AVAILABLE_GAMES, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });
      
      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error in join coin flip:', error);
      await ctx.answerCbQuery('❌ Erro ao buscar partidas.');
    }
  }

  /**
   * Handler para entrar em uma partida específica
   * Processa a entrada do usuário em uma partida específica pelo ID
   * @param ctx - Contexto do Telegram
   */
  async handleJoinSpecificGame(ctx: GameContext) {
    try {
      if (!ctx.state?.user) {
        await ctx.answerCbQuery('❌ Erro: Usuário não encontrado');
        return;
      }

      const gameId = parseInt((ctx as any).match?.[1]);
      const { GameService } = await import('../services/game.service');
      const gameService = new GameService();
      
      // Join the game
      const game = await gameService.joinGame(gameId, ctx.state.user.id);
      
      // Get creator info
      const creator = await this.userService.getUserById(game.creatorId);
      
      // Show game joined message with choice options
      await ctx.editMessageText(MESSAGES.GAME_JOINED(gameId, creator?.firstName || 'Jogador', parseFloat(game.betAmount)), {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '😎 Cara', callback_data: `make_move_${gameId}_heads` },
              { text: '👑 Coroa', callback_data: `make_move_${gameId}_tails` }
            ]
          ]
        }
      });
      
      // Notify the creator that someone joined
      if (this.notificationService && creator?.chatId) {
        await this.notificationService.notifyPlayerJoined(
          creator.chatId,
          ctx.state.user.firstName || 'Jogador',
          gameId
        );
        
        logger.info('Creator notified of player joining', {
          gameId,
          creatorId: creator.id,
          playerId: ctx.state.user.id
        });
      } else {
        logger.warn('Could not notify creator - missing chatId or notification service', {
          gameId,
          creatorId: creator?.id,
          creatorChatId: creator?.chatId,
          hasNotificationService: !!this.notificationService
        });
      }
      
      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error joining specific game:', error);
      await ctx.answerCbQuery('❌ ' + (error instanceof Error ? error.message : 'Erro ao entrar na partida'));
    }
  }

  /**
   * Handler para fazer jogada em partida multiplayer
   * Processa a jogada do usuário (heads/tails) e determina o resultado
   * @param ctx - Contexto do Telegram
   */
  async handleMakeMove(ctx: GameContext) {
    try {
      if (!ctx.state?.user) {
        await ctx.answerCbQuery('❌ Erro: Usuário não encontrado');
        return;
      }

      const gameId = parseInt((ctx as any).match?.[1]);
      const choice = (ctx as any).match?.[2] as 'heads' | 'tails';
      
      const { GameService } = await import('../services/game.service');
      const gameService = new GameService();
      
      // Make the move
      const moveResult = await gameService.makeMove(gameId, ctx.state.user.id, choice);
      
      if (moveResult.waiting) {
        // Still waiting for opponent
        await ctx.editMessageText(MESSAGES.WAITING_OPPONENT_MOVE, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🏠 Menu Principal', callback_data: 'back_main' }]
            ]
          }
        });
      } else {
        // Game completed, show result
        const result = moveResult.result;
        if (!result) {
          throw new Error('Resultado do jogo não encontrado');
        }

        const isWinner = result.winnerId === ctx.state.user.id;
        const yourChoice = COIN_CHOICE_LABELS[choice];
        
        // Buscar dados do jogo para ter acesso ao creatorId
        const game = await gameService.getGameById(gameId);
        if (!game) {
          throw new Error('Jogo não encontrado');
        }
        
        // Determinar se o usuário atual é o criador ou o player2
        const isCreator = game.creatorId === ctx.state.user.id;
        
        // Determinar a escolha do oponente
        let opponentChoice: 'heads' | 'tails';
        if (isCreator) {
          // Se você é o criador, a escolha do oponente é player2Choice
          opponentChoice = result.player2Choice || 'heads';
        } else {
          // Se você é o player2, a escolha do oponente é creatorChoice
          opponentChoice = result.creatorChoice || 'heads';
        }
        
        const opponentChoiceLabel = COIN_CHOICE_LABELS[opponentChoice];
        
        // Determinar nome do oponente
        const opponentName = isCreator ? result.player2Name : result.creatorName;
        
        let resultMessage: string;
        if (isWinner) {
          resultMessage = MESSAGES.MULTIPLAYER_RESULT_WIN(
            result.gameId,
            result.prizeAmount,
            opponentChoiceLabel,
            yourChoice,
            opponentName || 'Adversário'
          );
        } else {
          // Para calcular o valor da aposta perdida, usar o prizeAmount dividido por rake
          const totalPool = result.prizeAmount + result.rakeAmount;
          const betAmount = totalPool / 2; // Cada jogador apostou metade do pool total
          
          resultMessage = MESSAGES.MULTIPLAYER_RESULT_LOSE(
            result.gameId,
            betAmount,
            opponentChoiceLabel,
            yourChoice,
            opponentName || 'Adversário'
          );
        }

        await ctx.editMessageText(resultMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Jogar Novamente', callback_data: 'game_coin_flip' }],
              [{ text: '🏠 Menu Principal', callback_data: 'back_main' }]
            ]
          }
        });
      }
      
      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error making move:', error);
      await ctx.answerCbQuery('❌ ' + (error instanceof Error ? error.message : 'Erro ao fazer jogada'));
    }
  }

  // ==========================================
  // DOMINO HANDLERS
  // ==========================================

  /**
   * Handler para criar partida de Dominó
   * Inicia o processo de criação de uma nova partida multiplayer de Dominó
   * @param ctx - Contexto do Telegram
   */
  async handleCreateDomino(ctx: GameContext) {
    try {
      if (!ctx.state?.user) {
        await ctx.answerCbQuery('❌ Erro: Usuário não encontrado');
        return;
      }

      // Set session action for bet selection
      ctx.session = { ...ctx.session, action: 'create_domino' };

      await ctx.editMessageText(MESSAGES.SELECT_BET_AMOUNT, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: 'R$ 5,00', callback_data: 'bet_5' },
              { text: 'R$ 10,00', callback_data: 'bet_10' }
            ],
            [
              { text: 'R$ 25,00', callback_data: 'bet_25' },
              { text: 'R$ 50,00', callback_data: 'bet_50' }
            ],
            [
              { text: 'R$ 100,00', callback_data: 'bet_100' },
              { text: '✏️ Personalizado', callback_data: 'bet_custom' }
            ],
            [{ text: '⬅️ Voltar', callback_data: 'game_domino' }]
          ]
        }
      });

      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error creating domino game:', error);
      await ctx.answerCbQuery('❌ Erro ao criar partida de dominó');
    }
  }

  /**
   * Handler para entrar em partida de Dominó
   * Exibe partidas de Dominó disponíveis para o usuário entrar
   * @param ctx - Contexto do Telegram
   */
  async handleJoinDomino(ctx: GameContext) {
    try {
      if (!ctx.state?.user) {
        await ctx.answerCbQuery('❌ Erro: Usuário não encontrado');
        return;
      }

      const { GameService } = await import('../services/game.service');
      const gameService = new GameService();
      
      // Get available domino games
      const availableGames = await gameService.getAvailableGames('domino', 10);
      
      if (availableGames.length === 0) {
        await ctx.editMessageText(MESSAGES.NO_AVAILABLE_GAMES, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🆕 Criar Partida', callback_data: 'create_domino' }],
              [{ text: '⬅️ Voltar', callback_data: 'game_domino' }]
            ]
          }
        });
        await ctx.answerCbQuery();
        return;
      }

      // Show available games
      const keyboard = availableGames.map(game => [
        { 
          text: `🀱 #${game.id} - R$ ${parseFloat(game.betAmount).toFixed(2)}`, 
          callback_data: `join_domino_${game.id}` 
        }
      ]);
      
      keyboard.push([{ text: '⬅️ Voltar', callback_data: 'game_domino' }]);

      await ctx.editMessageText(MESSAGES.AVAILABLE_GAMES, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });

      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error joining domino game:', error);
      await ctx.answerCbQuery('❌ Erro ao buscar partidas');
    }
  }

  /**
   * Handler para entrar em uma partida específica de Dominó
   * Processa a entrada do usuário em uma partida específica de Dominó pelo ID
   * @param ctx - Contexto do Telegram
   */
  async handleJoinSpecificDomino(ctx: GameContext) {
    try {
      if (!ctx.state?.user) {
        await ctx.answerCbQuery('❌ Erro: Usuário não encontrado');
        return;
      }

      const gameId = parseInt((ctx as any).match?.[1]);
      if (!gameId) {
        await ctx.answerCbQuery('❌ ID da partida inválido');
        return;
      }

      const { GameService } = await import('../services/game.service');
      const gameService = new GameService();
      
      // Join the game
      const game = await gameService.joinGame(gameId, ctx.state.user.id);
      
      // Get creator info for display
      const { UserService } = await import('../services/user.service');
      const userService = new UserService();
      const creator = await userService.getUserById(game.creatorId);

      await ctx.editMessageText(MESSAGES.DOMINO_GAME_JOINED(
        game.id, 
        creator?.firstName || 'Jogador', 
        parseFloat(game.betAmount)
      ), {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🎮 Ver Estado do Jogo', callback_data: `domino_state_${game.id}` }],
            [{ text: '🏠 Menu Principal', callback_data: 'back_main' }]
          ]
        }
      });

      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error joining specific domino game:', error);
      await ctx.answerCbQuery('❌ ' + (error instanceof Error ? error.message : 'Erro ao entrar na partida'));
    }
  }

  /**
   * Handler para visualizar o estado atual de uma partida de Dominó
   * Exibe o estado atual do jogo e as jogadas disponíveis para o usuário
   * @param ctx - Contexto do Telegram
   */
  async handleDominoState(ctx: GameContext) {
    try {
      if (!ctx.state?.user) {
        await ctx.answerCbQuery('❌ Erro: Usuário não encontrado');
        return;
      }

      const gameId = parseInt((ctx as any).match?.[1]);
      if (!gameId) {
        await ctx.answerCbQuery('❌ ID da partida inválido');
        return;
      }

      const { GameService } = await import('../services/game.service');
      const gameService = new GameService();
      
      const gameState = await gameService.getDominoGameState(gameId, ctx.state.user.id);
      
      // Create keyboard for available moves
      const keyboard: any[][] = [];
      
      if (gameState.gameState.currentPlayer === ctx.state.user.id.toString()) {
        // It's player's turn - show available moves
        gameState.availableMoves.slice(0, 6).forEach(move => {
          const piece = move.piece;
          move.sides.forEach(side => {
            const sideEmoji = side === 'left' ? '⬅️' : '➡️';
            keyboard.push([{
              text: `[${piece.left}●${piece.right}] ${sideEmoji}`,
              callback_data: `domino_move_${gameId}_${piece.id}_${side}`
            }]);
          });
        });

        if (gameState.availableMoves.length === 0) {
          keyboard.push([{
            text: '⏭️ PASSAR',
            callback_data: `domino_pass_${gameId}`
          }]);
        }
      }
      
      keyboard.push([{ text: '🔄 Atualizar', callback_data: `domino_state_${gameId}` }]);
      keyboard.push([{ text: '🏠 Menu Principal', callback_data: 'back_main' }]);

      await ctx.editMessageText(gameState.gameInterface, {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      });

      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error getting domino state:', error);
      await ctx.answerCbQuery('❌ ' + (error instanceof Error ? error.message : 'Erro ao obter estado do jogo'));
    }
  }

  /**
   * Handler para fazer uma jogada no Dominó
   * Processa a jogada do usuário (peça e lado) em uma partida de Dominó
   * @param ctx - Contexto do Telegram
   */
  async handleDominoMove(ctx: GameContext) {
    try {
      if (!ctx.state?.user) {
        await ctx.answerCbQuery('❌ Erro: Usuário não encontrado');
        return;
      }

      const gameId = parseInt((ctx as any).match?.[1]);
      const pieceId = (ctx as any).match?.[2];
      const side = (ctx as any).match?.[3] as 'left' | 'right';
      
      if (!gameId || !pieceId || !side) {
        await ctx.answerCbQuery('❌ Dados da jogada inválidos');
        return;
      }

      const { GameService } = await import('../services/game.service');
      const gameService = new GameService();
      
      const moveResult = await gameService.makeDominoMove(gameId, ctx.state.user.id, pieceId, side);
      
      if (moveResult.waiting) {
        // Game continues - update interface
        const keyboard: any[][] = [];
        
        if (moveResult.gameState?.currentPlayer === ctx.state.user.id.toString()) {
          // Still player's turn or became player's turn again
          moveResult.availableMoves?.slice(0, 6).forEach(move => {
            const piece = move.piece;
            move.sides.forEach(side => {
              const sideEmoji = side === 'left' ? '⬅️' : '➡️';
              keyboard.push([{
                text: `[${piece.left}●${piece.right}] ${sideEmoji}`,
                callback_data: `domino_move_${gameId}_${piece.id}_${side}`
              }]);
            });

            if (!moveResult.availableMoves || moveResult.availableMoves.length === 0) {
              keyboard.push([{
                text: '⏭️ PASSAR',
                callback_data: `domino_pass_${gameId}`
              }]);
            }
          });
        }
        
        keyboard.push([{ text: '🔄 Atualizar', callback_data: `domino_state_${gameId}` }]);
        keyboard.push([{ text: '🏠 Menu Principal', callback_data: 'back_main' }]);

        await ctx.editMessageText(moveResult.gameInterface || MESSAGES.DOMINO_WAITING_OPPONENT, {
          parse_mode: 'Markdown',
          reply_markup: { inline_keyboard: keyboard }
        });
      } else {
        // Game completed - show result
        const result = moveResult.result;
        if (!result) {
          throw new Error('Resultado do jogo não encontrado');
        }

        const isWinner = result.winnerId === ctx.state.user.id;
        let resultMessage: string;

        if (isWinner) {
          resultMessage = MESSAGES.DOMINO_RESULT_WIN(
            result.gameId,
            result.prizeAmount,
            'Você venceu no dominó!'
          );
        } else if (result.winnerId === null) {
          resultMessage = MESSAGES.DOMINO_RESULT_TIE(
            result.gameId,
            'Empate! Apostas devolvidas.'
          );
        } else {
          const betAmount = result.prizeAmount + result.rakeAmount;
          resultMessage = MESSAGES.DOMINO_RESULT_LOSE(
            result.gameId,
            betAmount / 2,
            'Seu adversário venceu.'
          );
        }

        await ctx.editMessageText(resultMessage, {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '🎮 Jogar Novamente', callback_data: 'game_domino' }],
              [{ text: '🏠 Menu Principal', callback_data: 'back_main' }]
            ]
          }
        });
      }
      
      await ctx.answerCbQuery();
    } catch (error) {
      logger.error('Error making domino move:', error);
      await ctx.answerCbQuery('❌ ' + (error instanceof Error ? error.message : 'Erro ao fazer jogada'));
    }
  }

  /**
   * Handler para passar a vez no Dominó
   * Permite ao usuário passar a vez quando não há jogadas possíveis
   * @param ctx - Contexto do Telegram
   */
  async handleDominoPass(ctx: GameContext) {
    try {
      if (!ctx.state?.user) {
        await ctx.answerCbQuery('❌ Erro: Usuário não encontrado');
        return;
      }

      const gameId = parseInt((ctx as any).match?.[1]);
      if (!gameId) {
        await ctx.answerCbQuery('❌ ID da partida inválido');
        return;
      }

      // For now, just update the game state to show opponent's turn
      // In a full implementation, you would handle the pass logic
      
      await ctx.editMessageText(MESSAGES.DOMINO_WAITING_OPPONENT, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Atualizar', callback_data: `domino_state_${gameId}` }],
            [{ text: '🏠 Menu Principal', callback_data: 'back_main' }]
          ]
        }
      });

      await ctx.answerCbQuery('⏭️ Você passou a vez');
    } catch (error) {
      logger.error('Error passing domino turn:', error);
      await ctx.answerCbQuery('❌ Erro ao passar a vez');
    }
  }
}
