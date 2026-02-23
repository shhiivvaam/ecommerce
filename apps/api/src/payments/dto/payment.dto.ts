import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutItemDto {
  @ApiProperty({ example: 'clx_product_id_123', description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiProperty({ example: 'Wireless Headphones', description: 'Product name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 99.99, description: 'Product price' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 2, description: 'Quantity' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateCheckoutSessionDto {
  @ApiProperty({
    example: 'clx_order_id_123',
    description: 'The order ID to create a checkout session for',
  })
  @IsString()
  orderId: string;

  @ApiProperty({
    type: [CheckoutItemDto],
    description: 'Items to include in the checkout session',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];

  @ApiProperty({
    example: 'https://yourstore.com/success',
    description: 'URL to redirect to after successful payment',
  })
  @IsUrl()
  successUrl: string;

  @ApiProperty({
    example: 'https://yourstore.com/cancel',
    description: 'URL to redirect to if payment is cancelled',
  })
  @IsUrl()
  cancelUrl: string;
}

export class CheckoutSessionResponseDto {
  @ApiProperty({
    example: 'https://checkout.stripe.com/pay/cs_test_...',
    description: 'Stripe checkout session URL',
  })
  url: string;

  @ApiProperty({ example: 'cs_test_a1B2c3D4e5F6g7H8...' })
  sessionId: string;
}
