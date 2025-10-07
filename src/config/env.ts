import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
    DATABASE_URL: z.string().url(),
    PORT: z.string().default("5000"),
    NODE_ENV: z
        .enum(["development", "production", "test"])
        .default("development"),
    JWT_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default("7d"),
    FRONTEND_URL: z.string().url(),
    MAX_FILE_SIZE: z.string().default("5242880"),
    UPLOAD_PATH: z.string().default("./uploads"),
    RATE_LIMIT_WINDOW_MS: z.string().default("900000"),
    RATE_LIMIT_MAX_REQUESTS: z.string().default("100"),
});

const envParse = envSchema.safeParse(process.env);

if (!envParse.success) {
    console.error("❌ Invalid environment variables:", envParse.error.format());
    process.exit(1);
}

export const env = {
    database: {
        url: envParse.data.DATABASE_URL,
    },
    server: {
        port: parseInt(envParse.data.PORT, 10),
        env: envParse.data.NODE_ENV,
    },
    jwt: {
        secret: envParse.data.JWT_SECRET,
        expiresIn: envParse.data.JWT_EXPIRES_IN,
    },
    cors: {
        origins: envParse.data.FRONTEND_URL.split(",").map((origin) =>
            origin.trim()
        ),
    },
    upload: {
        maxSize: parseInt(envParse.data.MAX_FILE_SIZE, 10),
        path: envParse.data.UPLOAD_PATH,
    },
    rateLimit: {
        windowMs: parseInt(envParse.data.RATE_LIMIT_WINDOW_MS, 10),
        max: parseInt(envParse.data.RATE_LIMIT_MAX_REQUESTS, 10),
    },
};
