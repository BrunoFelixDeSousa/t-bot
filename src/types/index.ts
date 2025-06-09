export interface Config {
  app: {
    environment: string;
    port: number;
  };
  database: {
    url: string;
  };
  admin: {
    telegramIds: number[];
  };
}

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
