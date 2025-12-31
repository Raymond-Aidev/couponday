import { buildApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './database/prisma.js';

async function main() {
  const app = await buildApp();

  // Connect to database
  await connectDatabase();

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.warn(`\nReceived ${signal}, shutting down gracefully...`);
      await app.close();
      await disconnectDatabase();
      process.exit(0);
    });
  });

  // Start server
  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    console.warn(`
    🚀 CouponDay API Server is running!

    - Local:   http://localhost:${env.PORT}
    - API:     http://localhost:${env.PORT}/api/${env.API_VERSION}
    - Docs:    http://localhost:${env.PORT}/docs
    - Health:  http://localhost:${env.PORT}/health

    Environment: ${env.NODE_ENV}
    `);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

main();
