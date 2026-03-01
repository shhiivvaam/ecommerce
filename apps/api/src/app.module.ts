import { Module } from '@nestjs/common';
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
        const url =
          configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        try {
          const { redisStore } = await import('cache-manager-redis-yet');
          const store = await redisStore({ url, ttl: 60 * 60 * 1000 });
          return { store };
        } catch (err) {
          // Redis is unavailable — fall back to in-memory cache.
          // This is acceptable for development. Log a warning in production.
          console.warn(
            '[CacheModule] Redis unavailable, falling back to in-memory cache:',
            (err as Error).message,
          );
          return {}; // Default: NestJS built-in in-memory store
        }
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
