import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { parse } from 'csv-parse/sync';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { AuditService } from '../audit/audit.service';
import * as fs from 'fs';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto';
import { Prisma } from '@prisma/client';

export interface BulkImportResult {
  importedCount: number;
  failedCount: number;
  total: number;
  errors: Array<{ row: number; reason: string; title?: string }>;
}

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

  // ─── Bulk JSON Create ──────────────────────────────────────────────────────

  async bulkCreate(
    userId: string,
    products: CreateProductDto[],
  ): Promise<BulkImportResult> {
    let importedCount = 0;
    let failedCount = 0;
    const errors: BulkImportResult['errors'] = [];

    for (let i = 0; i < products.length; i++) {
      const dto = products[i];
      try {
        await this.create(userId, dto);
        importedCount++;
      } catch (err) {
        failedCount++;
        errors.push({
          row: i + 1,
          title: dto.title,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    await this.audit.logAction(userId, 'BULK_CREATE', 'Product', 'bulk', {
      importedCount,
      failedCount,
      total: products.length,
    });

    return { importedCount, failedCount, total: products.length, errors };
  }

  // ─── CSV / Excel Queue Import ──────────────────────────────────────────────

  async queueCsvImport(userId: string, csvString: string) {
    const job = await this.importQueue.add('import-csv', {
      csvString,
      userId,
    });
    return { message: 'Import queued successfully', jobId: job.id };
  }

  async queueExcelImport(userId: string, filePath: string) {
    const job = await this.importQueue.add('import-excel', {
      excelFilePath: filePath,
      userId,
    });
    return { message: 'Excel import queued successfully', jobId: job.id };
  }

  async getImportJobStatus(jobId: string) {
    const job = await this.importQueue.getJob(jobId);
    if (!job) throw new NotFoundException('Job not found');

    const state = await job.getState();
    const result = job.returnvalue as unknown;
    const error = job.failedReason;

    return { id: job.id, state, result, error };
  }

  // ─── CSV Processing ────────────────────────────────────────────────────────

  async processCsvImport(
    csvString: string,
    userId: string,
  ): Promise<BulkImportResult> {
    try {
      const records = parse(csvString, {
        columns: true,
        skip_empty_lines: true,
      });

      let importedCount = 0;
      let failedCount = 0;
      const errors: BulkImportResult['errors'] = [];

      interface CsvRecord {
        title?: string;
        name?: string;
        price?: string;
        stock?: string;
        description?: string;
        tags?: string;
        categoryId?: string;
        discounted?: string;
      }

      for (let idx = 0; idx < (records as CsvRecord[]).length; idx++) {
        const record = (records as CsvRecord[])[idx];
        try {
          const title = record.title || record.name;
          if (!title) {
            failedCount++;
            errors.push({ row: idx + 2, reason: 'Missing title/name column' });
            continue;
          }

          const price = record.price ? parseFloat(record.price) : 0;
          const stock = record.stock ? parseInt(record.stock, 10) : 0;
          const description = record.description || '';
          const discounted = record.discounted
            ? parseFloat(record.discounted)
            : undefined;
          const tags = record.tags
            ? record.tags.split(',').map((t: string) => t.trim())
            : [];
          const categoryId = record.categoryId || undefined;

          await this.create(userId, {
            title,
            price,
            stock,
            description,
            tags,
            categoryId,
            discounted,
          });

          importedCount++;
        } catch (err) {
          failedCount++;
          errors.push({
            row: idx + 2,
            title: record.title || record.name,
            reason: err instanceof Error ? err.message : 'Unknown error',
          });
        }
      }

      await this.audit.logAction(userId, 'IMPORT_BATCH', 'Product', 'bulk', {
        importedCount,
        failedCount,
        total: records.length,
      });

      return {
        importedCount,
        failedCount,
        total: (records as CsvRecord[]).length,
        errors,
      };
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

  // ─── Excel Processing ──────────────────────────────────────────────────────

  async processExcelImport(
    filePath: string,
    userId: string,
  ): Promise<BulkImportResult> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.readFile(filePath);
    } catch (err) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      throw err;
    }

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('Excel file has no worksheets');
    }

    // Read header row
    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell) => {
      headers.push(
        String(cell.value?.toString() ?? '')
          .toLowerCase()
          .trim(),
      );
    });

    let importedCount = 0;
    let failedCount = 0;
    const errors: BulkImportResult['errors'] = [];
    const totalRows = Math.max(0, worksheet.rowCount - 2); // Exclude header AND instruction row

    for (let rowNum = 3; rowNum <= worksheet.rowCount; rowNum++) {
      const row = worksheet.getRow(rowNum);

      // Skip completely empty rows
      const cellValues = headers.map(
        (_, colIdx) => row.getCell(colIdx + 1).value,
      );
      if (cellValues.every((v) => v === null || v === undefined || v === '')) {
        continue;
      }

      const getCell = (colName: string): string => {
        const idx = headers.indexOf(colName);
        if (idx === -1) return '';
        const val = row.getCell(idx + 1).value;
        return val === null || val === undefined ? '' : String(val?.toString() ?? '').trim();
      };

      try {
        const title = getCell('title') || getCell('name');
        if (!title) {
          failedCount++;
          errors.push({
            row: rowNum,
            reason: 'Missing title/name column',
          });
          continue;
        }

        const priceStr = getCell('price');
        let price = priceStr ? parseFloat(priceStr) : 0;
        if (isNaN(price)) price = 0;

        const stockStr = getCell('stock');
        let stock = stockStr ? parseInt(stockStr, 10) : 0;
        if (isNaN(stock)) stock = 0;
        const description = getCell('description') || '';
        const discountedStr = getCell('discounted');
        let discounted = discountedStr ? parseFloat(discountedStr) : undefined;
        if (discounted !== undefined && isNaN(discounted))
          discounted = undefined;
        const tagsStr = getCell('tags');
        const tags = tagsStr
          ? tagsStr
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [];
        // Resolve category by name (case-insensitive). Falls back to Uncategorized via create().
        const categoryName = getCell('category') || '';
        let resolvedCategoryId: string | undefined;
        if (categoryName) {
          const found = await this.prisma.category.findFirst({
            where: { name: { equals: categoryName, mode: 'insensitive' } },
            select: { id: true },
          });
          resolvedCategoryId = found?.id; // undefined → falls back to Uncategorized in create()
        }

        await this.create(userId, {
          title,
          price,
          stock,
          description,
          tags,
          categoryId: resolvedCategoryId,
          discounted,
        });

        importedCount++;
      } catch (err) {
        failedCount++;
        errors.push({
          row: rowNum,
          reason: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    await this.audit.logAction(
      userId,
      'IMPORT_BATCH_EXCEL',
      'Product',
      'bulk',
      {
        importedCount,
        failedCount,
        total: totalRows,
      },
    );

    return { importedCount, failedCount, total: totalRows, errors };
  }

  // ─── Excel Template ────────────────────────────────────────────────────────

  async generateExcelTemplate(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'E-Commerce Admin';
    workbook.created = new Date();

    const ws = workbook.addWorksheet('Products', {
      views: [{ state: 'frozen', ySplit: 2 }],
    });

    // Define columns
    ws.columns = [
      { header: 'title', key: 'title', width: 30 },
      { header: 'description', key: 'description', width: 50 },
      { header: 'price', key: 'price', width: 12 },
      { header: 'discounted', key: 'discounted', width: 14 },
      { header: 'stock', key: 'stock', width: 10 },
      { header: 'category', key: 'category', width: 30 },
      { header: 'tags', key: 'tags', width: 30 },
    ];

    // Style header row
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1A1A2E' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    // Instruction row (row 2)
    const instructionData = [
      'Required. 3–100 chars.',
      'Required. Min 10 chars.',
      'Required. e.g. 99.99',
      'Optional. Sale price, e.g. 79.99',
      'Required. e.g. 100',
      'Optional. Category name e.g. Electronics (or leave blank)',
      'Optional. Comma-separated e.g. new,sale',
    ];
    const instrRow = ws.insertRow(2, instructionData);
    instrRow.font = {
      italic: true,
      color: { argb: 'FF777777' },
      size: 9,
    };
    instrRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF5F5F5' },
    };
    instrRow.height = 20;

    // Sample data row (row 3) — use a real category from DB if available
    const sampleCategory = await this.prisma.category.findFirst({
      select: { name: true },
      orderBy: { createdAt: 'asc' },
    });
    ws.addRow({
      title: 'Wireless Noise-Cancel Headphones',
      description:
        'Premium wireless headphones with active noise cancellation, 30h battery life, and foldable design.',
      price: 149.99,
      discounted: 119.99,
      stock: 50,
      category: sampleCategory?.name ?? '',
      tags: 'audio,wireless',
    });

    // Style sample row
    const sampleRow = ws.getRow(3);
    sampleRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEAF4FF' },
    };
    sampleRow.font = { color: { argb: 'FF444444' }, size: 10 };

    // Border all used cells
    ws.eachRow((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
          right: { style: 'thin', color: { argb: 'FFDDDDDD' } },
        };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // ─── CSV Export ────────────────────────────────────────────────────────────

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

  // ─── Single Create ─────────────────────────────────────────────────────────

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

  // ─── Find All ──────────────────────────────────────────────────────────────

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

  // ─── Find One ──────────────────────────────────────────────────────────────

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

  // ─── Find Related ──────────────────────────────────────────────────────────

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

  // ─── Update ────────────────────────────────────────────────────────────────

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

  // ─── Remove ────────────────────────────────────────────────────────────────

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
