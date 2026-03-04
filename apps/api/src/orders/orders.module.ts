import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';
import { CouponsModule } from '../coupons/coupons.module';

@Module({
  imports: [CouponsModule],
  controllers: [OrdersController, RefundsController],
  providers: [OrdersService, RefundsService],
})
export class OrdersModule {}
