import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';
import { TestHelpers } from './test-helpers';

describe('Cart and Checkout Flow (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let testUser: any;
  let userToken: string;
  let testCategory: any;
  let testProduct: any;
  let testCart: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Create test user
    testUser = await TestHelpers.createTestUser(
      prisma,
      'cartuser@test.com',
      'USER',
    );

    userToken = jwtService.sign({
      sub: testUser.id,
      email: testUser.email,
      role: 'USER', // Use hardcoded role since user.role is not directly accessible
    });

    // Create test category and product
    testCategory = await prisma.category.create({
      data: {
        name: 'Cart Test Category',
        slug: 'cart-test-category',
        description: 'Category for cart tests',
      },
    });

    testProduct = await prisma.product.create({
      data: {
        title: 'Cart Test Product',
        slug: 'cart-test-product',
        description: 'Product for cart tests',
        price: 49.99,
        categoryId: testCategory.id,
        sku: 'CART-001',
        stock: 100,
        category: {
          connect: { id: testCategory.id },
        },
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.cartItem.deleteMany({
      where: { cart: { userId: testUser.id } },
    });
    await prisma.cart.deleteMany({
      where: { userId: testUser.id },
    });
    await prisma.product.delete({
      where: { id: testProduct.id },
    });
    await prisma.category.delete({
      where: { id: testCategory.id },
    });
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    await app.close();
  });

  describe('Cart Management', () => {
    it('should get empty cart for new user', async () => {
      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items).toHaveLength(0);
    });

    it('should add item to cart', async () => {
      const addItemData = {
        productId: testProduct.id,
        quantity: 2,
      };

      const response = await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send(addItemData)
        .expect(200);

      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].productId).toBe(testProduct.id);
      expect(response.body.items[0].quantity).toBe(2);
      expect(response.body.total).toBe(99.98); // 49.99 * 2

      testCart = response.body;
    });

    it('should not add item to cart without authentication', async () => {
      const addItemData = {
        productId: testProduct.id,
        quantity: 1,
      };

      await request(app.getHttpServer())
        .post('/cart/items')
        .send(addItemData)
        .expect(401);
    });

    it('should not add non-existent product to cart', async () => {
      const addItemData = {
        productId: 'non-existent-id',
        quantity: 1,
      };

      await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send(addItemData)
        .expect(404);
    });

    it('should not add more items than available stock', async () => {
      const addItemData = {
        productId: testProduct.id,
        quantity: 200, // More than stock (100)
      };

      await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send(addItemData)
        .expect(400);
    });

    it('should update cart item quantity', async () => {
      const updateData = {
        quantity: 3,
      };

      const response = await request(app.getHttpServer())
        .patch(`/cart/items/${testCart.items[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.items[0].quantity).toBe(3);
      expect(response.body.total).toBe(149.97); // 49.99 * 3
    });

    it('should remove item from cart', async () => {
      await request(app.getHttpServer())
        .delete(`/cart/items/${testCart.items[0].id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.items).toHaveLength(0);
    });

    it('should clear entire cart', async () => {
      // Add items first
      await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 1,
        });

      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.items).toHaveLength(0);
    });
  });

  describe('Cart Validation', () => {
    it('should validate product availability on cart access', async () => {
      // Add item to cart
      await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 1,
        });

      // Make product out of stock
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stock: 0 },
      });

      // Cart should show item as unavailable
      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.items[0].available).toBe(false);

      // Restore stock
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { stock: 100 },
      });
    });

    it('should handle price changes in cart', async () => {
      // Add item to cart
      await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 2,
        });

      // Update product price
      await prisma.product.update({
        where: { id: testProduct.id },
        data: { price: 59.99 },
      });

      // Cart should reflect new price
      const response = await request(app.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.total).toBe(119.98); // 59.99 * 2
    });
  });

  describe('Order Creation', () => {
    let orderData: any;

    beforeAll(async () => {
      // Clear cart and add items for order test
      await request(app.getHttpServer())
        .delete('/cart')
        .set('Authorization', `Bearer ${userToken}`);

      await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 2,
        });

      orderData = {
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US',
        },
        paymentMethod: 'credit_card',
      };
    });

    it('should create order from cart', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('pending');
      expect(response.body.total).toBe(99.98); // 49.99 * 2
      expect(response.body.items).toHaveLength(1);
    });

    it('should not create order with empty cart', async () => {
      // Clear cart
      await request(app.getHttpServer())
        .delete('/cart')
        .set('Authorization', `Bearer ${userToken}`);

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(400);
    });

    it('should validate order data', async () => {
      const invalidOrderData = {
        shippingAddress: {
          street: '', // Invalid empty street
        },
      };

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(invalidOrderData)
        .expect(400);
    });

    it('should get user orders', async () => {
      // Create an order first
      await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 1,
        });

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData);

      const response = await request(app.getHttpServer())
        .get('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should get specific order details', async () => {
      // Create order
      const orderResponse = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData)
        .expect(201);

      const response = await request(app.getHttpServer())
        .get(`/orders/${orderResponse.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.id).toBe(orderResponse.body.id);
      expect(response.body.items).toHaveLength(1);
    });
  });

  describe('Stock Management', () => {
    it('should reserve stock when order is created', async () => {
      const initialStock = await prisma.product.findUnique({
        where: { id: testProduct.id },
        select: { stock: true },
      });

      // Add item to cart and create order
      await request(app.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          productId: testProduct.id,
          quantity: 5,
        });

      const orderData = {
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US',
        },
        paymentMethod: 'credit_card',
      };

      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send(orderData);

      const finalStock = await prisma.product.findUnique({
        where: { id: testProduct.id },
        select: { stock: true },
      });

      expect(finalStock!.stock).toBe(initialStock!.stock - 5);
    });
  });
});
