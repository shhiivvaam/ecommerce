import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  Req,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Inject } from '@nestjs/common';
import {
  CacheInterceptor,
  CacheTTL,
  CACHE_MANAGER,
} from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import * as fs from 'fs';

import * as os from 'os';
import { randomUUID } from 'crypto';
import { RoleType } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductResponseDto,
  BulkCreateProductDto,
} from './dto/product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private async clearCache() {
    const cm = this.cacheManager as unknown as {
      reset: () => Promise<void>;
      clear: () => Promise<void>;
    };
    if (typeof cm.reset === 'function') await cm.reset();
    else if (typeof cm.clear === 'function') await cm.clear();
  }

  // ─── Single Create ─────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a product',
    description:
      'Create a new product. Requires authentication (Admin role recommended).',
  })
  @ApiBody({ type: CreateProductDto })
  @ApiResponse({
    status: 201,
    description: 'Product created successfully',
    type: ProductResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'JWT token is missing or invalid' })
  async create(
    @Req() req: { user: { id: string; sub?: string } },
    @Body() createProductDto: CreateProductDto,
  ) {
    const product = await this.productsService.create(
      req.user.sub ?? req.user.id,
      createProductDto,
    );
    await this.clearCache();
    return product;
  }

  // ─── Bulk JSON Create ──────────────────────────────────────────────────────

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk create products (JSON)',
    description:
      'Create multiple products at once from a JSON array. Returns per-row success/error summary.',
  })
  @ApiBody({ type: BulkCreateProductDto })
  @ApiResponse({
    status: 201,
    description: 'Bulk creation result with imported/failed counts',
  })
  @ApiUnauthorizedResponse({ description: 'JWT token is missing or invalid' })
  async bulkCreate(
    @Req() req: { user: { id: string; sub?: string } },
    @Body() body: BulkCreateProductDto,
  ) {
    if (!body.products || body.products.length === 0) {
      throw new BadRequestException('No products provided');
    }
    const result = await this.productsService.bulkCreate(
      req.user.sub ?? req.user.id,
      body.products,
    );
    await this.clearCache();
    return result;
  }

  // ─── Excel Template ────────────────────────────────────────────────────────

  @Get('template')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Download Excel product import template',
    description:
      'Returns a pre-formatted .xlsx file with column headers, instructions, and a sample row.',
  })
  async downloadTemplate(@Res() res: Response) {
    const buffer = await this.productsService.generateExcelTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="product_import_template.xlsx"',
    );
    res.send(buffer);
  }

  // ─── File Import (CSV / Excel) ─────────────────────────────────────────────

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import products via CSV or Excel (.xlsx)' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: os.tmpdir(),
        filename: (_req, _file, cb) => cb(null, `import-${randomUUID()}`),
      }),
    }),
  )
  async importProducts(
    @Req() req: { user: { id: string; sub?: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');

    const userId = req.user.sub ?? req.user.id;
    const mimeType = file.mimetype.toLowerCase();
    const isExcel =
      mimeType.includes('spreadsheetml') ||
      mimeType.includes('excel') ||
      file.originalname?.toLowerCase().endsWith('.xlsx');

    if (isExcel) {
      // file.path is set by diskStorage — no buffer manipulation needed
      return this.productsService.queueExcelImport(userId, file.path);
    }

    // Default: CSV — read from disk
    const csvString = fs.readFileSync(file.path, 'utf-8');
    fs.unlinkSync(file.path);
    return this.productsService.queueCsvImport(userId, csvString);
  }

  // ─── Import Job Status ─────────────────────────────────────────────────────

  @Get('import/:jobId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check file import job status' })
  @ApiParam({ name: 'jobId', description: 'BullMQ Job ID' })
  async getImportJobStatus(@Param('jobId') jobId: string) {
    return this.productsService.getImportJobStatus(jobId);
  }

  // ─── CSV Export ────────────────────────────────────────────────────────────

  @Get('export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export products to CSV' })
  async exportProducts(@Res() res: Response) {
    const csvString = await this.productsService.generateCsvExport();
    res.header('Content-Type', 'text/csv');
    res.attachment('products_export.csv');
    return res.send(csvString);
  }

  // ─── Related Products ──────────────────────────────────────────────────────

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related products' })
  @ApiParam({
    name: 'id',
    description: 'Product ID',
    example: 'clx_product_id_123',
  })
  @ApiResponse({
    status: 200,
    description: 'List of related products',
    type: [ProductResponseDto],
  })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000) // 5 minutes cache
  findRelated(@Param('id') id: string) {
    return this.productsService.findRelated(id);
  }

  // ─── Get All ───────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'List all products',
    description:
      'Retrieve a paginated list of all products with optional filters.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by product name',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items per page (default: 10)',
    example: 10,
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    description: 'Sort field',
    enum: ['price', 'name', 'createdAt'],
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    description: 'Sort direction',
    enum: ['asc', 'desc'],
  })
  @ApiResponse({
    status: 200,
    description: 'List of products',
    type: [ProductResponseDto],
  })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(300000)
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  // ─── Get One ───────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({ summary: 'Get a product by ID' })
  @ApiParam({
    name: 'id',
    description: 'Product ID',
    example: 'clx_product_id_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Product details',
    type: ProductResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Product not found' })
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(600000)
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // ─── Update ────────────────────────────────────────────────────────────────

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a product',
    description: 'Update product details. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product ID',
    example: 'clx_product_id_123',
  })
  @ApiBody({ type: UpdateProductDto })
  @ApiResponse({
    status: 200,
    description: 'Product updated successfully',
    type: ProductResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'JWT token is missing or invalid' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async update(
    @Req() req: { user: { id: string; sub?: string } },
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    const product = await this.productsService.update(
      req.user.sub ?? req.user.id,
      id,
      updateProductDto,
    );
    await this.clearCache();
    return product;
  }

  // ─── Delete ────────────────────────────────────────────────────────────────

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a product',
    description: 'Permanently delete a product. Requires authentication.',
  })
  @ApiParam({
    name: 'id',
    description: 'Product ID',
    example: 'clx_product_id_123',
  })
  @ApiResponse({ status: 200, description: 'Product deleted successfully' })
  @ApiUnauthorizedResponse({ description: 'JWT token is missing or invalid' })
  @ApiNotFoundResponse({ description: 'Product not found' })
  async remove(
    @Req() req: { user: { id: string; sub?: string } },
    @Param('id') id: string,
  ) {
    const product = await this.productsService.remove(
      req.user.sub ?? req.user.id,
      id,
    );
    await this.clearCache();
    return product;
  }
}
