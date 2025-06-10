import { BET_AMOUNTS, COIN_CHOICE_LABELS, EMOJIS } from '@/utils/constants';
import { Markup } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';

/**
 * Teclado do menu principal do bot
 * Contém as opções principais: Jogar, Carteira, Ranking, Perfil e Ajuda
 */
export const mainMenuKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback(`${EMOJIS.GAME} Jogar`, 'main_play')],
  [Markup.button.callback(`${EMOJIS.MONEY} Carteira`, 'main_wallet')],
  [Markup.button.callback(`${EMOJIS.TROPHY} Ranking`, 'main_ranking')],
  [Markup.button.callback(`${EMOJIS.INFO} Perfil`, 'main_profile')],
  [Markup.button.callback(`❓ Ajuda`, 'main_help')],
]);

/**
 * Teclado do menu de jogos
 * Lista todos os jogos disponíveis
 */
export const gameMenuKeyboard: Markup.Markup<InlineKeyboardMarkup> = Markup.inlineKeyboard([
  [Markup.button.callback('🪙 Cara ou Coroa', 'game_coin_flip')],
  [Markup.button.callback('✂️ Pedra/Papel/Tesoura', 'game_rock_paper_scissors')],
  [Markup.button.callback('🎲 Dados', 'game_dice')],
  [Markup.button.callback('🀱 Dominó', 'game_domino')],
  [Markup.button.callback('⬅️ Voltar', 'back_main')]
]);

/**
 * Teclado do menu da carteira
 * Opções para gerenciar saldo e transações
 */
export const walletMenuKeyboard: Markup.Markup<InlineKeyboardMarkup> = Markup.inlineKeyboard([
  [Markup.button.callback('💰 Ver Saldo', 'wallet_balance')],
  [Markup.button.callback('💳 Depositar', 'wallet_deposit')],
  [Markup.button.callback('💸 Sacar', 'wallet_withdraw')],
  [Markup.button.callback('📋 Histórico', 'wallet_history')],
  [Markup.button.callback('⬅️ Voltar', 'back_main')]
]);

/**
 * Teclado para seleção de valor de aposta
 * Valores pré-definidos e opção personalizada
 */
export const betAmountKeyboard: Markup.Markup<InlineKeyboardMarkup> = Markup.inlineKeyboard([
  [
    Markup.button.callback(`R$ ${(BET_AMOUNTS[0] / 100).toFixed(2)}`, `bet_${BET_AMOUNTS[0]}`),
    Markup.button.callback(`R$ ${(BET_AMOUNTS[1] / 100).toFixed(2)}`, `bet_${BET_AMOUNTS[1]}`),
  ],
  [
    Markup.button.callback(`R$ ${(BET_AMOUNTS[2] / 100).toFixed(2)}`, `bet_${BET_AMOUNTS[2]}`),
    Markup.button.callback(`R$ ${(BET_AMOUNTS[3] / 100).toFixed(2)}`, `bet_${BET_AMOUNTS[3]}`),
  ],
  [
    Markup.button.callback(`R$ ${(BET_AMOUNTS[4] / 100).toFixed(2)}`, `bet_${BET_AMOUNTS[4]}`),
    Markup.button.callback(`${EMOJIS.CUSTOM} Personalizado`, 'bet_custom'),
  ],
  [Markup.button.callback(`${EMOJIS.BACK} Voltar`, 'back_games')],
]);

/**
 * Teclado para escolhas no jogo Cara ou Coroa
 * Botões para Cara e Coroa
 */
export const coinFlipChoiceKeyboard: Markup.Markup<InlineKeyboardMarkup> = Markup.inlineKeyboard([
  [
    Markup.button.callback(COIN_CHOICE_LABELS.heads, 'choice_heads'),
    Markup.button.callback(COIN_CHOICE_LABELS.tails, 'choice_tails'),
  ],
  [Markup.button.callback(`${EMOJIS.BACK} Voltar`, 'back_bet_amount')],
]);

// Play again keyboard
export const playAgainKeyboard: Markup.Markup<InlineKeyboardMarkup> = Markup.inlineKeyboard([
  [
    Markup.button.callback(`${EMOJIS.PLAY} Jogar Novamente`, 'game_coin_flip'),
    Markup.button.callback(`${EMOJIS.GAMES} Outros Jogos`, 'main_play'),
  ],
  [Markup.button.callback(`${EMOJIS.HOME} Menu Principal`, 'back_main')],
]);

