export interface AppConfig {
  nodeEnv: string;
  port: number;
  appTz: string;
  appBaseUrl: string;
  corsOrigins: string[];
  jwtSecret: string;
  jwtAccessTtl: string;
  jwtRefreshTtl: string;
  allowRegistration: boolean;
  databaseUrl: string;
  sqliteWal: boolean;
  vssDimension: number;
  storageDriver: 'local' | 's3';
  storageLocalRoot: string;
  storageSignUrlTtl: number;
  attachmentMaxSizeMb: number;
  attachmentAllowedMime: string[];
  llmProvider: string;
  llmBaseUrl: string;
  llmApiKey: string;
  llmChatModel: string;
  llmTimeoutMs: number;
  llmTemperature: number;
  llmMaxTokens: number;
  embeddingBaseUrl: string;
  embeddingApiKey: string;
  embeddingModel: string;
  searchTopKPerPath: number;
  searchMergedTopK: number;
  searchMinScore: number;
  rerankStrategy: 'weighted' | 'rermodel';
  rerankBm25Weight: number;
  rerankVecWeight: number;
  mailDriver: 'smtp' | 'log';
  smsDriver: string;
  authThrottleTtl: number;
  authThrottleLimit: number;
  chatThrottleTtl: number;
  chatThrottleLimit: number;
  quotaDailyDefault: number;
  logLevel: string;
}

const toInt = (v: string | undefined, d: number): number => (v ? parseInt(v, 10) : d);
const toFloat = (v: string | undefined, d: number): number => (v ? parseFloat(v) : d);
const toBool = (v: string | undefined, d: boolean): boolean =>
  v === undefined ? d : v === 'true' || v === '1';

export const configuration = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: toInt(process.env.PORT, 3000),
  appTz: process.env.APP_TZ || 'Asia/Shanghai',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:8080',
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  jwtAccessTtl: process.env.JWT_ACCESS_TTL || '2h',
  jwtRefreshTtl: process.env.JWT_REFRESH_TTL || '30d',
  allowRegistration: toBool(process.env.ALLOW_REGISTRATION, true),
  databaseUrl: process.env.DATABASE_URL || 'file:./data/app.db',
  sqliteWal: toBool(process.env.SQLITE_WAL, true),
  vssDimension: toInt(process.env.VSS_DIMENSION, 1024),
  storageDriver: (process.env.STORAGE_DRIVER as any) || 'local',
  storageLocalRoot: process.env.STORAGE_LOCAL_ROOT || './data/uploads',
  storageSignUrlTtl: toInt(process.env.STORAGE_SIGN_URL_TTL, 900),
  attachmentMaxSizeMb: toInt(process.env.ATTACHMENT_MAX_SIZE_MB, 20),
  attachmentAllowedMime: (process.env.ATTACHMENT_ALLOWED_MIME || '')
    .split(',').map((s) => s.trim()).filter(Boolean),
  llmProvider: process.env.LLM_PROVIDER || 'openai',
  llmBaseUrl: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
  llmApiKey: process.env.LLM_API_KEY || '',
  llmChatModel: process.env.LLM_CHAT_MODEL || 'gpt-4o-mini',
  llmTimeoutMs: toInt(process.env.LLM_TIMEOUT_MS, 20000),
  llmTemperature: toFloat(process.env.LLM_TEMPERATURE, 0.3),
  llmMaxTokens: toInt(process.env.LLM_MAX_TOKENS, 1024),
  embeddingBaseUrl: process.env.EMBEDDING_BASE_URL || process.env.LLM_BASE_URL || '',
  embeddingApiKey: process.env.EMBEDDING_API_KEY || process.env.LLM_API_KEY || '',
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
  searchTopKPerPath: toInt(process.env.SEARCH_TOPK_PER_PATH, 20),
  searchMergedTopK: toInt(process.env.SEARCH_MERGED_TOPK, 20),
  searchMinScore: toFloat(process.env.SEARCH_MIN_SCORE, 0.3),
  rerankStrategy: (process.env.RERANK_STRATEGY as any) || 'weighted',
  rerankBm25Weight: toFloat(process.env.RERANK_BM25_WEIGHT, 0.4),
  rerankVecWeight: toFloat(process.env.RERANK_VEC_WEIGHT, 0.6),
  mailDriver: (process.env.MAIL_DRIVER as any) || 'log',
  smsDriver: process.env.SMS_DRIVER || 'log',
  authThrottleTtl: toInt(process.env.AUTH_THROTTLE_TTL, 60),
  authThrottleLimit: toInt(process.env.AUTH_THROTTLE_LIMIT, 5),
  chatThrottleTtl: toInt(process.env.CHAT_THROTTLE_TTL, 60),
  chatThrottleLimit: toInt(process.env.CHAT_THROTTLE_LIMIT, 10),
  quotaDailyDefault: toInt(process.env.QUOTA_DAILY_DEFAULT, 50),
  logLevel: process.env.LOG_LEVEL || 'info',
});
