type LogLevel = 'info' | 'warn' | 'error' | 'debug'

function log(level: LogLevel, message: string, ...args: unknown[]): void {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  const fullMessage = `${prefix} ${message}`

  switch (level) {
    case 'error':
      console.error(fullMessage, ...args)
      break
    case 'warn':
      console.warn(fullMessage, ...args)
      break
    case 'debug':
      console.debug(fullMessage, ...args)
      break
    default:
      console.log(fullMessage, ...args)
  }
}

export const logger = {
  info: (message: string, ...args: unknown[]) => log('info', message, ...args),
  warn: (message: string, ...args: unknown[]) => log('warn', message, ...args),
  error: (message: string, ...args: unknown[]) => log('error', message, ...args),
  debug: (message: string, ...args: unknown[]) => log('debug', message, ...args)
}
