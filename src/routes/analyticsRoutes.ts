import { Router } from "express";
import {
    getCategoryData,
    getDashboardStats,
    getRecentActivity,
    getSalesData,
    getTopProducts,
} from "../controllers/analyticsController";
import { authenticate } from "../middleware/auth";

const router = Router();

// All analytics routes require authentication
router.use(authenticate);

router.get("/stats", getDashboardStats);
router.get("/sales", getSalesData);
router.get("/categories", getCategoryData);
router.get("/top-products", getTopProducts);
router.get("/activity", getRecentActivity);

export default router;
