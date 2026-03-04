import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { CartCleanupService } from './cart-cleanup.service';

import { EmailModule } from '../email/email.module';

@Module({
  imports: [EmailModule],
  controllers: [CartController],
  providers: [CartService, CartCleanupService],
})
export class CartModule {}
