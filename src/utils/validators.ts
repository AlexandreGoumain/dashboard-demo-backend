import { z } from "zod";

// Auth validators
export const registerSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    name: z.string().min(2, "Name must be at least 2 characters"),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

// User validators
export const createUserSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    role: z.enum(["SUPER", "ADMIN", "USER"]).optional(),
    avatar: z.string().url().optional(),
});

export const updateUserSchema = z.object({
    email: z.string().email("Invalid email format").optional(),
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    role: z.enum(["SUPER", "ADMIN", "USER"]).optional(),
    avatar: z.string().url().optional(),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .optional(),
});

// Product validators
export const createProductSchema = z.object({
    name: z.string().min(2, "Product name must be at least 2 characters"),
    description: z.string().optional(),
    price: z.number().positive("Price must be positive"),
    cost: z.number().positive("Cost must be positive"),
    stock: z.number().int().nonnegative("Stock must be a non-negative integer"),
    categoryId: z.string().uuid("Invalid category ID"),
    image: z.string().url().optional(),
    sku: z.string().min(1, "SKU is required"),
    status: z.enum(["ACTIVE", "INACTIVE", "OUT_OF_STOCK"]).optional(),
});

export const updateProductSchema = z.object({
    name: z
        .string()
        .min(2, "Product name must be at least 2 characters")
        .optional(),
    description: z.string().optional(),
    price: z.number().positive("Price must be positive").optional(),
    cost: z.number().positive("Cost must be positive").optional(),
    stock: z
        .number()
        .int()
        .nonnegative("Stock must be a non-negative integer")
        .optional(),
    categoryId: z.string().uuid("Invalid category ID").optional(),
    image: z.string().url().optional(),
    sku: z.string().optional(),
    status: z.enum(["ACTIVE", "INACTIVE", "OUT_OF_STOCK"]).optional(),
});

// Category validators
export const createCategorySchema = z.object({
    name: z.string().min(2, "Category name must be at least 2 characters"),
    slug: z.string().min(2, "Slug must be at least 2 characters"),
});
