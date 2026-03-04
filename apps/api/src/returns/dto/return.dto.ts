import { IsNotEmpty, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReturnRequestDto {
  @ApiProperty({ description: 'Reason for return' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

export class UpdateReturnRequestStatusDto {
  @ApiProperty({
    description: 'New status for the return request',
    enum: ['APPROVED', 'REJECTED', 'REFUNDED'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['APPROVED', 'REJECTED', 'REFUNDED'])
  status: 'APPROVED' | 'REJECTED' | 'REFUNDED';
}
