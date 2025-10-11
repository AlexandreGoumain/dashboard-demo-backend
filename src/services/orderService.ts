import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { OrderStatus } from '@prisma/client';

interface OrderItem {
  productId: string;
  quantity: number;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface CreateOrderData {
  items: OrderItem[];
  shippingAddress: ShippingAddress;
}

interface GetOrdersOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  order?: 'asc' | 'desc';
  status?: OrderStatus;
  customerId?: string;
}

export class OrderService {
  async createOrder(data: CreateOrderData, customerId: string) {
    const { items, shippingAddress } = data;

    // Verify all products exist and have sufficient stock
    const productIds = items.map(item => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
      },
    });

    if (products.length !== productIds.length) {
      throw new AppError(404, 'Un ou plusieurs produits sont introuvables');
    }

    // Check stock and calculate total
    let total = 0;
    const stockErrors: string[] = [];

    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) continue;

      if (product.stock < item.quantity) {
        stockErrors.push(
          `${product.name}: stock insuffisant (disponible: ${product.stock}, demandé: ${item.quantity})`
        );
      }

      if (product.status === 'OUT_OF_STOCK' || product.status === 'INACTIVE') {
        stockErrors.push(`${product.name}: produit non disponible`);
      }

      total += product.price * item.quantity;
    }

    if (stockErrors.length > 0) {
      throw new AppError(400, 'Erreurs de disponibilité', stockErrors);
    }

    // Generate unique order number
    const orderNumber = await this.generateOrderNumber();

    // Create order with items in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId,
          total,
          shippingStreet: shippingAddress.street,
          shippingCity: shippingAddress.city,
          shippingState: shippingAddress.state,
          shippingPostalCode: shippingAddress.postalCode,
          shippingCountry: shippingAddress.country,
          status: OrderStatus.PENDING,
        },
      });

      // Create order items and update product stock
      for (const item of items) {
        const product = products.find(p => p.id === item.productId)!;

        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            price: product.price,
          },
        });

        // Update product stock
        const newStock = product.stock - item.quantity;
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: newStock,
            status: newStock === 0 ? 'OUT_OF_STOCK' : product.status,
          },
        });
      }

      return newOrder;
    });

    // Fetch complete order with relations
    return this.getOrderById(order.id);
  }

  async getOrders(options: GetOrdersOptions = {}, requestUserId?: string, isAdmin = false) {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = 'createdAt',
      order = 'desc',
      status,
      customerId,
    } = options;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Non-admin users can only see their own orders
    if (!isAdmin && requestUserId) {
      where.customerId = requestUserId;
    } else if (customerId) {
      where.customerId = customerId;
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        {
          customer: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
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
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  images: true,
                  price: true,
                },
              },
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      data: orders.map(order => ({
        ...order,
        shippingAddress: {
          street: order.shippingStreet,
          city: order.shippingCity,
          state: order.shippingState,
          postalCode: order.shippingPostalCode,
          country: order.shippingCountry,
        },
        itemCount: order._count.items,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(id: string, requestUserId?: string, isAdmin = false) {
    const order = await prisma.order.findUnique({
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
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
                price: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError(404, 'Commande non trouvée');
    }

    // Non-admin users can only view their own orders
    if (!isAdmin && requestUserId && order.customerId !== requestUserId) {
      throw new AppError(403, 'Accès non autorisé à cette commande');
    }

    return {
      ...order,
      shippingAddress: {
        street: order.shippingStreet,
        city: order.shippingCity,
        state: order.shippingState,
        postalCode: order.shippingPostalCode,
        country: order.shippingCountry,
      },
    };
  }

  async updateOrderStatus(id: string, status: OrderStatus, isAdmin = false) {
    if (!isAdmin) {
      throw new AppError(403, 'Seuls les administrateurs peuvent modifier le statut des commandes');
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new AppError(404, 'Commande non trouvée');
    }

    // Validate status transition
    if (order.status === 'CANCELLED' || order.status === 'DELIVERED') {
      throw new AppError(400, 'Impossible de modifier une commande annulée ou livrée');
    }

    const updated = await prisma.order.update({
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
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return {
      ...updated,
      shippingAddress: {
        street: updated.shippingStreet,
        city: updated.shippingCity,
        state: updated.shippingState,
        postalCode: updated.shippingPostalCode,
        country: updated.shippingCountry,
      },
    };
  }

  async cancelOrder(id: string, requestUserId: string, isAdmin = false) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });

    if (!order) {
      throw new AppError(404, 'Commande non trouvée');
    }

    // Non-admin users can only cancel their own orders
    if (!isAdmin && order.customerId !== requestUserId) {
      throw new AppError(403, 'Accès non autorisé à cette commande');
    }

    // Can only cancel pending or processing orders
    if (!['PENDING', 'PROCESSING'].includes(order.status)) {
      throw new AppError(400, 'Impossible d\'annuler une commande déjà expédiée ou livrée');
    }

    // Restore product stock in a transaction
    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product) {
          const newStock = product.stock + item.quantity;
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: newStock,
              status: newStock > 0 && product.status === 'OUT_OF_STOCK'
                ? 'ACTIVE'
                : product.status,
            },
          });
        }
      }

      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });
    });

    return this.getOrderById(id);
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');

    // Get count of orders this month
    const startOfMonth = new Date(year, date.getMonth(), 1);
    const endOfMonth = new Date(year, date.getMonth() + 1, 0, 23, 59, 59);

    const count = await prisma.order.count({
      where: {
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `ORD-${year}${month}-${sequence}`;
  }
}

export default new OrderService();
