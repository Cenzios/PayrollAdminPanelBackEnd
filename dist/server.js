"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const app_1 = __importDefault(require("./app"));
const db_1 = __importDefault(require("./config/db"));
dotenv_1.default.config();
const PORT = Number(process.env.PORT) || 6092;
const HOST = '0.0.0.0';
const startServer = async () => {
    try {
        await db_1.default.$connect();
        console.log('✅ Database connected successfully');
        app_1.default.listen(PORT, HOST, () => {
            console.log(`🚀 Server is running on http://${HOST}:${PORT}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`📍 Health check: http://${HOST}:${PORT}/health`);
            console.log(`📡 Public access: admin.server.payroll.cenzios.com`);
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
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