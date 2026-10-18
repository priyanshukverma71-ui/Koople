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

export async function connectDB(customUri) {
  const uri = customUri || env.MONGODB_URI;

  if (!uri) {
    throw new Error('[KOOPLE DB] MongoDB URI is required to connect to the database');
  }

  attachEventListeners();

  try {
    const conn = await mongoose.connect(uri);
    return conn;
  } catch (error) {
    console.error('[KOOPLE DB] Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
  } catch (error) {
    console.error('[KOOPLE DB] Error while disconnecting from MongoDB:', error.message);
    throw error;
  }
}

export function isDBConnected() {
  return mongoose.connection.readyState === 1;
}
