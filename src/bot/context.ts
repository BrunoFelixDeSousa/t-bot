import { User } from '@/types/user';
import { Context } from 'telegraf';

/**
 * Contexto estendido do Telegraf para o bot de jogos.
 * 
 * Adiciona funcionalidades de sessão e estado específicas para
 * gerenciar jogos multiplayer, fluxos de apostas e dados do usuário
 * durante as interações no chat.
 * 
 * @extends Context
 */
export interface GameContext extends Context {
  /** 
   * Dados de sessão do usuário para manter estado entre mensagens.
   * 
   * Armazena informações temporárias como jogos ativos, passos do fluxo,
   * valores de aposta e controles de ação para navegação.
   */
  session?: {
    /** ID da partida multiplayer ativa */
    activeMatchId?: number;
    /** Dados da partida ativa */
    activeMatch?: unknown;
    /** Passo atual no fluxo de navegação */
    step?: string;
    /** Dados temporários específicos do contexto */
    data?: unknown;
    /** Tipo de jogo selecionado */
    selectedGame?: string;
    /** Valor da aposta escolhido */
    betAmount?: number;
    /** Ação atual para controle de fluxo multiplayer */
    action?: string;
    /** Propriedades dinâmicas adicionais */
    [key: string]: unknown;
  };
  
  /**
   * Estado persistente do contexto.
   * 
   * Mantém informações que devem persistir durante a sessão,
   * como dados do usuário autenticado.
   */
  state: {
    /** Dados do usuário logado */
    user?: User;
    /** Propriedades dinâmicas adicionais */
    [key: string]: unknown;
  };
}
