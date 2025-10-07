import prisma from "../config/database";
import { CategoryData, DashboardStats, SalesData, TopProduct } from "../types";

export class AnalyticsService {
    async getDashboardStats(): Promise<DashboardStats> {
        const now = new Date();
        const firstDayThisMonth = new Date(
            now.getFullYear(),
            now.getMonth(),
            1
        );
        const firstDayLastMonth = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );

        // Get current month stats
        const [
            totalUsers,
            totalProducts,
            currentMonthSales,
            lastMonthSales,
            currentMonthUsers,
            lastMonthUsers,
            currentMonthProducts,
            lastMonthProducts,
        ] = await Promise.all([
            // Total counts
            prisma.user.count(),
            prisma.product.count(),

            // Current month sales
            prisma.sale.aggregate({
                where: { saleDate: { gte: firstDayThisMonth } },
                _sum: { totalPrice: true, quantity: true },
            }),

            // Last month sales
            prisma.sale.aggregate({
                where: {
                    saleDate: {
                        gte: firstDayLastMonth,
                        lt: firstDayThisMonth,
                    },
                },
                _sum: { totalPrice: true, quantity: true },
            }),

            // Current month users
            prisma.user.count({
                where: { createdAt: { gte: firstDayThisMonth } },
            }),

            // Last month users
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: firstDayLastMonth,
                        lt: firstDayThisMonth,
                    },
                },
            }),

            // Current month products
            prisma.product.count({
                where: { createdAt: { gte: firstDayThisMonth } },
            }),

            // Last month products
            prisma.product.count({
                where: {
                    createdAt: {
                        gte: firstDayLastMonth,
                        lt: firstDayThisMonth,
                    },
                },
            }),
        ]);

        // Calculate growth percentages
        const calculateGrowth = (current: number, previous: number): number => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return ((current - previous) / previous) * 100;
        };

        const totalRevenue = currentMonthSales._sum.totalPrice || 0;
        const lastMonthRevenue = lastMonthSales._sum.totalPrice || 0;
        const totalSales = currentMonthSales._sum.quantity || 0;
        const lastMonthSalesCount = lastMonthSales._sum.quantity || 0;

        return {
            totalUsers,
            totalProducts,
            totalRevenue,
            totalSales,
            userGrowth: calculateGrowth(currentMonthUsers, lastMonthUsers),
            productGrowth: calculateGrowth(
                currentMonthProducts,
                lastMonthProducts
            ),
            revenueGrowth: calculateGrowth(totalRevenue, lastMonthRevenue),
            salesGrowth: calculateGrowth(totalSales, lastMonthSalesCount),
        };
    }

    async getSalesData(months: number = 12): Promise<SalesData[]> {
        const now = new Date();
        const startDate = new Date(
            now.getFullYear(),
            now.getMonth() - months,
            1
        );

        const sales = await prisma.sale.groupBy({
            by: ["saleDate"],
            where: {
                saleDate: { gte: startDate },
            },
            _sum: {
                totalPrice: true,
                quantity: true,
            },
        });

        // Group by month
        const salesByMonth: {
            [key: string]: { revenue: number; sales: number };
        } = {};

        sales.forEach((sale) => {
            const date = new Date(sale.saleDate);
            const monthKey = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;

            if (!salesByMonth[monthKey]) {
                salesByMonth[monthKey] = { revenue: 0, sales: 0 };
            }

            salesByMonth[monthKey].revenue += sale._sum.totalPrice || 0;
            salesByMonth[monthKey].sales += sale._sum.quantity || 0;
        });

        // Convert to array with month names
        const monthNames = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
        ];

        const result: SalesData[] = [];
        for (let i = months - 1; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;
            const monthName = monthNames[date.getMonth()];

            result.push({
                month: monthName,
                revenue: salesByMonth[monthKey]?.revenue || 0,
                sales: salesByMonth[monthKey]?.sales || 0,
            });
        }

        return result;
    }

    async getCategoryData(): Promise<CategoryData[]> {
        const categories = await prisma.category.findMany({
            include: {
                products: {
                    include: {
                        sales: {
                            select: {
                                totalPrice: true,
                            },
                        },
                    },
                },
            },
        });

        const categoryData: CategoryData[] = categories.map((category) => {
            const totalRevenue = category.products.reduce((sum, product) => {
                const productRevenue = product.sales.reduce(
                    (pSum, sale) => pSum + sale.totalPrice,
                    0
                );
                return sum + productRevenue;
            }, 0);

            return {
                name: category.name,
                value: totalRevenue,
                products: category.products.length,
            };
        });

        // Sort by revenue and return top categories
        return categoryData.sort((a, b) => b.value - a.value);
    }

    async getTopProducts(limit: number = 10): Promise<TopProduct[]> {
        const products = await prisma.product.findMany({
            include: {
                sales: {
                    select: {
                        quantity: true,
                        totalPrice: true,
                    },
                },
            },
        });

        const topProducts: TopProduct[] = products.map((product) => {
            const totalSales = product.sales.reduce(
                (sum, sale) => sum + sale.quantity,
                0
            );
            const totalRevenue = product.sales.reduce(
                (sum, sale) => sum + sale.totalPrice,
                0
            );

            return {
                id: product.id,
                name: product.name,
                totalSales,
                totalRevenue,
                stock: product.stock,
            };
        });

        // Sort by revenue and return top products
        return topProducts
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, limit);
    }

    async getRecentActivity(limit: number = 10) {
        const [recentSales, recentProducts, recentUsers] = await Promise.all([
            prisma.sale.findMany({
                take: limit,
                orderBy: { saleDate: "desc" },
                include: {
                    product: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),

            prisma.product.findMany({
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    createdBy: {
                        select: {
                            name: true,
                        },
                    },
                },
            }),

            prisma.user.findMany({
                take: limit,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    createdAt: true,
                },
            }),
        ]);

        return {
            recentSales,
            recentProducts,
            recentUsers,
        };
    }
}
