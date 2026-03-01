import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';

describe('Products Flow (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwtService: JwtService;

  let testUser: any;
  let adminUser: any;
  let userToken: string;
  let adminToken: string;
  let testCategory: any;
  let testProduct: any;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = moduleFixture.get<PrismaService>(PrismaService);
    jwtService = moduleFixture.get<JwtService>(JwtService);

    await app.init();

    // Create test users
    testUser = await createTestUser('user@test.com', 'USER');
    adminUser = await createTestUser('admin@test.com', 'ADMIN');

    userToken = generateToken(testUser);
    adminToken = generateToken(adminUser);

    // Create test category
    testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Test category description',
      },
    });
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.product.deleteMany({
      where: { categoryId: testCategory.id },
    });
    await prisma.category.delete({
      where: { id: testCategory.id },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [testUser.id, adminUser.id] } },
    });
    await app.close();
  });

  const createTestUser = async (email: string, role: string) => {
    // Map role to roleId
    const roleIdMap: Record<string, string> = {
      USER: '1',
      ADMIN: '2',
    };

    return prisma.user.create({
      data: {
        email,
        password: 'hashedpassword',
        name: 'Test User', // Use name instead of firstName/lastName
        roleId: roleIdMap[role], // Use roleId instead of role
      },
    });
  };

  const generateToken = (user: any) => {
    // Map roleId back to role for JWT
    const roleMap: Record<string, string> = {
      '1': 'USER',
      '2': 'ADMIN',
    };
    const userRole = roleMap[user.roleId] || 'USER';

    return jwtService.sign({ sub: user.id, email: user.email, role: userRole });
  };

  describe('Product CRUD Operations', () => {
    it('should create a product as admin', async () => {
      const productData = {
        title: 'Test Product',
        slug: 'test-product',
        description: 'Test product description',
        price: 29.99,
        categoryId: testCategory.id,
        sku: 'TEST-001',
        stock: 100,
        category: {
          connect: { id: testCategory.id },
        },
      };

      const response = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(productData.title);
      expect(response.body.price).toBe(productData.price);
      expect(response.body.slug).toBeDefined();

      testProduct = response.body;
    });

    it('should not create product as regular user', async () => {
      const productData = {
        title: 'Unauthorized Product',
        description: 'Should not be created',
        price: 19.99,
        categoryId: testCategory.id,
      };

      await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(productData)
        .expect(403);
    });

    it('should not create product without authentication', async () => {
      const productData = {
        title: 'Unauthorized Product',
        description: 'Should not be created',
        price: 19.99,
        categoryId: testCategory.id,
      };

      await request(app.getHttpServer())
        .post('/products')
        .send(productData)
        .expect(401);
    });

    it('should get all products (public)', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
      expect(response.body.products.length).toBeGreaterThan(0);
    });

    it('should get product by ID (public)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${testProduct.id}`)
        .expect(200);

      expect(response.body.id).toBe(testProduct.id);
      expect(response.body.title).toBe(testProduct.title);
    });

    it('should return 404 for non-existent product', async () => {
      await request(app.getHttpServer())
        .get('/products/non-existent-id')
        .expect(404);
    });

    it('should update product as admin', async () => {
      const updateData = {
        title: 'Updated Test Product',
        price: 39.99,
      };

      const response = await request(app.getHttpServer())
        .patch(`/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
      expect(response.body.price).toBe(updateData.price);
    });

    it('should not update product as regular user', async () => {
      const updateData = {
        title: 'Hacked Product',
        price: 1.99,
      };

      await request(app.getHttpServer())
        .patch(`/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(403);
    });

    it('should delete product as admin', async () => {
      await request(app.getHttpServer())
        .delete(`/products/${testProduct.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should not delete product as regular user', async () => {
      // First create another product to test deletion
      const newProduct = await request(app.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Another Test Product',
          description: 'For deletion test',
          price: 15.99,
          categoryId: testCategory.id,
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/products/${newProduct.body.id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Product Search and Filtering', () => {
    beforeAll(async () => {
      // Create test products for search
      await Promise.all([
        prisma.product.create({
          data: {
            title: 'Laptop Computer',
            slug: 'laptop-computer',
            description: 'High performance laptop',
            price: 999.99,
            categoryId: testCategory.id,
            sku: 'LAPTOP-001',
            stock: 50,
          },
        }),
        prisma.product.create({
          data: {
            title: 'Wireless Mouse',
            slug: 'wireless-mouse',
            description: 'Ergonomic wireless mouse',
            price: 29.99,
            categoryId: testCategory.id,
            sku: 'MOUSE-001',
            stock: 100,
          },
        }),
        prisma.product.create({
          data: {
            title: 'Mechanical Keyboard',
            slug: 'mechanical-keyboard',
            description: 'RGB mechanical keyboard',
            price: 149.99,
            categoryId: testCategory.id,
            sku: 'KEYBOARD-001',
            stock: 75,
          },
        }),
      ]);
    });

    it('should search products by title', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?search=Laptop')
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].title).toContain('Laptop');
    });

    it('should filter products by category', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products?categoryId=${testCategory.id}`)
        .expect(200);

      expect(response.body.products.length).toBeGreaterThan(0);
      response.body.products.forEach((product: any) => {
        expect(product.categoryId).toBe(testCategory.id);
      });
    });

    it('should paginate products', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?page=1&limit=2')
        .expect(200);

      expect(response.body.products).toHaveLength(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.total).toBeGreaterThan(2);
    });

    it('should sort products by price', async () => {
      const response = await request(app.getHttpServer())
        .get('/products?sortBy=price&sortOrder=asc')
        .expect(200);

      const products = response.body.products;
      for (let i = 1; i < products.length; i++) {
        expect(products[i - 1].price).toBeLessThanOrEqual(products[i].price);
      }
    });
  });

  describe('Product Variants', () => {
    let testProductWithVariants: any;

    beforeAll(async () => {
      testProductWithVariants = await prisma.product.create({
        data: {
          title: 'T-Shirt',
          slug: 't-shirt-variant',
          description: 'Cotton t-shirt',
          price: 19.99,
          categoryId: testCategory.id,
          sku: 'TSHIRT-001',
          stock: 0,
          variants: {
            create: [
              {
                size: 'Small',
                sku: 'TSHIRT-001-S',
                priceDiff: 0,
                stock: 50,
              },
              {
                size: 'Medium',
                sku: 'TSHIRT-001-M',
                priceDiff: 0,
                stock: 75,
              },
              {
                size: 'Large',
                sku: 'TSHIRT-001-L',
                priceDiff: 5,
                stock: 25,
              },
            ],
          },
        },
      });
    });

    afterAll(async () => {
      await prisma.product.delete({
        where: { id: testProductWithVariants.id },
      });
    });

    it('should get product with variants', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${testProductWithVariants.id}`)
        .expect(200);

      expect(response.body.variants).toHaveLength(3);
      expect(response.body.variants[0]).toHaveProperty('size');
      expect(response.body.variants[0]).toHaveProperty('stock');
    });

    it('should update product variant stock', async () => {
      const variant = testProductWithVariants.variants[0];

      const response = await request(app.getHttpServer())
        .patch(`/products/${testProductWithVariants.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          variants: [
            {
              id: variant.id,
              stock: 100,
            },
          ],
        })
        .expect(200);

      const updatedVariant = response.body.variants.find(
        (v: any) => v.id === variant.id,
      );
      expect(updatedVariant.stock).toBe(100);
    });
  });
});
