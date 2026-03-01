import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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

  private async generateSlug(title: string): Promise<string> {
    const base = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Check for existing slugs with this base and find next available
    const existing = await this.prisma.product.findMany({
      where: { slug: { startsWith: base } },
      select: { slug: true },
    });

    if (existing.length === 0) return base;

    const suffixes = existing.map((p) => {
      const match = p.slug.match(/-(\d+)$/);
      return match ? parseInt(match[1], 10) : 0;
    });

    return `${base}-${Math.max(...suffixes) + 1}`;
  }

  async create(data: CreateProductDto) {
    // Block creation in single product mode
    const isSingle = await this.settings.isSingleProductMode();
    if (isSingle) {
      throw new ForbiddenException(
        'Cannot create products while store is in single-product mode',
      );
    }

    // Map DTO 'name' to Prisma 'title', and auto-generate the required unique slug
    const productData: Prisma.ProductCreateInput = {
      title: data.title,
      slug: await this.generateSlug(data.title),
      description: data.description,
      price: data.price,
      discounted: data.discounted,
      stock: data.stock ?? 0,
      gallery: data.gallery ? { set: data.gallery } : { set: [] },
      tags: data.tags ? { set: data.tags } : { set: [] },
      variants: data.variants
        ? {
            create: data.variants.map((v) => ({
              size: v.size,
              color: v.color,
              sku: v.sku,
              stock: v.stock,
              priceDiff: v.priceDiff,
            })),
          }
        : undefined,
      category: { connect: { id: 'temp' } }, // Will be overwritten below
    };

    if (data.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) throw new NotFoundException('Category not found');

      productData.category = {
        connect: { id: data.categoryId },
      };
    } else {
      let defaultCategory = await this.prisma.category.findUnique({
        where: { slug: 'uncategorized' },
        select: { id: true },
      });
      if (!defaultCategory) {
        try {
          defaultCategory = await this.prisma.category.create({
            data: { name: 'Uncategorized', slug: 'uncategorized' },
            select: { id: true },
          });
        } catch {
          defaultCategory = await this.prisma.category.findUniqueOrThrow({
            where: { slug: 'uncategorized' },
            select: { id: true },
          });
        }
      }
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
      const products = await this.prisma.product.findMany({
        where: { id: singleId },
        include: { variants: true, category: true },
      });
      return {
        data: products,
        total: products.length,
        page: 1,
        limit: Math.max(1, query.limit || 10),
        totalPages: 1,
      };
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

    const totalPages = Math.ceil(total / limit);

    return { data: products, total, page, limit, totalPages };
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
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    // In single product mode, only allow updating the designated product
    const isSingle = await this.settings.isSingleProductMode();
    const singleId = await this.settings.getSingleProductId();
    if (isSingle && singleId && singleId !== id) {
      throw new NotFoundException(
        'Store is in single-product mode; this product cannot be modified',
      );
    }

    const updateData: Prisma.ProductUpdateInput = {
      title: data.title,
      description: data.description,
      price: data.price,
      discounted: data.discounted,
      stock: data.stock,
      gallery: data.gallery ? { set: data.gallery } : undefined,
      tags: data.tags ? { set: data.tags } : undefined,
      variants: data.variants
        ? {
            deleteMany: {},
            create: data.variants.map((v) => ({
              size: v.size,
              color: v.color,
              sku: v.sku,
              stock: v.stock,
              priceDiff: v.priceDiff,
            })),
          }
        : undefined,
    };

    if (data.title && data.title !== product.title) {
      updateData.slug = await this.generateSlug(data.title);
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
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Product not found');

    // Prevent deleting the primary product in single-product mode
    const isSingle = await this.settings.isSingleProductMode();
    const singleId = await this.settings.getSingleProductId();
    if (isSingle && singleId === id) {
      throw new ForbiddenException(
        'Cannot delete the primary product while store is in single-product mode',
      );
    }
    return this.prisma.product.delete({ where: { id } });
  }
}
