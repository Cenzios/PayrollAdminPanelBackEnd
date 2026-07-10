"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
dotenv_1.default.config();
const PORT = Number(process.env.PORT);
const HOST = '0.0.0.0';
const startServer = async () => {
    console.log('🎬 Starting server initialization...');
    if (!PORT) {
        console.error('❌ CRITICAL ERROR: PORT is not defined in environment variables.');
        process.exit(1);
    }
    if (!process.env.DATABASE_URL) {
        console.error('❌ CRITICAL ERROR: DATABASE_URL is not defined in environment variables.');
        process.exit(1);
    }
    try {
        console.log('⏳ Connecting to database...');
        await db_1.default.$connect();
        console.log('✅ Database connected successfully');
        const server = app_1.default.listen(PORT, HOST, () => {
            console.log('--------------------------------------------------');
            console.log(`🚀 BACKEND SERVER IS LIVE`);
            console.log(`📡 Internal URL: http://${HOST}:${PORT}`);
            console.log(`🩺 Health Check: http://${HOST}:${PORT}/health`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log('--------------------------------------------------');
        });
        server.on('error', (error) => {
            console.error('❌ Server failed to start:', error);
            process.exit(1);
        });
    }
    catch (error) {
        console.error('❌ CRITICAL STARTUP ERROR:', error);
        process.exit(1);
    }
};
process.on('SIGINT', async () => {
    console.log('\n⚠️  Shutting down gracefully...');
    await db_1.default.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n⚠️  Shutting down gracefully...');
    await db_1.default.$disconnect();
    process.exit(0);
});
startServer();
//# sourceMappingURL=server.js.map