import { Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { UserService } from "../services/userService";
import { AuthRequest } from "../types";

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
