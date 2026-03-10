import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateCheckoutSessionDto {
  @ApiProperty({
    example: 'clx_order_id_123',
    description: 'The order ID to create a checkout session for',
  })
  @IsString()
  orderId: string;
}

export class CheckoutSessionResponseDto {
  @ApiProperty({
    example: 'order_12345',
    description: 'Razorpay order ID',
  })
  id: string;

  @ApiProperty({
    example: 49900,
    description: 'Amount in smallest currency unit (e.g., paisa)',
  })
  amount: number;

  @ApiProperty({ example: 'INR', description: 'Currency code' })
  currency: string;
}
