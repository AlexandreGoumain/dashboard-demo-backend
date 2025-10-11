import { Response } from 'express';
import { OrderStatus } from '@prisma/client';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import orderService from '../services/orderService';
import { AuthRequest } from '../types';
import { parseNumberParam, parseOrderParam, parseStringParam } from '../utils/query';

const requireUser = (req: AuthRequest) => {
  if (!req.user) {
    throw new AppError(401, 'Authentication required');
  }
  return req.user;
};

export const createOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const order = await orderService.createOrder(req.body, user.id);
  res.status(201).json({ success: true, data: order });
});

export const getOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const isAdmin = user.role === 'ADMIN';
  const statusParam = parseStringParam(req.query.status);
  const status = statusParam && Object.values(OrderStatus).includes(statusParam as OrderStatus)
    ? (statusParam as OrderStatus)
    : undefined;

  const result = await orderService.getOrders({
    page: parseNumberParam(req.query.page),
    limit: parseNumberParam(req.query.limit),
    search: parseStringParam(req.query.search),
    sortBy: parseStringParam(req.query.sortBy),
    order: parseOrderParam(req.query.order),
    status,
    customerId: isAdmin ? parseStringParam(req.query.customerId) : undefined,
  }, user.id, isAdmin);
  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
});

export const getOrderById = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const isAdmin = user.role === 'ADMIN';
  const order = await orderService.getOrderById(req.params.id, user.id, isAdmin);
  res.json({ success: true, data: order });
});

export const updateOrderStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const isAdmin = user.role === 'ADMIN';
  const order = await orderService.updateOrderStatus(req.params.id, req.body.status, isAdmin);
  res.json({ success: true, data: order });
});

export const cancelOrder = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = requireUser(req);
  const isAdmin = user.role === 'ADMIN';
  const order = await orderService.cancelOrder(req.params.id, user.id, isAdmin);
  res.json({ success: true, data: order });
});
