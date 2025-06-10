import { DominoGameState, DominoPiece, GameResult } from '../types/game';
import { logger } from '../utils/logger';
import { BaseGame } from './BaseGame';

export class Domino extends BaseGame {
  private gameState: DominoGameState;

  constructor(betAmount: number, player1Id: number, player2Id: number) {
    super('domino', betAmount);
    this.gameState = this.initializeGameState(player1Id, player2Id);
    this.validateBetAmount();
  }

  /**
   * Criar deck completo de dominó (28 peças: 0-0 até 6-6)
   */
  private createDeck(): DominoPiece[] {
    const deck: DominoPiece[] = [];
    let id = 1;
    
    // Criar todas as 28 peças do dominó
    for (let i = 0; i <= 6; i++) {
      for (let j = i; j <= 6; j++) {
        deck.push({
          left: i,
          right: j,
          id: `${id++}`
        });
      }
    }
    
    // Embaralhar deck
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    
    return deck;
  }

  /**
   * Inicializar estado do jogo
   */
  private initializeGameState(player1Id: number, player2Id: number): DominoGameState {
    const deck = this.createDeck();
    const playerHands: { [playerId: string]: DominoPiece[] } = {};
    
    // Distribuir 7 peças para cada jogador
    const players = [player1Id.toString(), player2Id.toString()];
    players.forEach(playerId => {
      playerHands[playerId] = deck.splice(0, 7);
    });

    return {
      deck,
      table: [],
      playerHands,
      leftEnd: null,
      rightEnd: null,
      currentPlayer: player1Id.toString(),
      round: 1,
      maxRounds: 1, // Por enquanto, apenas 1 rodada
      scores: {
        [player1Id.toString()]: 0,
        [player2Id.toString()]: 0
      },
      gameStarted: false,
      isBlocked: false
    };
  }

  /**
   * Validar se uma jogada é válida
   */
  public validateMove(playerId: string, pieceId: string, side: 'left' | 'right'): boolean {
    try {
      const playerHand = this.gameState.playerHands[playerId];
      if (!playerHand) return false;
      
      // Verificar se o jogador tem a peça
      const piece = playerHand.find(p => p.id === pieceId);
      if (!piece) return false;
      
      // Se for a primeira jogada, qualquer peça é válida
      if (this.gameState.table.length === 0) return true;
      
      // Verificar se a peça pode ser jogada na ponta escolhida
      const requiredValue = side === 'left' ? this.gameState.leftEnd : this.gameState.rightEnd;
      return piece.left === requiredValue || piece.right === requiredValue;
      
    } catch (error) {
      logger.error('Error validating domino move:', error);
      return false;
    }
  }

  /**
   * Fazer uma jogada
   */
  public makeMove(playerId: string, pieceId: string, side: 'left' | 'right'): boolean {
    if (!this.validateMove(playerId, pieceId, side)) return false;
    
    try {
      const playerHand = this.gameState.playerHands[playerId];
      const pieceIndex = playerHand.findIndex(p => p.id === pieceId);
      const piece = playerHand[pieceIndex];
      
      // Remover peça da mão do jogador
      playerHand.splice(pieceIndex, 1);
      
      // Adicionar peça à mesa
      this.placePieceOnTable(piece, side);
      
      // Registrar última jogada
      this.gameState.lastMove = { playerId, piece, side };
      
      // Alternar jogador
      this.switchToNextPlayer();
      
      return true;
      
    } catch (error) {
      logger.error('Error making domino move:', error);
      return false;
    }
  }

  /**
   * Colocar peça na mesa
   */
  private placePieceOnTable(piece: DominoPiece, side: 'left' | 'right') {
    if (this.gameState.table.length === 0) {
      // Primeira peça
      this.gameState.table.push(piece);
      this.gameState.leftEnd = piece.left;
      this.gameState.rightEnd = piece.right;
      this.gameState.gameStarted = true;
    } else {
      const requiredValue = side === 'left' ? this.gameState.leftEnd : this.gameState.rightEnd;
      
      if (side === 'left') {
        // Ajustar orientação da peça se necessário
        if (piece.right === requiredValue) {
          this.gameState.table.unshift(piece);
          this.gameState.leftEnd = piece.left;
        } else {
          // Virar a peça
          this.gameState.table.unshift({ ...piece, left: piece.right, right: piece.left });
          this.gameState.leftEnd = piece.right;
        }
      } else {
        // Lado direito
        if (piece.left === requiredValue) {
          this.gameState.table.push(piece);
          this.gameState.rightEnd = piece.right;
        } else {
          this.gameState.table.push({ ...piece, left: piece.right, right: piece.left });
          this.gameState.rightEnd = piece.left;
        }
      }
    }
  }

  /**
   * Alternar para próximo jogador
   */
  private switchToNextPlayer() {
    const players = Object.keys(this.gameState.playerHands);
    const currentIndex = players.indexOf(this.gameState.currentPlayer);
    this.gameState.currentPlayer = players[(currentIndex + 1) % players.length];
  }

  /**
   * Obter jogadas disponíveis para um jogador
   */
  public getAvailableMoves(playerId: string): Array<{ piece: DominoPiece; sides: ('left' | 'right')[] }> {
    const playerHand = this.gameState.playerHands[playerId];
    if (!playerHand) return [];
    
    if (this.gameState.table.length === 0) {
      // Primeira jogada - qualquer peça
      return playerHand.map(piece => ({ piece, sides: ['left'] as ('left' | 'right')[] }));
    }
    
    const availableMoves: Array<{ piece: DominoPiece; sides: ('left' | 'right')[] }> = [];
    
    playerHand.forEach(piece => {
      const sides: ('left' | 'right')[] = [];
      
      // Verificar lado esquerdo
      if (piece.left === this.gameState.leftEnd || piece.right === this.gameState.leftEnd) {
        sides.push('left');
      }
      
      // Verificar lado direito
      if (piece.left === this.gameState.rightEnd || piece.right === this.gameState.rightEnd) {
        sides.push('right');
      }
      
      if (sides.length > 0) {
        availableMoves.push({ piece, sides });
      }
    });
    
    return availableMoves;
  }

  /**
   * Verificar se o jogo terminou
   */
  public isGameOver(): boolean {
    // Verificar se alguém ficou sem peças
    const players = Object.keys(this.gameState.playerHands);
    const someoneWon = players.some(playerId => this.gameState.playerHands[playerId].length === 0);
    
    if (someoneWon) return true;
    
    // Verificar se o jogo está bloqueado (ninguém pode jogar)
    const currentPlayer = this.gameState.currentPlayer;
    const availableMoves = this.getAvailableMoves(currentPlayer);
    
    if (availableMoves.length === 0) {
      // Verificar se o próximo jogador também não pode jogar
      this.switchToNextPlayer();
      const nextPlayerMoves = this.getAvailableMoves(this.gameState.currentPlayer);
      this.switchToNextPlayer(); // Voltar ao jogador original
      
      if (nextPlayerMoves.length === 0) {
        this.gameState.isBlocked = true;
        return true;
      }
    }
    
    return false;
  }

  /**
   * Determinar vencedor do jogo
   */
  public determineWinner(player1Id: string, player2Id: string): GameResult {
    if (!this.isGameOver()) {
      return {
        winner: 'tie',
        playerChoice: '',
        houseChoice: '',
        prize: 0,
        details: 'Jogo ainda em andamento'
      };
    }
    
    const players = [player1Id, player2Id];
    
    // Verificar se alguém ficou sem peças
    const winner = players.find(playerId => this.gameState.playerHands[playerId].length === 0);
    
    if (winner) {
      const isPlayer1Winner = winner === player1Id;
      const prize = this.calculatePrize(true, 1.9); // 90% RTP, 10% rake
      
      return {
        winner: isPlayer1Winner ? 'player' : 'house', // Para compatibilidade
        playerChoice: 'domino',
        houseChoice: 'domino',
        prize: isPlayer1Winner ? prize : 0,
        details: `🏆 ${isPlayer1Winner ? 'Jogador 1' : 'Jogador 2'} venceu ficando sem peças!`
      };
    }
    
    // Jogo bloqueado - contar pontos nas mãos
    const player1Points = this.gameState.playerHands[player1Id]
      .reduce((sum, piece) => sum + piece.left + piece.right, 0);
    const player2Points = this.gameState.playerHands[player2Id]
      .reduce((sum, piece) => sum + piece.left + piece.right, 0);
    
    if (player1Points < player2Points) {
      const prize = this.calculatePrize(true, 1.9);
      return {
        winner: 'player',
        playerChoice: 'domino',
        houseChoice: 'domino',
        prize,
        details: `🏆 Jogador 1 venceu! (${player1Points} vs ${player2Points} pontos)`
      };
    } else if (player2Points < player1Points) {
      return {
        winner: 'house',
        playerChoice: 'domino',
        houseChoice: 'domino',
        prize: 0,
        details: `🏆 Jogador 2 venceu! (${player2Points} vs ${player1Points} pontos)`
      };
    } else {
      return {
        winner: 'tie',
        playerChoice: 'domino',
        houseChoice: 'domino',
        prize: this.betAmount, // Devolver aposta
        details: `🤝 Empate! Ambos com ${player1Points} pontos`
      };
    }
  }

  /**
   * Implementação do método abstrato play (para compatibilidade)
   */
  async play(playerChoice: unknown): Promise<GameResult> {
    // Para Domino, este método não é usado diretamente
    // O jogo é controlado através de makeMove()
    throw new Error('Use makeMove() para jogar Domino');
  }

  /**
   * Obter estado atual do jogo
   */
  public getGameState(): DominoGameState {
    return { ...this.gameState };
  }

  /**
   * Definir estado do jogo (para restaurar do banco)
   */
  public setGameState(state: DominoGameState) {
    this.gameState = state;
  }

  /**
   * Gerar interface visual simplificada
   */
  public generateGameInterface(forPlayerId: string): string {
    let interface_text = `🎯 ═══════ DOMINÓ #${Date.now()} ═══════\n\n`;
    
    // Mesa
    if (this.gameState.table.length > 0) {
      interface_text += "🔥 MESA:\n";
      interface_text += "     ";
      
      this.gameState.table.forEach((piece, index) => {
        if (index === 0) {
          interface_text += `[${piece.left}●${piece.right}]`;
        } else {
          interface_text += `═[${piece.left}●${piece.right}]`;
        }
      });
      
      interface_text += `\n     ⬅️${this.gameState.leftEnd}    ${this.gameState.rightEnd}➡️\n\n`;
    } else {
      interface_text += "🔥 MESA: (vazia)\n\n";
    }
    
    // Mão do jogador
    const playerHand = this.gameState.playerHands[forPlayerId];
    if (playerHand) {
      interface_text += `🎯 SUA MÃO (${playerHand.length} peças):\n`;
      playerHand.forEach((piece, index) => {
        interface_text += `${index + 1}. [${piece.left}●${piece.right}] `;
      });
      interface_text += "\n\n";
      
      // Status do turno
      if (this.gameState.currentPlayer === forPlayerId) {
        interface_text += "⚡ É SUA VEZ! ⚡\n";
        
        const availableMoves = this.getAvailableMoves(forPlayerId);
        if (availableMoves.length > 0) {
          interface_text += "🎯 JOGADAS POSSÍVEIS:\n";
          availableMoves.slice(0, 3).forEach((move, index) => {
            const piece = move.piece;
            const sides = move.sides.map(s => s === 'left' ? '⬅️' : '➡️').join(' ');
            interface_text += `${index + 1}. [${piece.left}●${piece.right}] ${sides}\n`;
          });
        } else {
          interface_text += "❌ Sem jogadas possíveis!\n";
        }
      } else {
        interface_text += "💤 Aguardando adversário...\n";
      }
    }
    
    interface_text += "\n🎮 ═══════════════════════";
    
    return interface_text;
  }

  /**
   * Método estático para criar instância
   */
  static create(betAmount: number, player1Id: number, player2Id: number): Domino {
    return new Domino(betAmount, player1Id, player2Id);
  }

  /**
   * Método para obter informações do jogo
   */
  static getGameInfo() {
    return {
      name: 'Dominó',
      emoji: '🀱',
      description: 'Jogo clássico de dominó para 2 jogadores!',
      multiplier: 1.9,
      rtp: '90%',
      difficulty: 'Médio',
      avgTime: '10-15 minutos',
    };
  }
}
