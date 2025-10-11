import { Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import categoryService from '../services/categoryService';
import { AuthRequest } from '../types';
import { parseNumberParam, parseOrderParam, parseStringParam } from '../utils/query';

export const createCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await categoryService.createCategory(req.body);
  res.status(201).json({ success: true, data: category });
});

export const getCategories = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await categoryService.getCategories({
    page: parseNumberParam(req.query.page),
    limit: parseNumberParam(req.query.limit),
    search: parseStringParam(req.query.search),
    sortBy: parseStringParam(req.query.sortBy),
    order: parseOrderParam(req.query.order),
  });
  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

export const getCategoryById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await categoryService.getCategoryById(req.params.id);
  res.json({ success: true, data: category });
});

export const updateCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const category = await categoryService.updateCategory(req.params.id, req.body);
  res.json({ success: true, data: category });
});

export const deleteCategory = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await categoryService.deleteCategory(req.params.id);
  res.json({ success: true, message: result.message });
});
