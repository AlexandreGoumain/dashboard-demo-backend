import { Role } from "@prisma/client";
import { Request } from "express";

// Extend Express Request to include user
export interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: Role;
    };
}

// API Response types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
    details?: any;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Auth types
export interface RegisterInput {
    email: string;
    password: string;
    name: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface JwtPayload {
    id: string;
    email: string;
    role: Role;
}

// User types
export interface CreateUserInput {
    email: string;
    password: string;
    name: string;
    role?: Role;
    avatar?: string;
}

export interface UpdateUserInput {
    email?: string;
    name?: string;
    role?: Role;
    avatar?: string;
    password?: string;
}

// Product types
export interface CreateProductInput {
    name: string;
    description?: string;
    price: number;
    cost: number;
    stock: number;
    categoryId: string;
    image?: string;
    sku?: string;
}

export interface UpdateProductInput {
    name?: string;
    description?: string;
    price?: number;
    cost?: number;
    stock?: number;
    categoryId?: string;
    image?: string;
    sku?: string;
    status?: string;
}

// Query types
export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: "asc" | "desc";
    search?: string;
}

export interface ProductFilters extends PaginationQuery {
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    status?: string;
}

// Analytics types
export interface DashboardStats {
    totalUsers: number;
    totalProducts: number;
    totalRevenue: number;
    totalSales: number;
    userGrowth: number;
    productGrowth: number;
    revenueGrowth: number;
    salesGrowth: number;
}

export interface SalesData {
    month: string;
    revenue: number;
    sales: number;
}

export interface CategoryData {
    name: string;
    value: number;
    products: number;
}

export interface TopProduct {
    id: string;
    name: string;
    totalSales: number;
    totalRevenue: number;
    stock: number;
}
