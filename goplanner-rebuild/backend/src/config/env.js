import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root regardless of where the process is started from
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

export const env = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017',
  dbName: process.env.DB_NAME || 'goplanner',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  hfApiKey: process.env.HF_API_KEY,
  hfModel: process.env.HF_MODEL || 'moonshotai/Kimi-K2-Instruct-0905',
  corsOrigin: process.env.CORS_ORIGIN || '*'
};

// Fail fast on missing critical secrets in production; warn in development.
if (!env.jwtSecret) {
  if (env.nodeEnv === 'production') {
    throw new Error('JWT_SECRET must be set in production. Refusing to start with an insecure default.');
  }
  console.warn('[config] JWT_SECRET is not set — using an insecure development-only fallback. Set it in backend/.env');
  env.jwtSecret = 'dev-only-insecure-secret-do-not-use-in-production';
}
