import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardData() {
    const validStatuses: OrderStatus[] = ['PROCESSING', 'SHIPPED', 'DELIVERED'];

    // Revenue & Order counts
    const aggregations = await this.prisma.order.aggregate({
      where: { status: { in: validStatuses } },
      _sum: { totalAmount: true },
      _count: { id: true },
    });

    const totalRevenue = aggregations._sum.totalAmount || 0;
    const totalOrders = aggregations._count.id;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Sales over last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch and group in JS (Prisma grouping by date directly can be tricky across DBs)
    const recentOrders = await this.prisma.order.findMany({
      where: {
        status: { in: validStatuses },
        createdAt: { gte: thirtyDaysAgo },
      },
      select: { createdAt: true, totalAmount: true },
    });

    const salesByDayMap = new Map<string, number>();
    for (const order of recentOrders) {
      const day = order.createdAt.toISOString().split('T')[0];
      salesByDayMap.set(day, (salesByDayMap.get(day) || 0) + order.totalAmount);
    }

    const salesByDay = Array.from(salesByDayMap.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Top 5 selling products
    const topProductsRaw = await this.prisma.orderItem.groupBy({
      by: ['productId', 'productTitle'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topSellingProducts = topProductsRaw.map((item) => ({
      productId: item.productId,
      title: item.productTitle,
      totalSold: item._sum.quantity || 0,
    }));

    return {
      overview: {
        totalRevenue,
        totalOrders,
        averageOrderValue: aov,
      },
      salesByDay,
      topSellingProducts,
    };
  }
}
