import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host:
        this.configService.get<string>('SMTP_HOST') || 'smtp.ethereal.email',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: this.configService.get<boolean>('SMTP_SECURE') || false,
      auth: {
        user: this.configService.get<string>('SMTP_USER') || 'test_user',
        pass: this.configService.get<string>('SMTP_PASS') || 'test_pass',
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
      const frontendUrl =
        this.configService.get<string>('FRONTEND_URL') ||
        'http://localhost:3000';
      const resetLink = `${frontendUrl}/reset-password?token=${token}`;
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
