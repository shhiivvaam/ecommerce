import { IsNotEmpty, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PurchaseGiftCardDto {
  @ApiProperty({ description: 'Initial balance to load on the gift card' })
  @IsNotEmpty()
  @IsNumber()
  @Min(5)
  amount: number;
}
