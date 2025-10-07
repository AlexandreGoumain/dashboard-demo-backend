import { Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { ProductService } from "../services/productService";
import { AuthRequest } from "../types";

const productService = new ProductService();

export const getProducts = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const { products, pagination } = await productService.getProducts(
            req.query
        );

        res.json({
            success: true,
            data: products,
            pagination,
        });
    }
);

export const getProductById = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const product = await productService.getProductById(req.params.id);

        res.json({
            success: true,
            data: product,
        });
    }
);

export const createProduct = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const product = await productService.createProduct(
            req.body,
            req.user!.id
        );

        res.status(201).json({
            success: true,
            data: product,
            message: "Product created successfully",
        });
    }
);

export const updateProduct = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const product = await productService.updateProduct(
            req.params.id,
            req.body
        );

        res.json({
            success: true,
            data: product,
            message: "Product updated successfully",
        });
    }
);

export const deleteProduct = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const result = await productService.deleteProduct(req.params.id);

        res.json({
            success: true,
            message: result.message,
        });
    }
);

export const getCategories = asyncHandler(
    async (_req: AuthRequest, res: Response) => {
        const categories = await productService.getCategories();

        res.json({
            success: true,
            data: categories,
        });
    }
);

export const createCategory = asyncHandler(
    async (req: AuthRequest, res: Response) => {
        const category = await productService.createCategory(
            req.body.name,
            req.body.slug
        );

        res.status(201).json({
            success: true,
            data: category,
            message: "Category created successfully",
        });
    }
);
