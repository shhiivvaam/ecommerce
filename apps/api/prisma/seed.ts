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

    // 2. Create Admin and Customer Users
    const sharedPassword = await bcrypt.hash('Reyva@shikri26', 10);
    
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@reyva.co.in' },
        update: { password: sharedPassword },
        create: {
            email: 'admin@reyva.co.in',
            password: sharedPassword,
            name: 'Super Admin',
            roleId: adminRole.id,
            isVerified: true
        },
    });

    const customerUser = await prisma.user.upsert({
        where: { email: 'customer@reyva.co.in' },
        update: { password: sharedPassword },
        create: {
            email: 'customer@reyva.co.in',
            password: sharedPassword,
            name: 'Customer User',
            roleId: customerRole.id,
            isVerified: true
        },
    });

    // 3. Create Settings (Multi-product by default)
    await prisma.settings.createMany({
        data: [{ storeMode: 'MULTI', taxPercent: 5.0, shippingFlat: 10.0 }],
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

    await prisma.product.upsert({
        where: { slug: 'smart-fitness-watch' },
        update: {},
        create: {
            title: 'Smart Fitness Watch',
            slug: 'smart-fitness-watch',
            description: 'Track your health and fitness with this sleek smartwatch.',
            price: 199.99,
            categoryId: catAudio.id,
            gallery: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000&auto=format&fit=crop'],
            stock: 100
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
