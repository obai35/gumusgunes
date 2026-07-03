import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'

export const logger = pino({
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
