import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsInt,
  Min,
  IsArray,
  IsEnum,
} from 'class-validator';
import { CouponType } from '@prisma/client';

export class CreateCouponDto {
  @ApiProperty({ example: 'SAVE20' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 20, description: 'Discount amount or percentage' })
  @IsNumber()
  @Min(0)
  discount: number;

  @ApiPropertyOptional({
    example: 'PERCENTAGE',
    enum: CouponType,
    description:
      'Type of coupon: PERCENTAGE, FIXED_AMOUNT, BOGO, FREE_SHIPPING',
  })
  @IsEnum(CouponType)
  @IsOptional()
  type?: CouponType;

  @ApiProperty({ example: '2025-12-31T23:59:59Z' })
  @IsDateString()
  expiryDate: string;

  @ApiPropertyOptional({ example: 100 })
  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @ApiPropertyOptional({
    example: 50,
    description: 'Minimum cart total to apply coupon',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  minTotal?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableProductIds?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableCategoryIds?: string[];

  @ApiPropertyOptional({ description: 'Number of items to buy for BOGO' })
  @IsInt()
  @Min(1)
  @IsOptional()
  buyQuantity?: number;

  @ApiPropertyOptional({ description: 'Number of items to get for BOGO' })
  @IsInt()
  @Min(1)
  @IsOptional()
  getQuantity?: number;
}

export class UpdateCouponDto {
  @ApiPropertyOptional({ example: 25 })
  @IsNumber()
  @IsOptional()
  discount?: number;

  @ApiPropertyOptional({ enum: CouponType })
  @IsEnum(CouponType)
  @IsOptional()
  type?: CouponType;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @Min(0)
  @IsOptional()
  minTotal?: number;

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableProductIds?: string[];

  @ApiPropertyOptional()
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  applicableCategoryIds?: string[];

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  buyQuantity?: number;

  @ApiPropertyOptional()
  @IsInt()
  @Min(1)
  @IsOptional()
  getQuantity?: number;
}

export class ApplyCouponDto {
  @ApiProperty({ example: 'SAVE20' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 150,
    description: 'Current cart total to validate against minTotal',
  })
  @IsNumber()
  @Min(0)
  cartTotal: number;
}
