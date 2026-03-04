import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterAffiliateDto {
  @ApiProperty({
    description:
      'Custom referral code for the affiliate (alphanumeric, 5-20 chars)',
  })
  @IsNotEmpty()
  @IsString()
  @Length(5, 20)
  @Matches(/^[a-zA-Z0-9]+$/, { message: 'Code must be alphanumeric' })
  code: string;
}
