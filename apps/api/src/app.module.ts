import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { CartModule } from './cart/cart.module';
import { SettingsModule } from './settings/settings.module';
import { StorageModule } from './storage/storage.module';
import { EmailModule } from './email/email.module';
import { validateEnv } from './config/env.config';
import { AddressesModule } from './addresses/addresses.module';
import { CategoriesModule } from './categories/categories.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CouponsModule } from './coupons/coupons.module';
import { WishlistsModule } from './wishlists/wishlists.module';
import { BannersModule } from './banners/banners.module';
import { VariantsModule } from './variants/variants.module';
import { AdminModule } from './admin/admin.module';
import { MonitoringModule } from './common/monitoring.module';
import { CsrfMiddleware } from './common/guards/csrf.middleware';

@Module({
  controllers: [HealthController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Making it global so we don't have to import ConfigModule everywhere
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests per IP per minute
      },
    ]),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const isProduction = configService.get('NODE_ENV') === 'production';
        const redisUrl = configService.get<string>('REDIS_URL');

        // Redis configuration for production
        if (isProduction && redisUrl) {
          try {
            const { redisStore } = await import('cache-manager-redis-yet');
            return {
              store: await redisStore({
                url: redisUrl,
                ttl: 60 * 60 * 1000, // 1 hour default
                isCacheable: (value: any) => {
                  // Don't cache errors or null values
                  return value !== null && value !== undefined;
                },
              }),
            };
          } catch (err) {
            console.warn(
              'Redis unavailable for caching, falling back to memory:',
              err,
            );
          }
        }

        // In-memory cache for development
        return {
          ttl: 15 * 60 * 1000, // 15 minutes for development
          max: 100, // Maximum number of items in cache
          isCacheable: (value: any) => {
            return value !== null && value !== undefined;
          },
        };
      },
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    OrdersModule,
    PaymentsModule,
    CartModule,
    SettingsModule,
    StorageModule,
    EmailModule,
    AddressesModule,
    CategoriesModule,
    ReviewsModule,
    CouponsModule,
    WishlistsModule,
    BannersModule,
    VariantsModule,
    AdminModule,
    MonitoringModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CsrfMiddleware).forRoutes('*path'); // Apply CSRF protection to all routes
  }
}
