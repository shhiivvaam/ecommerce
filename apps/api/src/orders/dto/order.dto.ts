import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsIn,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderAddressDto {
  @ApiProperty() @IsString() street: string;
  @ApiProperty() @IsString() city: string;
  @ApiProperty() @IsString() state: string;
  @ApiProperty() @IsString() country: string;
  @ApiProperty() @IsString() zipCode: string;
}

export class OrderItemDto {
  @ApiProperty({ example: 'clx_product_id_123', description: 'Product ID' })
  @IsString()
  productId: string;

  @ApiPropertyOptional({
    example: 'clx_variant_id_456',
    description: 'Product Variant ID if applicable',
  })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({ example: 2, description: 'Quantity to order' })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    type: [OrderItemDto],
    description: 'Array of items in the order',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiPropertyOptional({
    example: 'clx_address_id_123',
    description: 'Saved address ID for shipping',
  })
  @IsString()
  @IsOptional()
  addressId?: string;

  @ApiPropertyOptional({
    description: 'New address details if not using an existing addressId',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrderAddressDto)
  address?: OrderAddressDto;

  @ApiPropertyOptional({
    example: 'SAVE10',
    description: 'Coupon code to apply to this order',
  })
  @IsString()
  @IsOptional()
  couponCode?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: 'SHIPPED',
    description: 'New order status',
    enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  })
  @IsString()
  @IsIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
  status: string;
}

export class OrderResponseDto {
  @ApiProperty({ example: 'clx_order_id_123' })
  id: string;

  @ApiProperty({ example: 'clx_user_id_456' })
  userId: string;

  @ApiProperty({
    example: 'PENDING',
    enum: ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'],
  })
  status: string;

  @ApiProperty({ example: 199.98 })
  total: number;

  @ApiProperty({ type: [OrderItemDto] })
  items: OrderItemDto[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;
}
