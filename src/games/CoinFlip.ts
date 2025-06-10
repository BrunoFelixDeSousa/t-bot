import { COIN_FLIP_CHOICES, GameResult } from '../types/game';
import { BaseGame } from './BaseGame';

export class CoinFlip extends BaseGame {
  constructor(betAmount: number) {
    super('coin_flip', betAmount);
    this.validateBetAmount();
  }

  async play(playerChoice: 'heads' | 'tails'): Promise<GameResult> {
    // Validar escolha do jogador
    if (!['heads', 'tails'].includes(playerChoice)) {
      throw new Error('Escolha inválida. Use "heads" ou "tails"');
    }

    // Gerar resultado aleatório
    const houseChoice = this.generateRandomChoice(['heads', 'tails']);
    const isWin = playerChoice === houseChoice;
    const winner = isWin ? 'player' : 'house';

    // Calcular prêmio (1.95x para 95% RTP, 5% rake)
    const prize = this.calculatePrize(isWin, 1.95);

    const result: GameResult = {
      winner,
      playerChoice: playerChoice, // Keep raw choice for service layer
      houseChoice: houseChoice, // Keep raw choice for service layer  
      prize,
      details: this.generateResultMessage(playerChoice, houseChoice, isWin, prize),
    };

    this.logGameResult(result);
    return result;
  }

  private getChoiceEmoji(choice: 'heads' | 'tails'): string {
    const choiceData = COIN_FLIP_CHOICES.find(c => c.choice === choice);
    return choiceData ? `${choiceData.emoji} ${choiceData.label}` : choice;
  }

  private generateResultMessage(
    playerChoice: string,
    houseChoice: string,
    isWin: boolean,
    prize: number
  ): string {
    const playerEmoji = this.getChoiceEmoji(playerChoice as 'heads' | 'tails');
    const houseEmoji = this.getChoiceEmoji(houseChoice as 'heads' | 'tails');

    if (isWin) {
      return `🎉 PARABÉNS! Você ganhou!\n\n` +
             `🎯 Sua escolha: ${playerEmoji}\n` +
             `🎲 Resultado: ${houseEmoji}\n` +
             `💰 Prêmio: R$ ${prize.toFixed(2)}`;
    } else {
      return `😔 Que pena! Você perdeu.\n\n` +
             `🎯 Sua escolha: ${playerEmoji}\n` +
             `🎲 Resultado: ${houseEmoji}\n` +
             `💸 Perdeu: R$ ${this.betAmount.toFixed(2)}`;
    }
  }

  // Método estático para criar instância
  static create(betAmount: number): CoinFlip {
    return new CoinFlip(betAmount);
  }

  // Método para obter informações do jogo
  static getGameInfo() {
    return {
      name: 'Cara ou Coroa',
      emoji: '🪙',
      description: 'Escolha cara ou coroa e teste sua sorte!',
      multiplier: 1.95,
      rtp: '95%', // Return to Player
      difficulty: 'Fácil',
      avgTime: '10 segundos',
    };
  }
}
