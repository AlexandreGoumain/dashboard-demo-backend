import { Router } from 'express';
import {
  createReview,
  deleteReview,
  getProductRatingStats,
  getReviewById,
  getReviews,
  updateReviewStatus,
} from '../controllers/reviewController';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  createReviewSchema,
  updateReviewStatusSchema,
} from '../utils/shopValidators';

const router = Router();

// Public routes (get approved reviews only)
router.get('/', getReviews);
router.get('/:id', getReviewById);
router.get('/stats/:productId', getProductRatingStats);

// Authenticated user routes
router.post('/', authenticate, validate(createReviewSchema), createReview);
router.delete('/:id', authenticate, deleteReview);

// Admin only routes
router.patch('/:id/status', authenticate, authorize('ADMIN'), validate(updateReviewStatusSchema), updateReviewStatus);

export default router;
