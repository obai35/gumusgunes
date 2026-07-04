import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

function createLogger() {
  try {
    return pino({
      level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
      transport: isProduction
        ? {
            target: '@logtail/pino',
            options: { sourceToken: process.env.BETTER_STACK_SOURCE_TOKEN },
          }
        : {
            target: 'pino-pretty',
            options: { colorize: true },
          },
    })
  } catch {
    return pino({ level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug') })
  }
}

export const logger = createLogger()
