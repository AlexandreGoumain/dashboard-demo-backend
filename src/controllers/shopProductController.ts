import { Response } from 'express';
import { ProductStatus } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import shopProductService from '../services/shopProductService';
import { AuthRequest } from '../types';
import { parseBooleanParam, parseNumberParam, parseOrderParam, parseStringParam } from '../utils/query';

export const createProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const product = await shopProductService.createProduct(req.body, req.user.id);
  res.status(201).json({ success: true, data: product });
});

export const getProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const statusParam = parseStringParam(req.query.status);
  const status = statusParam && Object.values(ProductStatus).includes(statusParam as ProductStatus)
    ? (statusParam as ProductStatus)
    : undefined;

  const result = await shopProductService.getProducts({
    page: parseNumberParam(req.query.page),
    limit: parseNumberParam(req.query.limit),
    search: parseStringParam(req.query.search),
    sortBy: parseStringParam(req.query.sortBy),
    order: parseOrderParam(req.query.order),
    categoryId: parseStringParam(req.query.categoryId),
    status,
    minPrice: parseNumberParam(req.query.minPrice),
    maxPrice: parseNumberParam(req.query.maxPrice),
    featured: parseBooleanParam(req.query.featured),
  });
  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

export const getProductById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const product = await shopProductService.getProductById(req.params.id);
  res.json({ success: true, data: product });
});

export const updateProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const product = await shopProductService.updateProduct(req.params.id, req.body);
  res.json({ success: true, data: product });
});

export const deleteProduct = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }

  const result = await shopProductService.deleteProduct(req.params.id);
  res.json({ success: true, message: result.message });
});
