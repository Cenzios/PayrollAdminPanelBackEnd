// Load .env before any module reads process.env at import time (jwt config, CORS allowlist)
import 'dotenv/config';
import app from './app';
import prisma from './config/db';

const PORT = Number(process.env.PORT);
const HOST = '0.0.0.0';

const startServer = async () => {
  console.log('🎬 Starting server initialization...');

  // 1. Validate Environment Variables
  if (!PORT) {
    console.error('❌ CRITICAL ERROR: PORT is not defined in environment variables.');
    process.exit(1);
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ CRITICAL ERROR: DATABASE_URL is not defined in environment variables.');
    process.exit(1);
  }

  try {
    // 2. Connect to Database
    console.log('⏳ Connecting to database...');
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    // 3. Start Express Server
    const server = app.listen(PORT, HOST, () => {
      console.log('--------------------------------------------------');
      console.log(`🚀 BACKEND SERVER IS LIVE`);
      console.log(`📡 Internal URL: http://${HOST}:${PORT}`);
      console.log(`🩺 Health Check: http://${HOST}:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log('--------------------------------------------------');
    });

    server.on('error', (error: any) => {
      console.error('❌ Server failed to start:', error);
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ CRITICAL STARTUP ERROR:', error);
    // Exit with 1 so Docker/Dokploy knows it failed
    process.exit(1);
  }
};

process.on('SIGINT', async () => {
  console.log('\n⚠️  Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️  Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
