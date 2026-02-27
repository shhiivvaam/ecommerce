import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [totalOrders, totalUsers, totalProducts, orders, revenueData] =
      await Promise.all([
        this.prisma.order.count(),
        this.prisma.user.count(),
        this.prisma.product.count(),
        this.prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, email: true } } },
        }),
        this.prisma.order.aggregate({
          where: { status: { notIn: [OrderStatus.CANCELLED] } },
          _sum: { totalAmount: true },
        }),
      ]);

    // Get orders by status for a chart
    const statusCounts = await this.prisma.order.groupBy({
      by: ['status'],
      _count: true,
    });

    return {
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue: revenueData._sum.totalAmount || 0,
      recentOrders: orders,
      statusCounts,
    };
  }
}
