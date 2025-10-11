import { Router } from 'express';
import {
  cancelOrder,
  createOrder,
  getOrderById,
  getOrders,
  updateOrderStatus,
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createOrderSchema,
  updateOrderStatusSchema,
} from '../utils/shopValidators';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// User routes (authenticated users can access their own orders)
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.post('/', validate(createOrderSchema), createOrder);
router.post('/:id/cancel', cancelOrder);

// Admin only routes
router.patch('/:id/status', authorize('ADMIN'), validate(updateOrderStatusSchema), updateOrderStatus);

export default router;
