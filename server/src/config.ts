import 'dotenv/config';

const must = (key: string, fallback?: string) => process.env[key] || fallback || (() => { throw new Error(`Missing ${key}`); })();

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  jwtSecret: must('JWT_SECRET', 'development-only-change-this-access-secret'),
  refreshSecret: must('JWT_REFRESH_SECRET', 'development-only-change-this-refresh-secret'),
  uploadDir: process.env.UPLOAD_DIR ?? 'uploads',
  maxUploadBytes: Number(process.env.MAX_UPLOAD_MB ?? 10) * 1024 * 1024,
  isProduction: process.env.NODE_ENV === 'production'
};
