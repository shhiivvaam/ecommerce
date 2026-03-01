import { PrismaService } from '../src/prisma/prisma.service';

/**
 * Test Database Setup Script
 * Ensures required test data exists for integration tests
 */
export async function setupTestDatabase(prisma: PrismaService) {
  console.log('Setting up test database...');

  try {
    // Ensure required roles exist
    const userRole = await prisma.role.upsert({
      where: { id: '1' }, // Use ID instead of name
      update: {},
      create: {
        id: '1',
        name: 'USER',
      },
    });

    const adminRole = await prisma.role.upsert({
      where: { id: '2' }, // Use ID instead of name
      update: {},
      create: {
        id: '2',
        name: 'ADMIN',
      },
    });

    console.log(
      `Roles created/verified: USER(${userRole.id}), ADMIN(${adminRole.id})`,
    );

    // Update role ID mappings in test helpers if needed
    return {
      USER_ROLE_ID: userRole.id,
      ADMIN_ROLE_ID: adminRole.id,
    };
  } catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

/**
 * Clean up test database
 * Removes test data while preserving essential data
 */
export async function cleanupTestDatabase(prisma: PrismaService) {
  console.log('Cleaning up test database...');

  try {
    // Clean up in correct order due to foreign key constraints
    await prisma.cartItem.deleteMany({
      where: {
        cart: {
          user: {
            email: {
              contains: '@test.com',
            },
          },
        },
      },
    });

    await prisma.cart.deleteMany({
      where: {
        user: {
          email: {
            contains: '@test.com',
          },
        },
      },
    });

    await prisma.order.deleteMany({
      where: {
        user: {
          email: {
            contains: '@test.com',
          },
        },
      },
    });

    await prisma.review.deleteMany({
      where: {
        product: {
          title: {
            contains: 'Test',
          },
        },
      },
    });

    await prisma.variant.deleteMany({
      where: {
        product: {
          title: {
            contains: 'Test',
          },
        },
      },
    });

    await prisma.product.deleteMany({
      where: {
        title: {
          contains: 'Test',
        },
      },
    });

    await prisma.category.deleteMany({
      where: {
        name: {
          contains: 'Test',
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        email: {
          contains: '@test.com',
        },
      },
    });

    console.log('Test database cleanup completed');
  } catch (error) {
    console.error('Error cleaning up test database:', error);
    throw error;
  }
}
