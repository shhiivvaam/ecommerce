import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export type ExtendedPrismaClient = ReturnType<typeof createExtendedClient>;

function createExtendedClient(prisma: PrismaClient) {
  return prisma.$extends({
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (['User', 'Product', 'Category'].includes(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findUnique({ model, args, query }) {
          if (['User', 'Product', 'Category'].includes(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (['User', 'Product', 'Category'].includes(model)) {
            args.where = { ...args.where, deletedAt: null };
          }
          return query(args);
        },
        async delete({ model, args, query }) {
          if (['User', 'Product', 'Category'].includes(model)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            return (prisma as any)[model.toLowerCase()].update({
              ...args,
              data: { deletedAt: new Date() },
            });
          }
          return query(args);
        },
        async deleteMany({ model, args, query }) {
          if (['User', 'Product', 'Category'].includes(model)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            return (prisma as any)[model.toLowerCase()].updateMany({
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
