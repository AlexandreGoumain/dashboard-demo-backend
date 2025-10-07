import app from "./app";
import prisma from "./config/database";
import { env } from "./config/env";

const PORT = env.server.port;

const server = app.listen(PORT, () => {
    console.log("");
    console.log("🚀 Dashboard Backend Server");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${env.server.env}`);
    console.log(`🔗 Base URL: http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log("📍 Available endpoints:");
    console.log("   POST   /api/auth/register");
    console.log("   POST   /api/auth/login");
    console.log("   POST   /api/auth/logout");
    console.log("   GET    /api/auth/me");
    console.log("   GET    /api/users");
    console.log("   GET    /api/products");
    console.log("   GET    /api/analytics/stats");
    console.log("   GET    /api/analytics/sales");
    console.log("   GET    /api/analytics/categories");
    console.log("");
});

// Graceful shutdown
const gracefulShutdown = async () => {
    console.log("\n🔄 Shutting down gracefully...");

    server.close(async () => {
        console.log("✅ Server closed");

        await prisma.$disconnect();
        console.log("✅ Database disconnected");

        process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
        console.error("⚠️  Forced shutdown");
        process.exit(1);
    }, 10000);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Handle uncaught errors
process.on("unhandledRejection", (err: Error) => {
    console.error("❌ Unhandled Rejection:", err);
    gracefulShutdown();
});

process.on("uncaughtException", (err: Error) => {
    console.error("❌ Uncaught Exception:", err);
    gracefulShutdown();
});
