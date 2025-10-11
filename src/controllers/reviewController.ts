import { Response } from 'express';
import { ReviewStatus } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import reviewService from '../services/reviewService';
import { AuthRequest } from '../types';
import { parseNumberParam, parseOrderParam, parseStringParam } from '../utils/query';

const requireUser = (req: AuthRequest) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }
  return req.user;
};

export const createReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const review = await reviewService.createReview(req.body, user.id);
  res.status(201).json({ success: true, data: review });
});

export const getReviews = asyncHandler(async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user?.role === 'ADMIN';
  const statusParam = parseStringParam(req.query.status);
  const status = statusParam && Object.values(ReviewStatus).includes(statusParam as ReviewStatus)
    ? (statusParam as ReviewStatus)
    : undefined;

  const result = await reviewService.getReviews({
    page: parseNumberParam(req.query.page),
    limit: parseNumberParam(req.query.limit),
    search: parseStringParam(req.query.search),
    sortBy: parseStringParam(req.query.sortBy),
    order: parseOrderParam(req.query.order),
    productId: parseStringParam(req.query.productId),
    status,
    rating: parseNumberParam(req.query.rating),
  }, isAdmin);
  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

export const getReviewById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user?.role === 'ADMIN';
  const review = await reviewService.getReviewById(req.params.id, isAdmin);
  res.json({ success: true, data: review });
});

export const updateReviewStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const isAdmin = user.role === 'ADMIN';
  const review = await reviewService.updateReviewStatus(req.params.id, req.body.status, isAdmin);
  res.json({ success: true, data: review });
});

export const deleteReview = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const isAdmin = user.role === 'ADMIN';
  const result = await reviewService.deleteReview(req.params.id, user.id, isAdmin);
  res.json({ success: true, message: result.message });
});

export const getProductRatingStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await reviewService.getProductRatingStats(req.params.productId);
  res.json({ success: true, data: stats });
});
