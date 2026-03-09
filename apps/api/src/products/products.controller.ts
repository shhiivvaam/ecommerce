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
import { Inject } from '@nestjs/common';
import {
  CacheInterceptor,
  CacheTTL,
  CACHE_MANAGER,
} from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
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
} from './dto/product.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

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
    const cm = this.cacheManager as unknown as {
      reset: () => Promise<void>;
      clear: () => Promise<void>;
    };
    if (typeof cm.reset === 'function') await cm.reset();
    else if (typeof cm.clear === 'function') await cm.clear();
    return product;
  }

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
  @CacheTTL(300000) // 5 minutes cache for product list
  findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import products via CSV' })
  @UseInterceptors(FileInterceptor('file'))
  async importProducts(
    @Req() req: { user: { id: string; sub?: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    const csvString = file.buffer.toString('utf-8');
    return this.productsService.queueCsvImport(
      req.user.sub ?? req.user.id,
      csvString,
    );
  }

  @Get('import/:jobId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check CSV import job status' })
  @ApiParam({ name: 'jobId', description: 'BullMQ Job ID' })
  async getImportJobStatus(@Param('jobId') jobId: string) {
    return this.productsService.getImportJobStatus(jobId);
  }

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
  @CacheTTL(600000) // 10 minutes cache for individual products
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

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
    const cm = this.cacheManager as unknown as {
      reset: () => Promise<void>;
      clear: () => Promise<void>;
    };
    if (typeof cm.reset === 'function') await cm.reset();
    else if (typeof cm.clear === 'function') await cm.clear();
    return product;
  }

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
    const cm = this.cacheManager as unknown as {
      reset: () => Promise<void>;
      clear: () => Promise<void>;
    };
    if (typeof cm.reset === 'function') await cm.reset();
    else if (typeof cm.clear === 'function') await cm.clear();
    return product;
  }
}
