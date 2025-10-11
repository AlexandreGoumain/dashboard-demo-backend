import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ProductStatus } from '@prisma/client';

interface CreateShopProductData {
  name: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  categoryId: string;
  stock?: number;
  images?: string[];
  sku?: string;
  featured?: boolean;
  status?: ProductStatus;
}

interface UpdateShopProductData {
  name?: string;
  description?: string;
  price?: number;
  compareAtPrice?: number;
  categoryId?: string;
  stock?: number;
  images?: string[];
  sku?: string;
  featured?: boolean;
  status?: ProductStatus;
}

interface GetShopProductsOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  categoryId?: string;
  status?: ProductStatus;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
}

export class ShopProductService {
  async createProduct(data: CreateShopProductData, userId: string) {
    const { name, categoryId, sku, ...rest } = data;

    // Verify category exists
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new AppError(404, 'Catégorie non trouvée');
    }

    // Generate slug
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check for duplicate slug or SKU
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { slug },
          sku ? { sku } : { id: '' }, // Only check SKU if provided
        ].filter(condition => condition.id !== ''),
      },
    });

    if (existing) {
      if (existing.slug === slug) {
        throw new AppError(409, 'Un produit avec ce nom existe déjà');
      }
      if (sku && existing.sku === sku) {
        throw new AppError(409, 'Un produit avec ce SKU existe déjà');
      }
    }

    // Auto-set status based on stock
    let status = data.status || ProductStatus.ACTIVE;
    if (data.stock === 0) {
      status = ProductStatus.OUT_OF_STOCK;
    }

    const product = await prisma.product.create({
      data: {
        ...rest,
        name,
        slug,
        categoryId,
        userId,
        sku,
        status,
        stock: data.stock || 0,
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
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    });

    // Calculate average rating
    const avgRating = await this.calculateAverageRating(product.id);

    return {
      ...product,
      reviewCount: product._count.reviews,
      orderCount: product._count.orderItems,
      rating: avgRating,
    };
  }

  async getProducts(options: GetShopProductsOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      categoryId,
      status,
      minPrice,
      maxPrice,
      featured,
    } = options;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (featured !== undefined) {
      where.featured = featured;
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
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
            select: {
              reviews: true,
              orderItems: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate average ratings for all products
    const productsWithRatings = await Promise.all(
      products.map(async (product) => {
        const avgRating = await this.calculateAverageRating(product.id);
        return {
          ...product,
          reviewCount: product._count.reviews,
          orderCount: product._count.orderItems,
          rating: avgRating,
        };
      })
    );

    return {
      data: productsWithRatings,
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
        reviews: {
          where: { status: 'APPROVED' },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError(404, 'Produit non trouvé');
    }

    const avgRating = await this.calculateAverageRating(product.id);

    return {
      ...product,
      reviewCount: product._count.reviews,
      orderCount: product._count.orderItems,
      rating: avgRating,
    };
  }

  async updateProduct(id: string, data: UpdateShopProductData) {
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError(404, 'Produit non trouvé');
    }

    // If category is being updated, verify it exists
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new AppError(404, 'Catégorie non trouvée');
      }
    }

    const updateData: any = { ...data };

    // Generate new slug if name is being updated
    if (data.name && data.name !== product.name) {
      updateData.slug = data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check for conflicts
      const existing = await prisma.product.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { slug: updateData.slug },
          ],
        },
      });

      if (existing) {
        throw new AppError(409, 'Un produit avec ce nom existe déjà');
      }
    }

    // Check SKU conflicts
    if (data.sku && data.sku !== product.sku) {
      const existing = await prisma.product.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            { sku: data.sku },
          ],
        },
      });

      if (existing) {
        throw new AppError(409, 'Un produit avec ce SKU existe déjà');
      }
    }

    // Auto-update status based on stock
    if (data.stock !== undefined) {
      if (data.stock === 0) {
        updateData.status = ProductStatus.OUT_OF_STOCK;
      } else if (product.stock === 0 && data.stock > 0) {
        // Reactivate if was out of stock
        updateData.status = ProductStatus.ACTIVE;
      }
    }

    const updated = await prisma.product.update({
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
        _count: {
          select: {
            reviews: true,
            orderItems: true,
          },
        },
      },
    });

    const avgRating = await this.calculateAverageRating(updated.id);

    return {
      ...updated,
      reviewCount: updated._count.reviews,
      orderCount: updated._count.orderItems,
      rating: avgRating,
    };
  }

  async deleteProduct(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            orderItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError(404, 'Produit non trouvé');
    }

    if (product._count.orderItems > 0) {
      throw new AppError(
        400,
        'Impossible de supprimer ce produit car il est associé à des commandes'
      );
    }

    await prisma.product.delete({ where: { id } });

    return { message: 'Produit supprimé avec succès' };
  }

  private async calculateAverageRating(productId: string): Promise<number> {
    const result = await prisma.review.aggregate({
      where: {
        productId,
        status: 'APPROVED',
      },
      _avg: {
        rating: true,
      },
    });

    return result._avg.rating || 0;
  }
}

export default new ShopProductService();
