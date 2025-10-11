import { Router } from "express";
import {
    createCategory,
    createProduct,
    deleteProduct,
    getCategories,
    getProductById,
    getProducts,
    updateProduct,
} from "../controllers/productController";
import { authenticate, authorize } from "../middleware/auth";
import { validate } from "../middleware/validation";
import {
    createCategorySchema,
    createProductSchema,
    updateProductSchema,
} from "../utils/validators";

const router = Router();

// All product routes require authentication
router.use(authenticate);

// Product routes
router.get("/", getProducts);
router.get("/categories/all", getCategories);
router.get("/:id", getProductById);
router.post("/", validate(createProductSchema), createProduct);
router.put("/:id", validate(updateProductSchema), updateProduct);
router.delete("/:id", deleteProduct);

// Category routes
router.post(
    "/categories",
    authorize("ADMIN"),
    validate(createCategorySchema),
    createCategory
);

export default router;
