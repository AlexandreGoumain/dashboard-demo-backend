import cookieParser from "cookie-parser";
import cors, { type CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { generalLimiter } from "./middleware/rateLimiter";

// Import routes
import analyticsRoutes from "./routes/analyticsRoutes";
import authRoutes from "./routes/authRoutes";
import productRoutes from "./routes/productRoutes";
import userRoutes from "./routes/userRoutes";

// Import shop routes
import categoryRoutes from "./routes/categoryRoutes";
import orderRoutes from "./routes/orderRoutes";
import reviewRoutes from "./routes/reviewRoutes";
import shopProductRoutes from "./routes/shopProductRoutes";

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions: CorsOptions = {
    origin: (origin, callback) => {
        if (
            !origin ||
            env.cors.origins.includes("*") ||
            env.cors.origins.includes(origin)
        ) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Logging middleware
if (env.server.env === "development") {
    app.use(morgan("dev"));
} else {
    app.use(morgan("combined"));
}

// Rate limiting
app.use("/api", generalLimiter);

// Health check endpoint
app.get("/health", (_req, res) => {
    res.json({
        success: true,
        message: "Server is running",
        timestamp: new Date().toISOString(),
    });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/analytics", analyticsRoutes);

// Shop API routes
app.use("/api/shop/categories", categoryRoutes);
app.use("/api/shop/products", shopProductRoutes);
app.use("/api/shop/orders", orderRoutes);
app.use("/api/shop/reviews", reviewRoutes);

// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: "Route not found",
    });
});

// Error handler (must be last)
app.use(errorHandler);

export default app;
