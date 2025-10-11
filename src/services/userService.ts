import prisma from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { CreateUserInput, PaginationQuery, UpdateUserInput } from "../types";
import { hashPassword } from "../utils/password";

function toNumber(value: unknown): number | undefined {
    if (value === undefined || value === null) {
        return undefined;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
}

export class UserService {
    async getUsers(query: PaginationQuery) {
        const parsedPage = toNumber(query.page);
        const parsedLimit = toNumber(query.limit);
        const page = parsedPage && parsedPage > 0 ? Math.floor(parsedPage) : 1;
        const limit =
            parsedLimit && parsedLimit > 0 ? Math.floor(parsedLimit) : 10;
        const skip = (page - 1) * limit;
        const sortBy = query.sortBy || "createdAt";
        const order = query.order === "asc" ? "asc" : "desc";
        const search = query.search || "";

        // Build where clause for search
        const where = search
            ? {
                  OR: [
                      {
                          name: {
                              contains: search,
                              mode: "insensitive" as const,
                          },
                      },
                      {
                          email: {
                              contains: search,
                              mode: "insensitive" as const,
                          },
                      },
                  ],
              }
            : {};

        // Get total count
        const total = await prisma.user.count({ where });

        // Get users
        const users = await prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { [sortBy]: order },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: { products: true },
                },
            },
        });

        return {
            users,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getUserById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: { products: true },
                },
            },
        });

        if (!user) {
            throw new AppError(404, "User not found");
        }

        return user;
    }

    async createUser(data: CreateUserInput) {
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: data.email },
        });

        if (existingUser) {
            throw new AppError(409, "User with this email already exists");
        }

        // Hash password
        const hashedPassword = await hashPassword(data.password);

        // Create user
        const user = await prisma.user.create({
            data: {
                email: data.email,
                password: hashedPassword,
                name: data.name,
                role: data.role,
                avatar: data.avatar,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                createdAt: true,
            },
        });

        return user;
    }

    async updateUser(id: string, data: UpdateUserInput) {
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id },
        });

        if (!existingUser) {
            throw new AppError(404, "User not found");
        }

        // Check email uniqueness if updating email
        if (data.email && data.email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({
                where: { email: data.email },
            });

            if (emailExists) {
                throw new AppError(409, "Email already in use");
            }
        }

        // Hash password if provided
        const updateData: any = { ...data };
        if (data.password) {
            updateData.password = await hashPassword(data.password);
        }

        // Update user
        const user = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                avatar: true,
                updatedAt: true,
            },
        });

        return user;
    }

    async deleteUser(id: string) {
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user) {
            throw new AppError(404, "User not found");
        }

        // Delete user (cascade will handle related products)
        await prisma.user.delete({
            where: { id },
        });

        return { message: "User deleted successfully" };
    }

    async getUserStats(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { products: true },
                },
                products: {
                    select: {
                        sales: {
                            select: {
                                quantity: true,
                                totalPrice: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            throw new AppError(404, "User not found");
        }

        // Calculate total sales and revenue
        let totalSales = 0;
        let totalRevenue = 0;

        user.products.forEach((product) => {
            product.sales.forEach((sale) => {
                totalSales += sale.quantity;
                totalRevenue += sale.totalPrice;
            });
        });

        return {
            totalProducts: user._count.products,
            totalSales,
            totalRevenue,
        };
    }
}
