import mongoose from 'mongoose';
import { env } from './env.js';

let isEventListenersAttached = false;

function attachEventListeners() {
  if (isEventListenersAttached) return;

  mongoose.connection.on('connected', () => {
    console.log('[KOOPLE DB] Successfully connected to MongoDB database');
  });

  mongoose.connection.on('error', (err) => {
    console.error('[KOOPLE DB] MongoDB connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[KOOPLE DB] MongoDB disconnected');
  });

  isEventListenersAttached = true;
}

let memoryServer = null;

export async function connectDB(customUri) {
  const uri = customUri || env.MONGODB_URI;

  if (!uri) {
    throw new Error('[KOOPLE DB] MongoDB URI is required to connect to the database');
  }

  attachEventListeners();

  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    return conn;
  } catch (error) {
    if (env.NODE_ENV !== 'production' && !customUri) {
      console.warn('[KOOPLE DB] Local MongoDB daemon not reachable on URI. Spinning up development In-Memory database...');
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log('[KOOPLE DB] Successfully connected to In-Memory MongoDB development instance');
        return conn;
      } catch (memErr) {
        console.error('[KOOPLE DB] Could not start In-Memory fallback:', memErr.message);
      }
    }
    console.error('[KOOPLE DB] Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
  } catch (error) {
    console.error('[KOOPLE DB] Error while disconnecting from MongoDB:', error.message);
    throw error;
  }
}

export function isDBConnected() {
  return mongoose.connection.readyState === 1;
}
