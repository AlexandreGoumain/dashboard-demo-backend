import { z } from 'zod';

// Category validators
export const createCategorySchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  image: z.string().url().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// Shop Product validators
export const createShopProductSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  description: z.string().optional(),
  price: z.number().positive('Le prix doit être positif'),
  compareAtPrice: z.number().positive().optional(),
  categoryId: z.string().uuid('ID de catégorie invalide'),
  stock: z.number().int().min(0, 'Le stock ne peut pas être négatif').default(0),
  images: z.array(z.string().url()).optional(),
  sku: z.string().optional(),
  featured: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).default('ACTIVE'),
});

export const updateShopProductSchema = createShopProductSchema.partial();

// Order validators
export const createOrderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().positive(),
    })
  ).min(1, 'La commande doit contenir au moins un article'),
  shippingAddress: z.object({
    street: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(4),
    country: z.string().min(2),
  }),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
});

// Review validators
export const createReviewSchema = z.object({
  productId: z.string().uuid('ID de produit invalide'),
  rating: z.number().int().min(1).max(5, 'La note doit être entre 1 et 5'),
  comment: z.string().min(10, 'Le commentaire doit contenir au moins 10 caractères'),
});

export const updateReviewStatusSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
});

// Query params validators
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const productFiltersSchema = paginationSchema.extend({
  categoryId: z.string().uuid().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  featured: z.coerce.boolean().optional(),
});

export const orderFiltersSchema = paginationSchema.extend({
  status: z.enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  customerId: z.string().uuid().optional(),
});

export const reviewFiltersSchema = paginationSchema.extend({
  productId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
});
