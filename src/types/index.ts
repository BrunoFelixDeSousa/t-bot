/**
 * Interface de configuração da aplicação
 * Define a estrutura de todas as configurações necessárias
 */
export interface Config {
  /** Configurações do Telegram */
  telegram: {
    /** Token do bot fornecido pelo BotFather */
    botToken: string;
    /** Username do bot (sem @) */
    botUsername: string;
  };
  /** Configurações da aplicação */
  app: {
    /** Ambiente de execução (development, production, test) */
    environment: string;
    /** Porta do servidor */
    port: number;
  };
  /** Configurações do banco de dados */
  database: {
    /** URL de conexão com PostgreSQL */
    url: string;
  };
  /** Configurações dos jogos */
  game: {
    /** Valor mínimo de aposta em R$ */
    minBetAmount: number;
    /** Valor máximo de aposta em R$ */
    maxBetAmount: number;
    /** Percentual de rake da casa (%) */
    rakePercentage: number;
    /** Timeout em minutos para jogos esperando oponente */
    gameTimeout: number;
    /** Máximo de jogos ativos por usuário */
    maxActiveGames: number;
  };
  /** Configurações de administração */
  admin: {
    /** IDs do Telegram dos administradores */
    telegramIds: number[];
  };
}

/**
 * Classe de erro personalizada para a aplicação
 * Extends Error nativo com informações adicionais
 */
export class AppError extends Error {
  /**
   * Cria uma nova instância de AppError
   * @param message - Mensagem de erro
   * @param statusCode - Código HTTP de status (padrão: 500)
   * @param code - Código específico do erro (opcional)
   */
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}
