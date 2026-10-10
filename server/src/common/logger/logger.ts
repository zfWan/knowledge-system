import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino/file', options: { destination: 1 } }
      : undefined,
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  redact: {
    paths: [
      'req.body.password',
      'req.body.token',
      'req.body.apiKey',
      'req.body.content',
      'res.body',
      '*.password',
      '*.token',
      '*.apiKey',
    ],
    censor: '[REDACTED]',
  },
});
