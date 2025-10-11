import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { ReviewStatus } from '@prisma/client';

interface CreateReviewData {
  productId: string;
  rating: number;
  comment: string;
}

interface GetReviewsOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  productId?: string;
  status?: ReviewStatus;
  rating?: number;
}

export class ReviewService {
  async createReview(data: CreateReviewData, customerId: string) {
    const { productId, rating, comment } = data;

    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError(404, 'Produit non trouvé');
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findFirst({
      where: {
        productId,
        customerId,
      },
    });

    if (existingReview) {
      throw new AppError(409, 'Vous avez déjà laissé un avis pour ce produit');
    }

    // Optionally: check if user has purchased this product
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          customerId,
          status: 'DELIVERED',
        },
      },
    });

    if (!hasPurchased) {
      throw new AppError(403, 'Vous devez avoir acheté ce produit pour laisser un avis');
    }

    const review = await prisma.review.create({
      data: {
        productId,
        customerId,
        rating,
        comment,
        status: ReviewStatus.PENDING,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
    });

    return review;
  }

  async getReviews(options: GetReviewsOptions = {}, isAdmin = false) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      productId,
      status,
      rating,
    } = options;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Non-admin users can only see approved reviews
    if (!isAdmin) {
      where.status = ReviewStatus.APPROVED;
    } else if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { comment: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
        {
          product: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    if (productId) {
      where.productId = productId;
    }

    if (rating) {
      where.rating = rating;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
            },
          },
        },
      }),
      prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getReviewById(id: string, isAdmin = false) {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            price: true,
          },
        },
      },
    });

    if (!review) {
      throw new AppError(404, 'Avis non trouvé');
    }

    // Non-admin users can only see approved reviews
    if (!isAdmin && review.status !== ReviewStatus.APPROVED) {
      throw new AppError(403, 'Accès non autorisé à cet avis');
    }

    return review;
  }

  async updateReviewStatus(id: string, status: ReviewStatus, isAdmin = false) {
    if (!isAdmin) {
      throw new AppError(403, 'Seuls les administrateurs peuvent modérer les avis');
    }

    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new AppError(404, 'Avis non trouvé');
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { status },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
          },
        },
      },
    });

    return updated;
  }

  async deleteReview(id: string, requestUserId: string, isAdmin = false) {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new AppError(404, 'Avis non trouvé');
    }

    // Users can delete their own reviews, admins can delete any
    if (!isAdmin && review.customerId !== requestUserId) {
      throw new AppError(403, 'Vous ne pouvez supprimer que vos propres avis');
    }

    await prisma.review.delete({ where: { id } });

    return { message: 'Avis supprimé avec succès' };
  }

  async getProductRatingStats(productId: string) {
    // Verify product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new AppError(404, 'Produit non trouvé');
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId,
        status: ReviewStatus.APPROVED,
      },
      select: {
        rating: true,
      },
    });

    const total = reviews.length;

    if (total === 0) {
      return {
        total: 0,
        average: 0,
        distribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
      };
    }

    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    const average = sum / total;

    const distribution = reviews.reduce(
      (acc, review) => {
        acc[review.rating as keyof typeof acc]++;
        return acc;
      },
      { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    );

    return {
      total,
      average: Math.round(average * 10) / 10,
      distribution,
    };
  }
}

export default new ReviewService();
