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
      'req.body.confirmPassword',
      'req.body.token',
      'req.body.accessToken',
      'req.body.refreshToken',
      'req.body.smsCode',
      'req.body.code',
      'req.body.apiKey',
      'req.body.content',
      'req.headers.authorization',
      'res.body',
      '*.password',
      '*.passwordHash',
      '*.token',
      '*.tokenHash',
      '*.accessToken',
      '*.refreshToken',
      '*.smsCode',
      '*.code',
      '*.apiKey',
      '*.authorization',
    ],
    censor: '[REDACTED]',
  },
});
