import { Router } from 'express';
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategoryById,
  updateCategory,
} from '../controllers/categoryController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createCategorySchema,
  updateCategorySchema,
} from '../utils/shopValidators';

const router = Router();

// Public routes (no auth required)
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Admin only routes
router.post('/', authenticate, authorize('ADMIN'), validate(createCategorySchema), createCategory);
router.put('/:id', authenticate, authorize('ADMIN'), validate(updateCategorySchema), updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteCategory);

export default router;
