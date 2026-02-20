import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter: nodemailer.Transporter;

    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.ethereal.email',
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true' || false,
            auth: {
                user: process.env.SMTP_USER || 'test_user',
                pass: process.env.SMTP_PASS || 'test_pass',
            },
        });
    }

    async sendOrderConfirmation(to: string, orderId: string, total: number) {
        try {
            await this.transporter.sendMail({
                from: '"NexCart Support" <support@nexcart.com>',
                to,
                subject: `Order Confirmation - #${orderId}`,
                html: `<h2>Thank you for your order!</h2><p>Your order #${orderId} for $${total} has been confirmed. We will send tracking details soon!</p>`,
            });
        } catch (error) {
            console.error('Failed to send confirmation email:', error);
        }
    }

    async sendPasswordReset(to: string, token: string) {
        try {
            const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
            await this.transporter.sendMail({
                from: '"NexCart Support" <support@nexcart.com>',
                to,
                subject: `Reset your password`,
                html: `<h2>Password Reset Request</h2><p>Click <a href="${resetLink}">here</a> to reset your password. The link expires in 15 minutes.</p>`,
            });
        } catch (error) {
            console.error('Failed to send reset email:', error);
        }
    }

    async sendWelcomeEmail(to: string, name: string) {
        try {
            await this.transporter.sendMail({
                from: '"NexCart Support" <support@nexcart.com>',
                to,
                subject: `Welcome to NexCart!`,
                html: `<h2>Welcome ${name}!</h2><p>We're thrilled to have you. Enjoy exploring our premium products.</p>`,
            });
        } catch (error) {
            console.error('Failed to send welcome email:', error);
        }
    }
}
