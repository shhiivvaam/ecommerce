import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBannerDto, UpdateBannerDto } from './dto/banner.dto';

@Injectable()
export class BannersService {
  constructor(private prisma: PrismaService) {}

  async findAllActive() {
    return this.prisma.banner.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async findAll(limit = 100) {
    const safeLimit = Math.min(Math.max(limit, 1), 500);
    return this.prisma.banner.findMany({
      orderBy: { createdAt: 'desc' },
      take: safeLimit,
    });
  }

  async findOne(id: string) {
    const banner = await this.prisma.banner.findUnique({ where: { id } });
    if (!banner) throw new NotFoundException('Banner not found');
    return banner;
  }

  async create(data: CreateBannerDto) {
    return this.prisma.banner.create({ data });
  }

  async update(id: string, data: UpdateBannerDto) {
    await this.findOne(id);
    return this.prisma.banner.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.banner.delete({ where: { id } });
  }
}
