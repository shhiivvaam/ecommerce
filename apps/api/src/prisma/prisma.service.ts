import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

// Define which models support soft delete
const SOFT_DELETE_MODELS = ['User', 'Product', 'Category'] as const;
type SoftDeleteModel = (typeof SOFT_DELETE_MODELS)[number];

function createExtendedClient(prisma: PrismaClient) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (isSoftDeleteModel(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          if (isSoftDeleteModel(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (isSoftDeleteModel(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async delete({ model, args, query }) {
          if (isSoftDeleteModel(model)) {
            switch (model) {
              case 'User':
                return prisma.user.update({
                  ...args,
                  data: { deletedAt: new Date() },
                });
              case 'Product':
                return prisma.product.update({
                  ...args,
                  data: { deletedAt: new Date() },
                });
              case 'Category':
                return prisma.category.update({
                  ...args,
                  data: { deletedAt: new Date() },
                });
            }
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (isSoftDeleteModel(model)) {
            switch (model) {
              case 'User':
                return prisma.user.updateMany({
                  ...args,
                  data: { deletedAt: new Date() },
                });
              case 'Product':
                return prisma.product.updateMany({
                  ...args,
                  data: { deletedAt: new Date() },
                });
              case 'Category':
                return prisma.category.updateMany({
                  ...args,
                  data: { deletedAt: new Date() },
                });
            }
          }
          return query(args);
        },
      },
    },
  });
}

// Type guard for soft delete models
function isSoftDeleteModel(model: string): model is SoftDeleteModel {
  return SOFT_DELETE_MODELS.includes(model as SoftDeleteModel);
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  public extendedClient: ExtendedPrismaClient;

  constructor() {
    super();
    this.extendedClient = createExtendedClient(this);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
