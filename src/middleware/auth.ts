import { Role } from "@prisma/client";
import { NextFunction, Response } from "express";
import { AuthRequest } from "../types";
import { verifyToken } from "../utils/jwt";
import { AppError } from "./errorHandler";

export const authenticate = (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
) => {
    try {
        // Get token from cookie or Authorization header
        const token =
            req.cookies?.token ||
            req.headers.authorization?.replace("Bearer ", "");

        if (!token) {
            throw new AppError(401, "Authentication required");
        }

        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (error) {
        next(error);
    }
};

export const authorize = (...roles: Role[]) => {
    return (req: AuthRequest, _res: Response, next: NextFunction) => {
        if (!req.user) {
            return next(new AppError(401, "Authentication required"));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AppError(403, "Insufficient permissions"));
        }

        next();
    };
};
