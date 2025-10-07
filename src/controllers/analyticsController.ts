import { Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { AnalyticsService } from "../services/analyticsService";
import { AuthRequest } from "../types";

const analyticsService = new AnalyticsService();

export const getDashboardStats = asyncHandler(
    async (_req: AuthRequest, res: Response) => {
        const stats = await analyticsService.getDashboardStats();

        res.json({
            success: true,
            data: stats,
        });
    }
);

export const getSalesData = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const months = parseInt(req.query.months as string) || 12;
        const salesData = await analyticsService.getSalesData(months);

        res.json({
            success: true,
            data: salesData,
        });
    }
);

export const getCategoryData = asyncHandler(
    async (_req: AuthRequest, res: Response) => {
        const categoryData = await analyticsService.getCategoryData();

        res.json({
            success: true,
            data: categoryData,
        });
    }
);

export const getTopProducts = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const limit = parseInt(req.query.limit as string) || 10;
        const topProducts = await analyticsService.getTopProducts(limit);

        res.json({
            success: true,
            data: topProducts,
        });
    }
);

export const getRecentActivity = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const limit = parseInt(req.query.limit as string) || 10;
        const activity = await analyticsService.getRecentActivity(limit);

        res.json({
            success: true,
            data: activity,
        });
    }
);
