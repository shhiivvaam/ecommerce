import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderTrackingDto {
  @ApiProperty({ description: 'Tracking Number for the shipment' })
  @IsNotEmpty()
  @IsString()
  trackingNumber: string;

  @ApiProperty({ description: 'Carrier name (e.g. UPS, FedEx, USPS)' })
  @IsNotEmpty()
  @IsString()
  carrier: string;
}
