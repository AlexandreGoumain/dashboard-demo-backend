import { Router } from "express";
import { getSuperInstances } from "../controllers/instanceController";
import { authenticate, authorize } from "../middleware/auth";

const router = Router();

router.use(authenticate);
router.get("/super", authorize("SUPER"), getSuperInstances);

export default router;

