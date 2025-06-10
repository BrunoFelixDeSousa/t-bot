export interface Config {
  telegram: {
    botToken: string;
    botUsername: string;
  };
  app: {
    environment: string;
    port: number;
  };
  database: {
    url: string;
  };
  game: {
    minBetAmount: number;
    maxBetAmount: number;
    rakePercentage: number;
    gameTimeout: number; // Timeout em minutos para jogos esperando oponente
    maxActiveGames: number; // Máximo de jogos ativos por usuário
  };
  admin: {
    telegramIds: number[];
  };
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}
