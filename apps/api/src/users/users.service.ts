import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { RoleType } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });

    if (!user) throw new NotFoundException('User not found');

    // exclude password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }

  async update(id: string, data: UpdateUserDto) {
    await this.findOne(id);

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.avatar && { avatar: data.avatar }),
      },
      include: { role: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = updated;
    return result;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({ where: { id } });
  }

  // ─── Admin methods ──────────────────────────────────────────
  async findAll(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { role: true, _count: { select: { orders: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sanitized = users.map(({ password: _, ...u }) => u);
    return { users: sanitized, total, page, limit };
  }

  async toggleBlock(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    // Soft-block by toggling deletedAt
    const updated = await this.prisma.user.update({
      where: { id },
      data: { deletedAt: user.deletedAt ? null : new Date() },
      include: { role: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = updated;
    return result;
  }

  async changeRole(id: string, roleType: RoleType) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Find the role record
    const role = await this.prisma.role.findFirst({
      where: { name: roleType },
    });
    if (!role) throw new BadRequestException(`Role ${roleType} not found`);

    const updated = await this.prisma.user.update({
      where: { id },
      data: { roleId: role.id },
      include: { role: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = updated;
    return result;
  }
}
