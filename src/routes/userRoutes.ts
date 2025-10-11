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

// Get all users (Admin and Super)
router.get("/", authorize("ADMIN", "SUPER"), getUsers);

// Get user by ID
router.get("/:id", getUserById);

// Get user stats
router.get("/:id/stats", getUserStats);

// Create user (Admin and Super)
router.post("/", authorize("ADMIN", "SUPER"), validate(createUserSchema), createUser);

// Update user (Admin and Super)
router.put("/:id", authorize("ADMIN", "SUPER"), validate(updateUserSchema), updateUser);

// Delete user (Admin and Super)
router.delete("/:id", authorize("ADMIN", "SUPER"), deleteUser);

export default router;
