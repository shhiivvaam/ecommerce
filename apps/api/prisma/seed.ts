import { PrismaClient, RoleType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 1. Create Roles
    const adminRole = await prisma.role.upsert({
        where: { id: 'role_admin' },
        update: {},
        create: { id: 'role_admin', name: RoleType.ADMIN },
    });

    const customerRole = await prisma.role.upsert({
        where: { id: 'role_customer' },
        update: {},
        create: { id: 'role_customer', name: RoleType.CUSTOMER },
    });

    // 2. Create Admin User
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@reyva.com' },
        update: {},
        create: {
            email: 'admin@reyva.com',
            password: hashedPassword,
            name: 'Super Admin',
            roleId: adminRole.id,
            isVerified: true
        },
    });

    // 3. Create Settings (Multi-product by default)
    await prisma.settings.createMany({
        data: [{ storeMode: 'multi', taxPercent: 5.0, shippingFlat: 10.0 }],
        skipDuplicates: true
    });

    // 4. Create Categories
    const catAudio = await prisma.category.upsert({
        where: { slug: 'audio' },
        update: {},
        create: { name: 'Audio & Sound', slug: 'audio', description: 'Premium headphones and speakers' }
    });

    // 5. Create Products
    await prisma.product.upsert({
        where: { slug: 'premium-wireless-headphones' },
        update: {},
        create: {
            title: 'Premium Wireless Headphones',
            slug: 'premium-wireless-headphones',
            description: 'Immersive noise-cancelling audio experience tailored for audiophiles.',
            price: 299.99,
            categoryId: catAudio.id,
            gallery: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop'],
            stock: 50
        }
    });

    console.log('Database seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
