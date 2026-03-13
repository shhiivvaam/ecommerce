import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsBoolean,
  IsOptional,
  MaxLength,
  Matches,
  IsNumberString,
  Length,
} from 'class-validator';

export class CreateAddressDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(/^[A-Za-z\s]*$/, {
    message: 'firstName must contain only alphabets',
  })
  firstName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  @Matches(/^[A-Za-z\s]*$/, {
    message: 'lastName must contain only alphabets',
  })
  lastName?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  label?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @IsNumberString()
  @Length(10, 10, { message: 'phone must be exactly 10 digits' })
  phone?: string;

  @ApiProperty()
  @IsString()
  @MaxLength(100)
  street: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z\s]+$/, { message: 'city must contain only alphabets' })
  city: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z\s]+$/, { message: 'state must contain only alphabets' })
  state: string;

  @ApiProperty()
  @IsString()
  @MaxLength(50)
  @Matches(/^[A-Za-z\s]+$/, { message: 'country must contain only alphabets' })
  country: string;

  @ApiProperty()
  @IsString()
  @IsNumberString()
  @Length(6, 6, { message: 'zipCode must be exactly 6 digits' })
  zipCode: string;

  @ApiPropertyOptional()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional()
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
