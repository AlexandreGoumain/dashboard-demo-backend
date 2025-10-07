import { Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { AuthService } from "../services/authService";
import { AuthRequest } from "../types";

const authService = new AuthService();

export const register = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { user, token } = await authService.register(req.body);

        // Set token in httpOnly cookie
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.status(201).json({
            success: true,
            data: { user, token },
            message: "User registered successfully",
        });
    }
);

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { user, token } = await authService.login(req.body);

    // Set token in httpOnly cookie
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
        success: true,
        data: { user, token },
        message: "Login successful",
    });
});

export const logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
    res.clearCookie("token");

    res.json({
        success: true,
        message: "Logout successful",
    });
});

export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await authService.getProfile(req.user!.id);

    res.json({
        success: true,
        data: user,
    });
});
