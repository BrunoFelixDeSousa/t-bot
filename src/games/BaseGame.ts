import { config } from '../config';
import { GameResult, GameType } from '../types/game';
import { logger } from '../utils/logger';

export abstract class BaseGame {
  protected gameType: GameType;
  protected betAmount: number;
  protected rakePercentage: number;

  constructor(gameType: GameType, betAmount: number) {
    this.gameType = gameType;
    this.betAmount = betAmount;
    this.rakePercentage = config.game.rakePercentage;
  }

  abstract play(playerChoice: unknown): Promise<GameResult>;

  protected calculatePrize(isWin: boolean, multiplier: number = 2): number {
    if (!isWin) return 0;

    const grossPrize = this.betAmount * multiplier;
    const rake = (grossPrize * this.rakePercentage) / 100;
    const netPrize = grossPrize - rake;

    return Math.max(netPrize, 0);
  }

  protected calculateRake(grossPrize: number): number {
    return (grossPrize * this.rakePercentage) / 100;
  }

  protected generateRandomChoice<T>(choices: T[]): T {
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
  }

  protected logGameResult(result: GameResult): void {
    logger.info('Game completed', {
      gameType: this.gameType,
      betAmount: this.betAmount,
      winner: result.winner,
      prize: result.prize,
      playerChoice: result.playerChoice,
      houseChoice: result.houseChoice,
    });
  }

  // Validações comuns
  protected validateBetAmount(): void {
    if (this.betAmount < config.game.minBetAmount) {
      throw new Error(`Aposta mínima: R$ ${config.game.minBetAmount}`);
    }

    if (this.betAmount > config.game.maxBetAmount) {
      throw new Error(`Aposta máxima: R$ ${config.game.maxBetAmount}`);
    }
  }

  // Getters
  public getBetAmount(): number {
    return this.betAmount;
  }

  public getGameType(): GameType {
    return this.gameType;
  }

  public getRakePercentage(): number {
    return this.rakePercentage;
  }
}
