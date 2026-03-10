import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CreateCheckoutSessionDto } from './dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(OptionalJwtAuthGuard)
  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a Razorpay order',
    description:
      'Initiates a Razorpay order for the given cart items. Returns the order ID and amount details.',
  })
  @ApiBody({ type: CreateCheckoutSessionDto })
  @ApiResponse({
    status: 201,
    description: 'Razorpay order created',
  })
  @ApiUnauthorizedResponse({ description: 'JWT token is missing or invalid' })
  async createRazorpayOrder(@Body() body: CreateCheckoutSessionDto) {
    return this.paymentsService.createRazorpayOrder(body.orderId);
  }

  @Post('verify')
  @ApiOperation({
    summary: 'Verify Razorpay payment signature',
    description:
      'Verifies the payment signature returned by the Razorpay checkout script and finalizes the order.',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment verified successfully',
  })
  async verifyPayment(
    @Body('orderId') orderId: string,
    @Body('razorpayOrderId') razorpayOrderId: string,
    @Body('razorpayPaymentId') razorpayPaymentId: string,
    @Body('signature') signature: string,
  ) {
    if (!orderId || !razorpayOrderId || !razorpayPaymentId || !signature) {
      throw new BadRequestException('Missing payment verification details');
    }

    await this.paymentsService.verifyPayment(
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      signature,
    );

    return { success: true };
  }
}
