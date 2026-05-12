import { z } from 'zod';
import logger from './logger.js';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRE: z.string().default('7d'),
  CLIENT_URL: z.string().url('CLIENT_URL must be a valid URL'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
});

export const validateEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    logger.error('Environment variable validation failed:', errors);
    
    console.error('❌ Environment Validation Failed:');
    Object.entries(errors).forEach(([key, messages]) => {
      console.error(`  ${key}: ${messages?.join(', ')}`);
    });
    
    process.exit(1);
  }

  logger.info('✅ Environment variables validated successfully');
  return result.data;
};

export default validateEnv;
