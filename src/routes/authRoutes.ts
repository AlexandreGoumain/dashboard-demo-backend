import { Router } from "express";
import { getMe, login, logout, register } from "../controllers/authController";
import { authenticate, authorize } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validation";
import { loginSchema, registerSchema } from "../utils/validators";

const router = Router();

// Restrict registration to SUPER users only.
// Regular user creation should go through /api/users (ADMIN or SUPER).
router.post(
    "/register",
    authenticate,
    authorize("SUPER"),
    authLimiter,
    validate(registerSchema),
    register
);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
