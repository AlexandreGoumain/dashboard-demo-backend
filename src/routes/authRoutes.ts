import { Router } from "express";
import { getMe, login, logout, register } from "../controllers/authController";
import { authenticate } from "../middleware/auth";
import { authLimiter } from "../middleware/rateLimiter";
import { validate } from "../middleware/validation";
import { loginSchema, registerSchema } from "../utils/validators";

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);

export default router;
