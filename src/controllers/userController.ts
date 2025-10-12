import { Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { UserService } from "../services/userService";
import { AuthRequest } from "../types";
import { AppError } from "../middleware/errorHandler";

const userService = new UserService();

export const getUsers = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { users, pagination } = await userService.getUsers(req.query);

        res.json({
            success: true,
            data: users,
            pagination,
        });
    }
);

export const getUserById = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const user = await userService.getUserById(req.params.id);

        res.json({
            success: true,
            data: user,
        });
    }
);

export const createUser = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const actorRole = req.user?.role;

        // Enforce creation rules:
        // - ADMIN can only create USER accounts
        // - SUPER can create ADMIN or USER (SUPER creation is not allowed via API)
        if (actorRole === "ADMIN") {
            if (req.body.role && req.body.role !== "USER") {
                throw new AppError(403, "Admins can only create USER accounts");
            }
            req.body.role = "USER";
        }

        if (actorRole === "SUPER") {
            if (req.body.role === "SUPER") {
                throw new AppError(403, "Creating SUPER accounts is not allowed");
            }
            // Default to USER if not provided
            if (!req.body.role) {
                req.body.role = "USER";
            }
        }

        const user = await userService.createUser(req.body);

        res.status(201).json({
            success: true,
            data: user,
            message: "User created successfully",
        });
    }
);

export const updateUser = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const actorRole = req.user?.role;

        // Enforce role update rules:
        // - ADMIN cannot set role to ADMIN or SUPER
        if (actorRole === "ADMIN" && typeof req.body.role !== "undefined") {
            if (req.body.role !== "USER") {
                throw new AppError(403, "Admins cannot assign ADMIN or SUPER roles");
            }
        }

        const user = await userService.updateUser(req.params.id, req.body);

        res.json({
            success: true,
            data: user,
            message: "User updated successfully",
        });
    }
);

export const deleteUser = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const result = await userService.deleteUser(req.params.id);

        res.json({
            success: true,
            message: result.message,
        });
    }
);

export const getUserStats = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const stats = await userService.getUserStats(req.params.id);

        res.json({
            success: true,
            data: stats,
        });
    }
);
