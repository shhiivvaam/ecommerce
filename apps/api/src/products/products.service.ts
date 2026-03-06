import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { parse } from 'csv-parse/sync';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';
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
    private audit: AuditService,
    @InjectQueue('products_import') private importQueue: Queue,
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

  async queueCsvImport(userId: string, csvString: string) {
    await this.importQueue.add('import-csv', {
      csvString,
      userId,
    });
    return { message: 'Import queued successfully' };
  }

  async processCsvImport(csvString: string, userId: string) {
    try {
      const records = parse(csvString, {
        columns: true,
        skip_empty_lines: true,
      });

      let importedCount = 0;
      let failedCount = 0;

      interface CsvRecord {
        title?: string;
        name?: string;
        price?: string;
        stock?: string;
        description?: string;
        tags?: string;
        categoryId?: string;
      }
      for (const record of records as CsvRecord[]) {
        try {
          const title = record.title || record.name;
          if (!title) continue;

          const price = record.price ? parseFloat(record.price) : 0;
          const stock = record.stock ? parseInt(record.stock, 10) : 0;
          const description = record.description || '';
          const tags = record.tags
            ? record.tags.split(',').map((t: string) => t.trim())
            : [];
          const categoryId = record.categoryId || undefined;

          await this.create(userId, {
            title: title,
            price: price,
            stock,
            description,
            tags,
            categoryId,
          });

          importedCount++;
        } catch {
          failedCount++;
        }
      }

      await this.audit.logAction(userId, 'IMPORT_BATCH', 'Product', 'bulk', {
        importedCount,
        failedCount,
        total: records.length,
      });

      return { importedCount, failedCount };
    } catch (error) {
      const err = error as Error;
      await this.audit.logAction(
        userId,
        'IMPORT_BATCH_FAILED',
        'Product',
        'bulk',
        { error: err.message },
      );
      throw err;
    }
  }

  async generateCsvExport(): Promise<string> {
    const products = await this.prisma.product.findMany({
      include: { category: true },
    });

    const headers = [
      'id',
      'title',
      'price',
      'stock',
      'categoryId',
      'categoryName',
      'tags',
      'createdAt',
    ];
    const rows = products.map((p) =>
      [
        p.id,
        `"${p.title.replace(/"/g, '""')}"`,
        p.price,
        p.stock,
        p.categoryId,
        `"${p.category?.name?.replace(/"/g, '""') || ''}"`,
        `"${p.tags.join(',')}"`,
        p.createdAt.toISOString(),
      ].join(','),
    );

    return [headers.join(','), ...rows].join('\n');
  }

  async create(userId: string, data: CreateProductDto) {
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
      gallery: data.gallery ? data.gallery : [],
      tags: data.tags ? data.tags : [],
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
      category: { connect: { id: 'pending' } }, // Temporary placeholder
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

    const product = await this.prisma.product.create({ data: productData });
    await this.audit.logAction(
      userId,
      'CREATE',
      'Product',
      product.id,
      data as unknown as import('@prisma/client').Prisma.InputJsonValue,
    );
    return product;
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
    const minPrice = query.minPrice;
    const maxPrice = query.maxPrice;
    const minRating = query.minRating;
    const tags = query.tags;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

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

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (minRating !== undefined) {
      where.averageRating = { gte: minRating };
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: typeof tags === 'string' ? [tags] : tags };
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    const direction = sortOrder === 'asc' ? 'asc' : 'desc';

    switch (sortBy) {
      case 'price':
        orderBy = { price: direction };
        break;
      case 'title':
        orderBy = { title: direction };
        break;
      case 'rating':
        orderBy = { averageRating: direction };
        break;
      case 'createdAt':
      default:
        orderBy = { createdAt: direction };
        break;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: { variants: true, category: true },
        orderBy,
      }),
      this.prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return { data: products, total, page, limit, totalPages };
  }

  async findOne(idOrSlug: string) {
    let product = await this.prisma.product.findUnique({
      where: { id: idOrSlug },
      include: {
        variants: true,
        category: true,
        reviews: true,
        relatedProducts: true,
      },
    });

    if (!product) {
      product = await this.prisma.product.findUnique({
        where: { slug: idOrSlug },
        include: {
          variants: true,
          category: true,
          reviews: true,
          relatedProducts: true,
        },
      });
    }

    if (!product) throw new NotFoundException('Product not found');

    // Safety check if in single mode
    const isSingle = await this.settings.isSingleProductMode();
    const singleId = await this.settings.getSingleProductId();
    if (isSingle && singleId && singleId !== product.id) {
      throw new NotFoundException(
        'Store is currently restricted to a single product',
      );
    }

    return product;
  }

  async findRelated(idOrSlug: string, limit: number = 4) {
    let product = await this.prisma.product.findUnique({
      where: { id: idOrSlug },
      select: { id: true, categoryId: true },
    });

    if (!product) {
      product = await this.prisma.product.findUnique({
        where: { slug: idOrSlug },
        select: { id: true, categoryId: true },
      });
    }

    if (!product) throw new NotFoundException('Product not found');

    const productId = product.id;

    // Check for explicit related products
    const withRelated = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { relatedProducts: true },
    });

    // Return explicit related products if they exist
    if (
      withRelated?.relatedProducts &&
      withRelated.relatedProducts.length > 0
    ) {
      return withRelated.relatedProducts.slice(0, limit);
    }

    // Fallback: Return products from the same category
    const relatedByCategory = await this.prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: productId },
      },
      take: limit,
      orderBy: { averageRating: 'desc' },
    });

    return relatedByCategory;
  }

  async update(userId: string, id: string, data: UpdateProductDto) {
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
      relatedProducts: data.relatedProductIds
        ? {
            set: data.relatedProductIds.map((id) => ({ id })),
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

    const updated = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });
    await this.audit.logAction(
      userId,
      'UPDATE',
      'Product',
      id,
      data as unknown as import('@prisma/client').Prisma.InputJsonValue,
    );
    return updated;
  }

  async remove(userId: string, id: string) {
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
    const deleted = await this.prisma.product.delete({ where: { id } });
    await this.audit.logAction(userId, 'DELETE', 'Product', id);
    return deleted;
  }
}
