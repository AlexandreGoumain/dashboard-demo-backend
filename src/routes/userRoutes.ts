import { Router } from "express";
import {
    createUser,
    deleteUser,
    getUserById,
    getUsers,
    getUserStats,
    updateUser,
} from "../controllers/userController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { createUserSchema, updateUserSchema } from "../utils/validators";

const router = Router();

// All user routes require authentication
router.use(authenticate);

// Get all users (Admin only)
router.get("/", authorize("ADMIN"), getUsers);

// Get user by ID
router.get("/:id", getUserById);

// Get user stats
router.get("/:id/stats", getUserStats);

// Create user (Admin only)
router.post("/", authorize("ADMIN"), validate(createUserSchema), createUser);

// Update user (Admin only)
router.put("/:id", authorize("ADMIN"), validate(updateUserSchema), updateUser);

// Delete user (Admin only)
router.delete("/:id", authorize("ADMIN"), deleteUser);

export default router;
