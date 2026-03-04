import { Module } from '@nestjs/common';
import { AffiliatesService } from './affiliates.service';
import { AffiliatesController } from './affiliates.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AffiliatesService],
  controllers: [AffiliatesController],
  exports: [AffiliatesService],
})
export class AffiliatesModule {}
