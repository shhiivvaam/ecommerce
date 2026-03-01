import {
  Controller,
  Post,
  Body,
  Req,
  Headers,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateCheckoutSessionDto,
  CheckoutSessionResponseDto,
} from './dto/payment.dto';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a Stripe checkout session',
    description:
      'Initiates a Stripe checkout session for the given order. Returns a redirect URL to the Stripe-hosted payment page.',
  })
  @ApiBody({ type: CreateCheckoutSessionDto })
  @ApiResponse({
    status: 201,
    description: 'Checkout session created',
    type: CheckoutSessionResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'JWT token is missing or invalid' })
  async createCheckoutSession(@Body() body: CreateCheckoutSessionDto) {
    return this.paymentsService.createCheckoutSession(
      body.orderId,
      body.items,
      body.successUrl,
      body.cancelUrl,
    );
  }

  @Post('webhook')
  @ApiOperation({
    summary: 'Stripe webhook handler',
    description:
      'Endpoint for Stripe to send payment event webhooks. Do NOT call this manually — it requires a valid Stripe signature header.',
  })
  @ApiHeader({
    name: 'stripe-signature',
    description: 'Stripe webhook signature (automatically sent by Stripe)',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook received',
    schema: { example: { received: true } },
  })
  @ApiBadRequestResponse({ description: 'Invalid Stripe webhook signature' })
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    let event: any;
    try {
      const rawBody = req.rawBody || req.body;
      event = this.paymentsService.constructEvent(
        rawBody as string | Buffer,
        signature,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown Error';
      throw new BadRequestException(`Webhook Error: ${msg}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await this.paymentsService.verifyPayment(orderId, session.id);
      }
    }

    return { received: true };
  }
}
