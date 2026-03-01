import { PrismaService } from '../src/prisma/prisma.service';
import { setupTestDatabase, cleanupTestDatabase } from './test-setup-db';
import { TestHelpers } from './test-helpers';

// Global test setup
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    'postgresql://test:test@localhost:5432/ecommerce_test';
  process.env.JWT_SECRET = 'test-jwt-secret-key';
  process.env.REDIS_URL = 'redis://localhost:6379/1'; // Use different DB for tests

  // Disable logging during tests
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();

  // Setup test database with required data
  const prisma = new PrismaService();
  try {
    const roleIds = await setupTestDatabase(prisma);
    TestHelpers.setRoleIds(roleIds);
    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to setup test database:', error);
    await prisma.$disconnect();
    throw error;
  }
});

afterAll(async () => {
  // Clean up test database
  const prisma = new PrismaService();
  try {
    await cleanupTestDatabase(prisma);
    await prisma.$disconnect();
  } catch (error) {
    console.error('Failed to cleanup test database:', error);
    await prisma.$disconnect();
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Global timeout for tests
jest.setTimeout(30000);
