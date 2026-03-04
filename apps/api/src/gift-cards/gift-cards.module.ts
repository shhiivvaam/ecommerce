import { Module } from '@nestjs/common';
import { GiftCardsService } from './gift-cards.service';
import { GiftCardsController } from './gift-cards.controller';

@Module({
  providers: [GiftCardsService],
  controllers: [GiftCardsController],
})
export class GiftCardsModule {}
