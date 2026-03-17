import 'dotenv/config';
import { config } from './config';
import createApp from './app';
import { prisma } from './config/database';

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');

    const app = createApp();

    const server = app.listen(config.port, () => {
      console.log('\n========================================');
      console.log(`🚀  Server is running!`);
      console.log(`📦  Environment : ${config.env}`);
      console.log(`🌐  Port        : ${config.port}`);
      console.log(`🔗  API Base    : http://localhost:${config.port}/api/v1`);
      console.log(`❤️  Health      : http://localhost:${config.port}/health`);
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
