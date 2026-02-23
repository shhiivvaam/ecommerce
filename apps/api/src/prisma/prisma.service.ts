import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

function createExtendedClient(prisma: PrismaClient) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ model, operation, args, query }) {
          if (['User', 'Product', 'Category'].includes(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findUnique({ model, operation, args, query }) {
          if (['User', 'Product', 'Category'].includes(model)) {
            // @ts-ignore - Prisma dynamic extensions typings can be tricky
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findFirst({ model, operation, args, query }) {
          if (['User', 'Product', 'Category'].includes(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async delete({ model, operation, args, query }) {
          if (['User', 'Product', 'Category'].includes(model)) {
            // @ts-ignore - transform delete into update
            return prisma[model.toLowerCase()].update({
              ...args,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },
        async deleteMany({ model, operation, args, query }) {
          if (['User', 'Product', 'Category'].includes(model)) {
            // @ts-ignore - transform deleteMany into updateMany
            return prisma[model.toLowerCase()].updateMany({
              ...args,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },
      },
    },
  });
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
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
