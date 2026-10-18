import app from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

let server;

async function startServer() {
  try {
    // Connect to database
    await connectDB();

    // Start HTTP server
    server = app.listen(env.PORT, () => {
      console.log(`[KOOPLE Server] Started successfully in ${env.NODE_ENV} mode`);
      console.log(`[KOOPLE Server] Listening on http://localhost:${env.PORT}`);
    });
  } catch (error) {
    console.error('[KOOPLE Server] Failed to start server:', error.message);
    process.exit(1);
  }
}

// Graceful shutdown handling
async function gracefulShutdown(signal) {
  console.log(`\n[KOOPLE Server] Received ${signal}. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      console.log('[KOOPLE Server] HTTP server closed.');
      try {
        await disconnectDB();
        console.log('[KOOPLE Server] Database connection closed.');
        process.exit(0);
      } catch (err) {
        console.error('[KOOPLE Server] Error during database disconnect:', err.message);
        process.exit(1);
      }
    });

    // Force close after 10 seconds if not closed
    setTimeout(() => {
      console.error('[KOOPLE Server] Shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

startServer();

export { app, server };
