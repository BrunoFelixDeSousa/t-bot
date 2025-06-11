import { DominoGameState, DominoPiece, GameResult } from '../types/game';
import { logger } from '../utils/logger';
import { BaseGame } from './BaseGame';

/**
 * Implementação do jogo de Dominó multiplayer.
 * 
 * Gerencia um jogo completo de dominó com 28 peças (0-0 até 6-6),
 * distribuição automática de mãos, validação de jogadas e determinação
 * de vencedores baseada em pontuação e peças restantes.
 * 
 * @extends BaseGame
 */
export class Domino extends BaseGame {
  /** Estado completo do jogo incluindo deck, mãos dos jogadores e mesa */
  private gameState: DominoGameState;

  /**
   * Inicializa um novo jogo de Dominó.
   * 
   * @param betAmount - Valor da aposta em reais
   * @param playerIds - Array com IDs dos jogadores (2-4 jogadores)
   */
  constructor(betAmount: number, playerIds: number[]) {
    super('domino', betAmount);
    
    // Validar número de jogadores
    if (playerIds.length < 2 || playerIds.length > 4) {
      throw new Error('Dominó suporta apenas 2 a 4 jogadores');
    }
    
    // Validar IDs únicos
    const uniqueIds = new Set(playerIds);
    if (uniqueIds.size !== playerIds.length) {
      throw new Error('IDs dos jogadores devem ser únicos');
    }
    
    this.gameState = this.initializeGameState(playerIds);
    this.validateBetAmount();
  }

  /**
   * Cria deck completo de dominó com todas as 28 peças.
   * 
   * Gera peças de 0-0 até 6-6 seguindo as regras tradicionais do dominó,
   * onde cada número aparece com todos os números maiores ou iguais a ele.
   * O deck é automaticamente embaralhado após a criação.
   * 
   * @returns Array com todas as 28 peças embaralhadas
   * 
   * @private
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
   * Inicializa o estado completo de um novo jogo de Dominó.
   * 
   * Cria o deck, distribui peças para cada jogador (7 para 2 jogadores, 6 para 3-4), 
   * inicializa a mesa vazia e define o primeiro jogador. Prepara todas as estruturas
   * necessárias para começar uma partida.
   * 
   * @param playerIds - Array com IDs dos jogadores
   * 
   * @returns Estado inicial completo do jogo
   * 
   * @private
   */
  private initializeGameState(playerIds: number[]): DominoGameState {
    const deck = this.createDeck();
    const playerHands: { [playerId: string]: DominoPiece[] } = {};
    const scores: { [playerId: string]: number } = {};
    
    // Determinar número de peças por jogador baseado no número de jogadores
    const piecesPerPlayer = playerIds.length === 2 ? 7 : 6;
    
    // Distribuir peças para cada jogador
    const players = playerIds.map(id => id.toString());
    players.forEach(playerId => {
      playerHands[playerId] = deck.splice(0, piecesPerPlayer);
      scores[playerId] = 0;
    });

    return {
      deck,
      table: [],
      playerHands,
      leftEnd: null,
      rightEnd: null,
      currentPlayer: players[0], // Primeiro jogador da lista
      round: 1,
      maxRounds: 1, // Por enquanto, apenas 1 rodada
      scores,
      gameStarted: false,
      isBlocked: false
    };
  }

  /**
   * Valida se uma jogada é permitida pelas regras do dominó.
   * 
   * Verifica se o jogador possui a peça, se é a primeira jogada (qualquer peça válida)
   * ou se a peça pode ser conectada com uma das pontas da mesa.
   * 
   * @param playerId - ID do jogador fazendo a jogada
   * @param pieceId - ID da peça a ser jogada
   * @param side - Lado da mesa onde jogar: 'left' ou 'right'
   * 
   * @returns true se a jogada é válida, false caso contrário
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
   * Executa uma jogada no tabuleiro de dominó.
   * 
   * Valida a jogada, remove a peça da mão do jogador, coloca na mesa
   * com orientação correta e alterna para o próximo jogador.
   * 
   * @param playerId - ID do jogador fazendo a jogada
   * @param pieceId - ID da peça a ser jogada  
   * @param side - Lado da mesa onde jogar: 'left' ou 'right'
   * 
   * @returns true se a jogada foi executada com sucesso, false caso contrário
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
   * Posiciona uma peça na mesa com orientação correta.
   * 
   * Para a primeira peça, apenas a coloca na mesa. Para peças subsequentes,
   * verifica a orientação necessária e vira a peça se preciso para que
   * os números coincidam corretamente.
   * 
   * @param piece - Peça de dominó a ser colocada
   * @param side - Lado da mesa onde colocar: 'left' ou 'right'
   * 
   * @private
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
   * Alterna o turno para o próximo jogador na sequência.
   * 
   * Utiliza rotação circular entre os jogadores registrados,
   * garantindo que o jogo continue de forma alternada.
   * 
   * @private
   */
  private switchToNextPlayer() {
    const players = Object.keys(this.gameState.playerHands);
    const currentIndex = players.indexOf(this.gameState.currentPlayer);
    this.gameState.currentPlayer = players[(currentIndex + 1) % players.length];
  }

  /**
   * Calcula todas as jogadas possíveis para um jogador.
   * 
   * Analisa as peças na mão do jogador e verifica quais podem ser
   * jogadas em cada lado da mesa, retornando lista com peças e
   * lados disponíveis para cada uma.
   * 
   * @param playerId - ID do jogador para analisar
   * 
   * @returns Array com peças e lados onde podem ser jogadas
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
   * Verifica se o jogo chegou ao fim por vitória ou bloqueio.
   * 
   * O jogo termina quando um jogador fica sem peças (vitória) ou quando
   * nenhum jogador consegue mais fazer jogadas (bloqueio).
   * 
   * @returns true se o jogo terminou, false se ainda está em andamento
   */
  public isGameOver(): boolean {
    // Verificar se alguém ficou sem peças
    const players = Object.keys(this.gameState.playerHands);
    const someoneWon = players.some(playerId => this.gameState.playerHands[playerId].length === 0);
    
    if (someoneWon) return true;
    
    // Verificar se o jogo está bloqueado (ninguém pode jogar)
    const playersWithMoves = players.filter(playerId => 
      this.getAvailableMoves(playerId).length > 0
    );
    
    if (playersWithMoves.length === 0) {
      this.gameState.isBlocked = true;
      return true;
    }
    
    return false;
  }

  /**
   * Determina o vencedor da partida e calcula prêmios.
   * 
   * Em caso de vitória por esvaziamento da mão, o jogador ganha o prêmio total.
   * Em bloqueio, conta-se os pontos nas mãos e quem tiver menos ganha.
   * Empate resulta em devolução das apostas.
   * 
   * @returns Resultado detalhado da partida com vencedor e prêmio
   */
  public determineWinner(): GameResult {
    if (!this.isGameOver()) {
      return {
        winner: 'tie',
        playerChoice: '',
        houseChoice: '',
        prize: 0,
        details: 'Jogo ainda em andamento'
      };
    }
    
    const players = Object.keys(this.gameState.playerHands);
    
    // Verificar se alguém ficou sem peças
    const winner = players.find(playerId => this.gameState.playerHands[playerId].length === 0);
    
    if (winner) {
      // Vencedor por esvaziamento da mão
      const prize = this.calculatePrize(true, 1.9); // 90% RTP, 10% rake
      
      return {
        winner: 'player',
        playerChoice: 'domino',
        houseChoice: 'domino',
        prize,
        details: `🏆 Jogador ${winner} venceu ficando sem peças!`
      };
    }
    
    // Jogo bloqueado - contar pontos nas mãos e encontrar o menor
    const playerPoints = players.map(playerId => ({
      playerId,
      points: this.gameState.playerHands[playerId]
        .reduce((sum, piece) => sum + piece.left + piece.right, 0)
    }));
    
    // Ordenar por pontos (menor primeiro)
    playerPoints.sort((a, b) => a.points - b.points);
    
    const minPoints = playerPoints[0].points;
    const winners = playerPoints.filter(p => p.points === minPoints);
    
    if (winners.length === 1) {
      // Vencedor único
      const prize = this.calculatePrize(true, 1.9);
      return {
        winner: 'player',
        playerChoice: 'domino',
        houseChoice: 'domino',
        prize,
        details: `🏆 Jogador ${winners[0].playerId} venceu com ${minPoints} pontos!`
      };
    } else {
      // Empate - múltiplos jogadores com mesma pontuação
      const winnersList = winners.map(w => w.playerId).join(', ');
      return {
        winner: 'tie',
        playerChoice: 'domino',
        houseChoice: 'domino',
        prize: this.betAmount, // Devolver aposta
        details: `🤝 Empate entre jogadores ${winnersList} com ${minPoints} pontos cada!`
      };
    }
  }

  /**
   * Implementação do método abstrato play (para compatibilidade com BaseGame).
   * 
   * No jogo de Dominó, este método não é utilizado diretamente pois o controle
   * é feito através de jogadas individuais com makeMove(). Lança erro orientando
   * o uso correto da API.
   * 
   * @param playerChoice - Parâmetro não utilizado (compatibilidade)
   * 
   * @throws {Error} Sempre lança erro orientando uso de makeMove()
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async play(playerChoice: unknown): Promise<GameResult> {
    // Para Domino, este método não é usado diretamente
    // O jogo é controlado através de makeMove()
    throw new Error('Use makeMove() para jogar Domino');
  }

  /**
   * Obtém uma cópia do estado atual completo do jogo.
   * 
   * Retorna snapshot do estado incluindo deck, mãos dos jogadores,
   * mesa, pontuações e controles de turno.
   * 
   * @returns Cópia do estado atual do jogo
   */
  public getGameState(): DominoGameState {
    return { ...this.gameState };
  }

  /**
   * Define o estado do jogo a partir de dados salvos.
   * 
   * Utilizado para restaurar partidas do banco de dados,
   * permitindo continuidade de jogos em andamento.
   * 
   * @param state - Estado completo do jogo a ser restaurado
   */
  public setGameState(state: DominoGameState) {
    this.gameState = state;
  }

  /**
   * Gera interface visual em texto para mostrar ao jogador.
   * 
   * Cria representação ASCII do tabuleiro, mostra a mão do jogador,
   * indica de quem é o turno e lista jogadas possíveis de forma
   * amigável para exibição no chat do Telegram.
   * 
   * @param forPlayerId - ID do jogador para quem gerar a interface
   * 
   * @returns String formatada com estado visual do jogo
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
    
    // Status de todos os jogadores
    const players = Object.keys(this.gameState.playerHands);
    interface_text += "👥 JOGADORES:\n";
    players.forEach((playerId, index) => {
      const handSize = this.gameState.playerHands[playerId].length;
      const isCurrentPlayer = this.gameState.currentPlayer === playerId;
      const isThisPlayer = playerId === forPlayerId;
      
      let playerStatus = '';
      if (isThisPlayer) {
        playerStatus = `🎯 VOCÊ (${handSize} peças)`;
      } else {
        playerStatus = `👤 Jogador ${playerId} (${handSize} peças)`;
      }
      
      if (isCurrentPlayer) {
        playerStatus += ' ⚡';
      }
      
      interface_text += `${index + 1}. ${playerStatus}\n`;
    });
    interface_text += "\n";
    
    // Mão do jogador atual
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
        const currentPlayerName = this.gameState.currentPlayer === forPlayerId ? 'VOCÊ' : `Jogador ${this.gameState.currentPlayer}`;
        interface_text += `💤 Aguardando ${currentPlayerName}...\n`;
      }
    }
    
    interface_text += "\n🎮 ═══════════════════════";
    
    return interface_text;
  }

  /**
   * Método factory para criar nova instância de Dominó.
   * 
   * Alternativa estática ao construtor, oferecendo interface
   * mais clara para criação de jogos.
   * 
   * @param betAmount - Valor da aposta em reais
   * @param playerIds - Array com IDs dos jogadores (2-4 jogadores)
   * 
   * @returns Nova instância configurada do jogo Dominó
   */
  static create(betAmount: number, playerIds: number[]): Domino {
    return new Domino(betAmount, playerIds);
  }

  /**
   * Método para obter informações do jogo
   */
  static getGameInfo() {
    return {
      name: 'Dominó',
      emoji: '🀱',
      description: 'Jogo clássico de dominó para 2-4 jogadores!',
      multiplier: 1.9,
      rtp: '90%',
      difficulty: 'Médio',
      avgTime: '10-15 minutos',
    };
  }
}
