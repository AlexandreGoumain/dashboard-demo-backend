import { Prisma, ProductStatus } from "@prisma/client";
import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";
import {
    CreateProductInput,
    ProductFilters,
    UpdateProductInput,
} from "../types";

export class ProductService {
    async getProducts(query: ProductFilters) {
        const page = query.page || 1;
        const limit = query.limit || 10;
        const skip = (page - 1) * limit;
        const sortBy = query.sortBy || "createdAt";
        const order = query.order || "desc";
        const search = query.search || "";

        // Build where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
            ];
        }

        if (query.categoryId) {
            where.categoryId = query.categoryId;
        }

        if (query.status) {
            where.status = query.status;
        }

        if (query.minPrice || query.maxPrice) {
            where.price = {};
            if (query.minPrice) where.price.gte = query.minPrice;
            if (query.maxPrice) where.price.lte = query.maxPrice;
        }

        // Get total count
        const total = await prisma.product.count({ where });

        // Get products
        const products = await prisma.product.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: order },
            include: {
                category: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                _count: {
                    select: { sales: true },
                },
            },
        });

        // Calculate margin for each product
        const productsWithMargin = products.map((product) => ({
            ...product,
            margin: product.price - product.cost,
            marginPercentage:
                ((product.price - product.cost) / product.cost) * 100,
        }));

        return {
            products: productsWithMargin,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getProductById(id: string) {
        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                sales: {
                    orderBy: { saleDate: "desc" },
                    take: 10,
                },
                _count: {
                    select: { sales: true },
                },
            },
        });

        if (!product) {
            throw new AppError(404, "Product not found");
        }

        // Calculate total sales
        const totalSales = await prisma.sale.aggregate({
            where: { productId: id },
            _sum: {
                quantity: true,
                totalPrice: true,
            },
        });

        return {
            ...product,
            margin: product.price - product.cost,
            marginPercentage:
                ((product.price - product.cost) / product.cost) * 100,
            totalSales: totalSales._sum.quantity || 0,
            totalRevenue: totalSales._sum.totalPrice || 0,
        };
    }

    async createProduct(data: CreateProductInput, userId: string) {
        // Check if category exists
        const category = await prisma.category.findUnique({
            where: { id: data.categoryId },
        });

        if (!category) {
            throw new AppError(404, "Category not found");
        }

        // Check SKU uniqueness if provided
        if (data.sku) {
            const existingSku = await prisma.product.findUnique({
                where: { sku: data.sku },
            });

            if (existingSku) {
                throw new AppError(409, "Product with this SKU already exists");
            }
        }

        // Create product
        const product = await prisma.product.create({
            data: {
                ...data,
                userId,
            },
            include: {
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return product;
    }

    async updateProduct(id: string, data: UpdateProductInput) {
        // Check if product exists
        const existingProduct = await prisma.product.findUnique({
            where: { id },
        });

        if (!existingProduct) {
            throw new AppError(404, "Product not found");
        }

        // Check category if updating
        if (data.categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: data.categoryId },
            });

            if (!category) {
                throw new AppError(404, "Category not found");
            }
        }

        // Check SKU uniqueness if updating
        if (data.sku && data.sku !== existingProduct.sku) {
            const existingSku = await prisma.product.findUnique({
                where: { sku: data.sku },
            });

            if (existingSku) {
                throw new AppError(409, "Product with this SKU already exists");
            }
        }

        // Auto-update status based on stock
        if (data.stock !== undefined) {
            if (data.stock === 0) {
                data.status = ProductStatus.OUT_OF_STOCK;
            } else if (existingProduct.status === ProductStatus.OUT_OF_STOCK) {
                data.status = ProductStatus.ACTIVE;
            }
        }

        // Update product
        const { categoryId, ...rest } = data;
        const updateData: Prisma.ProductUpdateInput = {
            ...rest,
        };

        if (categoryId) {
            updateData.category = { connect: { id: categoryId } };
        }

        const product = await prisma.product.update({
            where: { id },
            data: updateData,
            include: {
                category: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return product;
    }

    async deleteProduct(id: string) {
        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id },
        });

        if (!product) {
            throw new AppError(404, "Product not found");
        }

        // Delete product (cascade will handle sales)
        await prisma.product.delete({
            where: { id },
        });

        return { message: "Product deleted successfully" };
    }

    async getCategories() {
        const categories = await prisma.category.findMany({
            include: {
                _count: {
                    select: { products: true },
                },
            },
            orderBy: { name: "asc" },
        });

        return categories;
    }

    async createCategory(name: string, slug: string) {
        const category = await prisma.category.create({
            data: { name, slug },
        });

        return category;
    }
}
