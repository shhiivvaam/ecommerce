import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
  ) {}

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
      '-' +
      Math.random().toString(36).substring(2, 8)
    );
  }

  async create(data: CreateProductDto) {
    // Map DTO 'name' to Prisma 'title', and auto-generate the required unique slug
    const productData = {
      title: data.name,
      slug: this.generateSlug(data.name),
      description: data.description,
      price: data.price,
      stock: data.stock ?? 0,
      gallery: data.imageUrl ? { set: [data.imageUrl] } : { set: [] },
    } as Prisma.ProductCreateInput;

    // If category is provided, connect it. Otherwise, create product without category if schema permits,
    // or we have to assign a default. (Assuming default category or nullable in reality, though schema has it required. Let's make an 'Uncategorized' fallback if needed, but let's connect if provided).
    // Wait, schema requires categoryId. We must ensure it's handled.
    if (data.categoryId) {
      productData.category = {
        connect: { id: data.categoryId },
      };
    } else {
      // For safety if categoryId is required but not passed, find or create "Uncategorized"
      const defaultCategory = await this.prisma.category.upsert({
        where: { slug: 'uncategorized' },
        update: {},
        create: { name: 'Uncategorized', slug: 'uncategorized' },
      });
      productData.category = {
        connect: { id: defaultCategory.id },
      };
    }

    return this.prisma.product.create({ data: productData });
  }

  async findAll(query: ProductQueryDto = {}) {
    const isSingle = await this.settings.isSingleProductMode();
    const singleId = await this.settings.getSingleProductId();

    if (isSingle && singleId) {
      return this.prisma.product.findMany({
        where: { id: singleId },
        include: { variants: true, category: true },
      });
    }

    // Default multi-product fetching with secure pagination and search parsing
    const search = query.search;
    const categoryId = query.categoryId;
    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, query.limit || 10);
    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { variants: true, category: true },
        orderBy: { createdAt: 'desc' }, // Default sorting
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total, page, limit };
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { variants: true, category: true, reviews: true },
    });
    if (!product) throw new NotFoundException('Product not found');

    // Safety check if in single mode
    const isSingle = await this.settings.isSingleProductMode();
    const singleId = await this.settings.getSingleProductId();
    if (isSingle && singleId && singleId !== id) {
      throw new NotFoundException(
        'Store is currently restricted to a single product',
      );
    }

    return product;
  }

  async update(id: string, data: UpdateProductDto) {
    const updateData: Prisma.ProductUpdateInput = {};

    if (data.name) {
      updateData.title = data.name;
    }
    if (data.description) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.stock !== undefined) updateData.stock = data.stock;

    // Push the new image to gallery array if provided
    if (data.imageUrl) {
      updateData.gallery = {
        push: data.imageUrl,
      };
    }

    if (data.categoryId) {
      updateData.category = {
        connect: { id: data.categoryId },
      };
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.product.delete({ where: { id } });
  }
}
