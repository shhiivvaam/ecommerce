import { Injectable } from '@nestjs/common';
import { Prisma, StoreMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.settings.findFirst({
      orderBy: { createdAt: 'asc' },
    });
    if (!settings) {
      try {
        settings = await this.prisma.settings.create({
          data: { id: 'global', storeMode: StoreMode.MULTI },
        });
      } catch {
        settings = await this.prisma.settings.findFirst({
          orderBy: { createdAt: 'asc' },
        });
      }
    }
    return settings!;
  }

  async updateSettings(data: Prisma.SettingsUpdateInput) {
    const settings = await this.getSettings();
    return this.prisma.settings.update({
      where: { id: settings.id },
      data,
    });
  }

  async isSingleProductMode() {
    const settings = await this.getSettings();
    return settings.storeMode === StoreMode.SINGLE;
  }

  async getSingleProductId() {
    const settings = await this.getSettings();
    if (settings.storeMode === StoreMode.SINGLE && settings.singleProductId) {
      return settings.singleProductId;
    }
    return null;
  }
}
