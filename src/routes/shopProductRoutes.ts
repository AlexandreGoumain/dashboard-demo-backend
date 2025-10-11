import { Router } from 'express';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
} from '../controllers/shopProductController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createShopProductSchema,
  updateShopProductSchema,
} from '../utils/shopValidators';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/:id', getProductById);

// Admin only routes
router.post('/', authenticate, authorize('ADMIN'), validate(createShopProductSchema), createProduct);
router.put('/:id', authenticate, authorize('ADMIN'), validate(updateShopProductSchema), updateProduct);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteProduct);

export default router;
