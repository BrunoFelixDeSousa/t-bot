import winston from 'winston';

/**
 * Logger principal da aplicação configurado com Winston
 * Suporta diferentes níveis de log e múltiplos transportes
 */
export const logger = winston.createLogger({
  /** Nível mínimo de log (configurável via LOG_LEVEL) */
  level: process.env.LOG_LEVEL || 'info',
  /** Formato das mensagens de log */
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  /** Metadados padrão incluídos em todas as mensagens */
  defaultMeta: { service: 'telegram-gamebot' },
  /** Transportes para diferentes tipos de log */
  transports: [
    /** Arquivo para logs de erro */
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    /** Arquivo para todos os logs */
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
});

// Em desenvolvimento, adiciona log no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  );
}

/**
 * Logger específico para a aplicação principal
 * Child logger com contexto específico do módulo 'app'
 */
export const appLogger = logger.child({ module: 'app' });
