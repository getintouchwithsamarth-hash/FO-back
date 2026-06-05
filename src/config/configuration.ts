import type { AppEnv } from './env.schema';

export const configuration = (env: AppEnv) => ({
  app: {
    env: env.NODE_ENV,
    port: env.PORT,
    apiPrefix: env.API_PREFIX,
    url: env.APP_URL,
    corsOrigins: env.CORS_ORIGINS.split(',').map((origin) => origin.trim()),
  },
  database: {
    url: env.DATABASE_URL,
  },
  redis: {
    url: env.REDIS_URL,
  },
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessTtl: env.JWT_ACCESS_TTL,
    refreshTtl: env.JWT_REFRESH_TTL,
  },
  storage: {
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    bucket: env.S3_BUCKET,
    accessKey: env.S3_ACCESS_KEY,
    secretKey: env.S3_SECRET_KEY,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    maxAttachmentSizeBytes: env.MAX_ATTACHMENT_SIZE_BYTES,
  },
});
