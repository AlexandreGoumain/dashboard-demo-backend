import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface CreateCategoryData {
  name: string;
  description?: string;
  image?: string;
}

interface UpdateCategoryData {
  name?: string;
  description?: string;
  image?: string;
}

interface GetCategoriesOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export class CategoryService {
  async createCategory(data: CreateCategoryData) {
    const { name, description, image } = data;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Check if category with same name or slug exists
    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { name },
          { slug },
        ],
      },
    });

    if (existing) {
      throw new AppError(409, 'Une catégorie avec ce nom existe déjà');
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description,
        image,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return category;
  }

  async getCategories(options: GetCategoriesOptions = {}) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      order = 'desc',
    } = options;

    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: order },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
      prisma.category.count({ where }),
    ]);

    return {
      data: categories.map((cat) => ({
        ...cat,
        productCount: cat._count.products,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCategoryById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
        products: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            status: true,
            images: true,
          },
        },
      },
    });

    if (!category) {
      throw new AppError(404, 'Catégorie non trouvée');
    }

    return {
      ...category,
      productCount: category._count.products,
    };
  }

  async updateCategory(id: string, data: UpdateCategoryData) {
    const category = await prisma.category.findUnique({ where: { id } });

    if (!category) {
      throw new AppError(404, 'Catégorie non trouvée');
    }

    // Generate new slug if name is being updated
    const updateData: any = { ...data };
    if (data.name && data.name !== category.name) {
      updateData.slug = data.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Check for conflicts
      const existing = await prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                { name: data.name },
                { slug: updateData.slug },
              ],
            },
          ],
        },
      });

      if (existing) {
        throw new AppError(409, 'Une catégorie avec ce nom existe déjà');
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    return {
      ...updated,
      productCount: updated._count.products,
    };
  }

  async deleteCategory(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new AppError(404, 'Catégorie non trouvée');
    }

    if (category._count.products > 0) {
      throw new AppError(
        400,
        `Impossible de supprimer cette catégorie car elle contient ${category._count.products} produit(s)`
      );
    }

    await prisma.category.delete({ where: { id } });

    return { message: 'Catégorie supprimée avec succès' };
  }
}

export default new CategoryService();
