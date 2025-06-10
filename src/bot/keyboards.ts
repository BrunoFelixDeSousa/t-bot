import { EMOJIS } from '@/utils/constants';
import { Markup } from 'telegraf';
import { InlineKeyboardMarkup } from 'telegraf/typings/core/types/typegram';

export const mainMenuKeyboard = Markup.inlineKeyboard([
  [Markup.button.callback(`${EMOJIS.GAME} Jogar`, 'main_play')],
  [Markup.button.callback(`${EMOJIS.MONEY} Carteira`, 'main_wallet')],
  [Markup.button.callback(`${EMOJIS.TROPHY} Ranking`, 'main_ranking')],
  [Markup.button.callback(`${EMOJIS.INFO} Perfil`, 'main_profile')],
  [Markup.button.callback(`❓ Ajuda`, 'main_help')],
]);


export const gameMenuKeyboard: Markup.Markup<InlineKeyboardMarkup> = Markup.inlineKeyboard([
  [Markup.button.callback('🪙 Cara ou Coroa', 'game_coin_flip')],
  [Markup.button.callback('✂️ Pedra/Papel/Tesoura', 'game_rock_paper_scissors')],
  [Markup.button.callback('🎲 Dados', 'game_dice')],
  [Markup.button.callback('⬅️ Voltar', 'back_main')]
]);

export const walletMenuKeyboard: Markup.Markup<InlineKeyboardMarkup> = Markup.inlineKeyboard([
  [Markup.button.callback('💰 Ver Saldo', 'wallet_balance')],
  [Markup.button.callback('💳 Depositar', 'wallet_deposit')],
  [Markup.button.callback('💸 Sacar', 'wallet_withdraw')],
  [Markup.button.callback('📋 Histórico', 'wallet_history')],
  [Markup.button.callback('⬅️ Voltar', 'back_main')]
]);

// export const mainMenuKeyboard = Markup.keyboard([
//   [`${EMOJIS.GAME} Jogar`, `${EMOJIS.MONEY} Carteira`],
//   [`${EMOJIS.TROPHY} Ranking`, `${EMOJIS.INFO} Perfil`],
//   [`❓ Ajuda`],
// ]).resize();

// export const gameMenuKeyboard: Markup.Markup<InlineKeyboardMarkup> =
//   Markup.inlineKeyboard([
//     [
//       Markup.button.callback(
//         `${EMOJIS.COIN} Cara ou Coroa`,
//         `game_${GAME_TYPES.COIN_FLIP}`,
//       ),
//     ],
//     [
//       Markup.button.callback(
//         `${EMOJIS.ROCK} Pedra/Papel/Tesoura`,
//         `game_${GAME_TYPES.ROCK_PAPER_SCISSORS}`,
//       ),
//     ],
//     [Markup.button.callback(`${EMOJIS.DICE} Dados`, `game_${GAME_TYPES.DICE}`)],
//     [
//       Markup.button.callback(
//         `${EMOJIS.DOMINO} Dominó`,
//         `game_${GAME_TYPES.DOMINO}`,
//       ),
//     ],
//     [Markup.button.callback(`${EMOJIS.BACK} Voltar`, 'back_main')],
//   ]);

// export const walletMenuKeyboard: Markup.Markup<InlineKeyboardMarkup> =
//   Markup.inlineKeyboard([
//     [Markup.button.callback(`${EMOJIS.MONEY} Ver Saldo`, 'wallet_balance')],
//     [Markup.button.callback(`${EMOJIS.DEPOSIT} Depositar`, 'wallet_deposit')],
//     [Markup.button.callback(`${EMOJIS.WITHDRAW} Sacar`, 'wallet_withdraw')],
//     [Markup.button.callback(`${EMOJIS.HISTORY} Histórico`, 'wallet_history')],
//     [Markup.button.callback(`${EMOJIS.BACK} Voltar`, 'back_main')],
//   ]);
