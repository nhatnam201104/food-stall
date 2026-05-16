import 'dotenv/config';
import { createServer } from 'http';
import { config } from './config';
import createApp from './app';
import { prisma } from './config/database';
import { initSocketServer } from './config/socket';

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    const app = createApp();
    const httpServer = createServer(app);
    initSocketServer(httpServer);

    const server = httpServer.listen(config.port, config.host, () => {
      console.log('\n========================================');
      console.log(`🚀  Server is running!`);
      console.log(`📦  Environment : ${config.env}`);
      console.log(`🧭  Host        : ${config.host}`);
      console.log(`🌐  Port        : ${config.port}`);
      console.log(`🔗  API Base    : ${config.publicApiBaseUrl}/api/v1`);
      console.log(`❤️  Health      : ${config.publicApiBaseUrl}/health`);
      console.log('========================================\n');
    });

    // ─── Graceful shutdown ────────────────────────────────────────────────────
    const shutdown = async (signal: string) => {
      console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('✅ Database disconnected');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

startServer();
