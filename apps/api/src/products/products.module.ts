import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { AuditModule } from '../audit/audit.module';
import { BullModule } from '@nestjs/bullmq';
import { ProductsProcessor } from './products.processor';

@Module({
  imports: [
    AuditModule,
    BullModule.registerQueue({
      name: 'products_import',
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsProcessor],
})
export class ProductsModule {}
