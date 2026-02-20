import { Controller, Post, Body, Req, Headers, BadRequestException, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @UseGuards(JwtAuthGuard)
    @Post('checkout')
    async createCheckoutSession(@Body() body: { orderId: string, items: any[], successUrl: string, cancelUrl: string }) {
        return this.paymentsService.createCheckoutSession(body.orderId, body.items, body.successUrl, body.cancelUrl);
    }

    @Post('webhook')
    async handleStripeWebhook(@Req() req: any, @Headers('stripe-signature') signature: string) {
        let event;
        try {
            // Using internal raw body parser hook if configured, or fallback 
            const rawBody = req.rawBody || req.body;
            event = await this.paymentsService.constructEvent(rawBody, signature);
        } catch (err: any) {
            throw new BadRequestException(`Webhook Error: ${err.message}`);
        }

        if (event.type === 'checkout.session.completed') {
            const session = event.data.object as any;
            const orderId = session.metadata.orderId;
            await this.paymentsService.verifyPayment(orderId, session.id);
        }

        return { received: true };
    }
}
