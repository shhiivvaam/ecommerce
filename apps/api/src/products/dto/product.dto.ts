import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Wireless Headphones', description: 'Product name' })
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'High-quality wireless headphones with noise cancellation',
    description: 'Product description',
  })
  @IsString()
  @MinLength(10)
  description: string;

  @ApiProperty({ example: 99.99, description: 'Product price in USD' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiPropertyOptional({
    example: 150,
    description: 'Number of items in stock',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    example: 'https://cdn.example.com/product.jpg',
    description: 'Main product image URL',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: 'clx_category_id_123',
    description: 'Category ID this product belongs to',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Updated Product Name' })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional({ example: 79.99 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/new-image.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'clx_category_id_456' })
  @IsOptional()
  @IsString()
  categoryId?: string;
}

export class ProductQueryDto {
  @ApiPropertyOptional({ example: 'headphones', description: 'Search by name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    example: 'clx_category_id_123',
    description: 'Filter by category ID',
  })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({
    example: 'price',
    description: 'Sort field',
    enum: ['price', 'name', 'createdAt'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['price', 'name', 'createdAt'])
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'asc',
    description: 'Sort direction',
    enum: ['asc', 'desc'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: string;
}

export class ProductResponseDto {
  @ApiProperty({ example: 'clx_product_id_123' })
  id: string;

  @ApiProperty({ example: 'Wireless Headphones' })
  name: string;

  @ApiProperty({ example: 'High-quality wireless headphones' })
  description: string;

  @ApiProperty({ example: 99.99 })
  price: number;

  @ApiProperty({ example: 150 })
  stock: number;

  @ApiProperty({ example: 'https://cdn.example.com/product.jpg' })
  imageUrl: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  createdAt: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  updatedAt: string;
}
