import { config } from '../config';
import { GameResult, GameType } from '../types/game';
import { logger } from '../utils/logger';

/**
 * Classe base abstrata para todos os jogos
 * Define a interface comum e métodos utilitários compartilhados
 */
export abstract class BaseGame {
  protected gameType: GameType;
  protected betAmount: number;
  protected rakePercentage: number;

  /**
   * Construtor da classe base
   * @param gameType - Tipo do jogo
   * @param betAmount - Valor da aposta
   */
  constructor(gameType: GameType, betAmount: number) {
    this.gameType = gameType;
    this.betAmount = betAmount;
    this.rakePercentage = config.game.rakePercentage;
  }

  /**
   * Método abstrato para jogar o jogo
   * Deve ser implementado pelas classes filhas
   * @param playerChoice - Escolha do jogador
   * @returns Promise com o resultado do jogo
   */
  abstract play(playerChoice: unknown): Promise<GameResult>;

  /**
   * Calcula o prêmio líquido considerando o rake
   * @param isWin - Se o jogador ganhou
   * @param multiplier - Multiplicador do prêmio (padrão: 2x)
   * @returns Valor do prêmio líquido
   */
  protected calculatePrize(isWin: boolean, multiplier: number = 2): number {
    if (!isWin) return 0;

    const grossPrize = this.betAmount * multiplier;
    const rake = (grossPrize * this.rakePercentage) / 100;
    const netPrize = grossPrize - rake;

    return Math.max(netPrize, 0);
  }

  /**
   * Calcula o valor do rake sobre um prêmio bruto
   * @param grossPrize - Prêmio bruto
   * @returns Valor do rake
   */
  protected calculateRake(grossPrize: number): number {
    return (grossPrize * this.rakePercentage) / 100;
  }

  /**
   * Gera uma escolha aleatória de um array de opções
   * @param choices - Array de opções possíveis
   * @returns Escolha aleatória do array
   */
  protected generateRandomChoice<T>(choices: T[]): T {
    const randomIndex = Math.floor(Math.random() * choices.length);
    return choices[randomIndex];
  }

  /**
   * Registra o resultado do jogo no log
   * @param result - Resultado do jogo para logar
   */
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

  /**
   * Valida se o valor da aposta está dentro dos limites permitidos
   * @throws {Error} Se o valor estiver fora dos limites
   */
  protected validateBetAmount(): void {
    if (this.betAmount < config.game.minBetAmount) {
      throw new Error(`Aposta mínima: R$ ${config.game.minBetAmount}`);
    }

    if (this.betAmount > config.game.maxBetAmount) {
      throw new Error(`Aposta máxima: R$ ${config.game.maxBetAmount}`);
    }
  }

  /**
   * Retorna o valor da aposta
   * @returns Valor da aposta
   */
  public getBetAmount(): number {
    return this.betAmount;
  }

  /**
   * Retorna o tipo do jogo
   * @returns Tipo do jogo
   */
  public getGameType(): GameType {
    return this.gameType;
  }

  /**
   * Retorna o percentual de rake configurado
   * @returns Percentual de rake
   */
  public getRakePercentage(): number {
    return this.rakePercentage;
  }
}
