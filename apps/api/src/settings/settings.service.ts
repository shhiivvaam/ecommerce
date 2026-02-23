import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.settings.findFirst();
    if (!settings) {
      settings = await this.prisma.settings.create({
        data: { storeMode: 'multi' },
      });
    }
    return settings;
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
    return settings.storeMode === 'single';
  }

  async getSingleProductId() {
    const settings = await this.getSettings();
    if (settings.storeMode === 'single' && settings.singleProductId) {
      return settings.singleProductId;
    }
    return null;
  }
}
