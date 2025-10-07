import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public details?: any
    ) {
        super(message);
        this.name = "AppError";
    }
}

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
) => {
    console.error("Error:", err);

    // Zod validation errors
    if (err instanceof ZodError) {
        return res.status(400).json({
            success: false,
            error: "Validation error",
            details: err.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
            })),
        });
    }

    // Custom app errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: err.message,
            details: err.details,
        });
    }

    // Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // Unique constraint violation
        if (err.code === "P2002") {
            return res.status(409).json({
                success: false,
                error: "Resource already exists",
                details: `${err.meta?.target} must be unique`,
            });
        }

        // Record not found
        if (err.code === "P2025") {
            return res.status(404).json({
                success: false,
                error: "Resource not found",
            });
        }

        // Foreign key constraint violation
        if (err.code === "P2003") {
            return res.status(400).json({
                success: false,
                error: "Invalid reference",
                details: "Referenced resource does not exist",
            });
        }
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
        return res.status(401).json({
            success: false,
            error: "Invalid token",
        });
    }

    if (err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            error: "Token expired",
        });
    }

    // Default error
    return res.status(500).json({
        success: false,
        error: "Internal server error",
        ...(process.env.NODE_ENV === "development" && { details: err.message }),
    });
};

export const asyncHandler = (
    fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
