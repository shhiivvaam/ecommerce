import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @ApiProperty({ example: 'clx_product_id_123', description: 'Product ID' })
  @IsString()
  productId: string;

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

  @ApiProperty({
    example: 'clx_address_id_123',
    description: 'Saved address ID for shipping',
  })
  @IsString()
  addressId: string;
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
