import { Prisma, ProductStatus } from "@prisma/client";
import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";
import {
    CreateProductInput,
    ProductFilters,
    UpdateProductInput,
} from "../types";

function toNumber(value: unknown): number | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export class ProductService {
    async getProducts(query: ProductFilters) {
        const parsedPage = toNumber(query.page);
        const parsedLimit = toNumber(query.limit);
        const page = parsedPage && parsedPage > 0 ? Math.floor(parsedPage) : 1;
        const limit =
            parsedLimit && parsedLimit > 0 ? Math.floor(parsedLimit) : 10;
        const skip = (page - 1) * limit;
        const sortBy = query.sortBy || "createdAt";
        const order = query.order === "asc" ? "asc" : "desc";
        const search = query.search || "";
        const minPrice = toNumber(query.minPrice);
        const maxPrice = toNumber(query.maxPrice);

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

        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) where.price.gte = minPrice;
            if (maxPrice !== undefined) where.price.lte = maxPrice;
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
        // Validate category exists
        const category = await prisma.category.findUnique({
            where: { id: data.categoryId },
        });

        if (!category) {
            throw new AppError(404, "Category not found");
        }

        // Enforce SKU uniqueness
        const existingSku = await prisma.product.findUnique({
            where: { sku: data.sku },
        });
        if (existingSku) {
            throw new AppError(409, "Product with this SKU already exists");
        }

        // Generate slug from name
        const slug = data.name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();

        // Determine status (auto OUT_OF_STOCK if stock is 0)
        let status = data.status;
        if (data.stock === 0) {
            status = ProductStatus.OUT_OF_STOCK;
        }

        const { categoryId, image, ...rest } = data;

        const product = await prisma.product.create({
            data: {
                ...rest,
                slug,
                categoryId,
                userId,
                ...(status ? { status } : {}),
                ...(image ? { images: [image] } : {}),
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
                _count: {
                    select: { sales: true },
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

        // Map to align with frontend ProductCategory shape
        return categories.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            productsCount: c._count.products,
        }));
    }

    async createCategory(name: string, slug: string) {
        const category = await prisma.category.create({
            data: { name, slug },
        });

        return category;
    }
}
