import pino from 'pino'

const isProduction = process.env.NODE_ENV === 'production'
const hasLogtail = !!process.env.BETTER_STACK_SOURCE_TOKEN

function createLogger() {
  const level = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug')

  if (isProduction && hasLogtail) {
    try {
      return pino({
        level,
        transport: {
          target: '@logtail/pino',
          options: { sourceToken: process.env.BETTER_STACK_SOURCE_TOKEN },
        },
      })
    } catch {}
  }

  if (!isProduction) {
    try {
      return pino({
        level,
        transport: { target: 'pino-pretty', options: { colorize: true } },
      })
    } catch {}
  }

  return pino({ level })
}

export const logger = createLogger()
