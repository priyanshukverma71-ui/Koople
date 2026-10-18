import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const isTest = NODE_ENV === 'test';

// Define required environment variables for runtime
const REQUIRED_VARS = ['MONGODB_URI', 'GEMINI_API_KEY', 'JWT_SECRET'];

// Validate environment variables (except in test mode where mocks or memory databases are used)
if (!isTest) {
  const missingVars = REQUIRED_VARS.filter((varName) => !process.env[varName] || process.env[varName].trim() === '');

  if (missingVars.length > 0) {
    throw new Error(
      `[KOOPLE Server] Missing required environment variable(s): ${missingVars.join(
        ', '
      )}. Please provide them in your .env file or environment.`
    );
  }
}

export const env = Object.freeze({
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || (isTest ? 'mongodb://localhost:27017/koople_test' : ''),
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || (isTest ? 'test_gemini_api_key' : ''),
  JWT_SECRET: process.env.JWT_SECRET || (isTest ? 'test_jwt_secret_koople_dev_key_32chars' : ''),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  NODE_ENV,
  isProduction: NODE_ENV === 'production',
  isTest,
});
