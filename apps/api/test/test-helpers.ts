import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

export class TestHelpers {
  private static roleIds: Record<string, string> = {};

  static setRoleIds(roleIds: Record<string, string>) {
    this.roleIds = roleIds;
  }

  static async createTestUser(
    prisma: PrismaService,
    email: string,
    role: 'USER' | 'ADMIN' = 'USER',
    overrides: Partial<any> = {},
  ) {
    const hashedPassword = await bcrypt.hash('TestPassword123!', 10);

    return prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Test User',
        roleId: this.roleIds[role], // Use dynamic roleId from setup
        ...overrides,
      },
    });
  }

  static async createTestCategory(
    prisma: PrismaService,
    name: string,
    overrides: Partial<any> = {},
  ) {
    return prisma.category.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        description: `Test category: ${name}`,
        ...overrides,
      },
    });
  }

  static async createTestProduct(
    prisma: PrismaService,
    categoryId: string,
    overrides: Partial<any> = {},
  ) {
    // Generate slug from title
    const title = overrides.title || 'Test Product';
    const slug = title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    return prisma.product.create({
      data: {
        title,
        slug,
        description: 'Test product description',
        price: 29.99,
        sku: 'TEST-' + Math.random().toString(36).substr(2, 9),
        stock: 100,
        categoryId,
        ...overrides,
      },
    });
  }

  static async createTestCart(
    prisma: PrismaService,
    userId: string,
    productId: string,
    quantity: number = 1,
  ) {
    const cart = await prisma.cart.create({
      data: {
        userId,
      },
    });

    return prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity,
      },
    });
  }

  static generateTestToken(
    jwtService: JwtService,
    user: { id: string; email: string; role: string },
  ): string {
    return jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  static async cleanupTestData(
    prisma: PrismaService,
    userIds: string[] = [],
    categoryIds: string[] = [],
    productIds: string[] = [],
  ) {
    // Clean up in correct order due to foreign key constraints
    await prisma.cartItem.deleteMany({
      where: {
        cart: { userId: { in: userIds } },
      },
    });

    await prisma.cart.deleteMany({
      where: { userId: { in: userIds } },
    });

    await prisma.order.deleteMany({
      where: { userId: { in: userIds } },
    });

    await prisma.review.deleteMany({
      where: { productId: { in: productIds } },
    });

    await prisma.variant.deleteMany({
      where: { productId: { in: productIds } },
    });

    await prisma.product.deleteMany({
      where: { id: { in: productIds } },
    });

    await prisma.category.deleteMany({
      where: { id: { in: categoryIds } },
    });

    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
  }

  static async setupTestDatabase(prisma: PrismaService) {
    // Ensure clean state
    await this.cleanupTestData(prisma);
  }

  static createMockPaymentData() {
    return {
      paymentMethodId: 'pm_test_123456789',
      paymentMethod: 'credit_card',
      billingAddress: {
        street: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        country: 'US',
      },
    };
  }

  static createMockShippingAddress() {
    return {
      street: '456 Shipping Ave',
      city: 'Ship Town',
      state: 'ST',
      zipCode: '67890',
      country: 'US',
    };
  }

  static async waitForCondition(
    condition: () => Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100,
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }

  static generateRandomEmail(): string {
    return `test-${Math.random().toString(36).substr(2, 9)}@example.com`;
  }

  static generateRandomString(length: number = 10): string {
    return Math.random().toString(36).substr(2, length);
  }
}

export interface TestUser {
  id: string;
  email: string;
  role: string;
  token: string;
}

export interface TestProduct {
  id: string;
  title: string;
  price: number;
  stock: number;
  categoryId: string;
}

export interface TestCategory {
  id: string;
  name: string;
  slug: string;
}

export class TestDataFactory {
  private static userIds: string[] = [];
  private static categoryIds: string[] = [];
  private static productIds: string[] = [];

  static async createFullUserFlow(
    prisma: PrismaService,
    jwtService: JwtService,
    role: 'USER' | 'ADMIN' = 'USER',
  ): Promise<TestUser & { category: TestCategory; product: TestProduct }> {
    const email = TestHelpers.generateRandomEmail();

    const user = await TestHelpers.createTestUser(prisma, email, role);
    const token = TestHelpers.generateTestToken(jwtService, {
      id: user.id,
      email: user.email,
      role: role, // Use the role parameter since user.role is not directly accessible
    });

    const category = await TestHelpers.createTestCategory(
      prisma,
      'Test Category',
    );
    const product = await TestHelpers.createTestProduct(prisma, category.id);

    this.userIds.push(user.id);
    this.categoryIds.push(category.id);
    this.productIds.push(product.id);

    return {
      id: user.id,
      email: user.email,
      role: role, // Use the role parameter
      token,
      category,
      product,
    };
  }

  static async cleanupAll(prisma: PrismaService) {
    await TestHelpers.cleanupTestData(
      prisma,
      this.userIds,
      this.categoryIds,
      this.productIds,
    );

    this.userIds = [];
    this.categoryIds = [];
    this.productIds = [];
  }
}

// Custom matchers for Jest
expect.extend({
  toBeValidUser(received: any) {
    const pass =
      received &&
      typeof received.id === 'string' &&
      typeof received.email === 'string' &&
      typeof received.role === 'string' &&
      !received.password; // Password should not be returned

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid user`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be a valid user with id, email, role and no password`,
        pass: false,
      };
    }
  },

  toBeValidProduct(received: any) {
    const pass =
      received &&
      typeof received.id === 'string' &&
      typeof received.title === 'string' &&
      typeof received.price === 'number' &&
      typeof received.stock === 'number' &&
      typeof received.categoryId === 'string';

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid product`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be a valid product with id, title, price, stock, and categoryId`,
        pass: false,
      };
    }
  },

  toBeValidCart(received: any) {
    const pass =
      received &&
      Array.isArray(received.items) &&
      typeof received.total === 'number' &&
      received.total >= 0;

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid cart`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be a valid cart with items array and total number`,
        pass: false,
      };
    }
  },
});

// Extend Jest matchers type
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidUser(): R;
      toBeValidProduct(): R;
      toBeValidCart(): R;
    }
  }
}
