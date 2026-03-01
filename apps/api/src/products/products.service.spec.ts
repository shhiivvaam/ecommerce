import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto';

describe('ProductsService', () => {
  let service: ProductsService;
  let prismaService: jest.Mocked<PrismaService>;
  let settingsService: jest.Mocked<SettingsService>;

  beforeEach(async () => {
    const mockPrismaService = {
      product: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      category: {
        findUnique: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockSettingsService = {
      getStoreMode: jest.fn().mockResolvedValue('multi'),
      isSingleProductMode: jest.fn().mockResolvedValue(false),
      getSingleProductId: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: SettingsService,
          useValue: mockSettingsService,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prismaService = module.get(PrismaService);
    settingsService = module.get(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a product successfully', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        categoryId: 'category-1',
        images: ['image1.jpg'],
        inventory: 10,
      };

      const mockCategory = { id: 'category-1', name: 'Test Category' };
      const mockProduct = {
        id: 'product-1',
        title: 'Test Product',
        slug: 'test-product',
        price: 99.99,
        description: 'Test Description',
        categoryId: 'category-1',
        images: ['image1.jpg'],
        inventory: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaService.category.findUnique.mockResolvedValue(mockCategory);
      prismaService.product.findMany.mockResolvedValue([]);
      prismaService.$transaction.mockImplementation(async (callback) => {
        return callback(prismaService);
      });
      prismaService.product.create.mockResolvedValue(mockProduct);

      const result = await service.create(createProductDto);

      expect(result).toEqual(mockProduct);
      expect(prismaService.category.findUnique).toHaveBeenCalledWith({
        where: { id: 'category-1' },
      });
      expect(prismaService.product.create).toHaveBeenCalled();
    });

    it('should throw NotFoundException if category does not exist', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        categoryId: 'invalid-category',
        images: ['image1.jpg'],
        inventory: 10,
      };

      prismaService.category.findUnique.mockResolvedValue(null);

      await expect(service.create(createProductDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const query: ProductQueryDto = { page: 1, limit: 10 };
      const mockProducts = [
        { id: '1', title: 'Product 1', price: 99.99 },
        { id: '2', title: 'Product 2', price: 149.99 },
      ];

      prismaService.product.findMany.mockResolvedValue(mockProducts);
      prismaService.product.count.mockResolvedValue(2);

      const result = await service.findAll(query);

      expect(result).toEqual({
        data: mockProducts,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('should filter by category when provided', async () => {
      const query: ProductQueryDto = {
        categoryId: 'cat-1',
        page: 1,
        limit: 10,
      };
      const mockProducts = [
        { id: '1', title: 'Product 1', categoryId: 'cat-1' },
      ];

      prismaService.product.findMany.mockResolvedValue(mockProducts);
      prismaService.product.count.mockResolvedValue(1);

      const result = await service.findAll(query);

      expect(prismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoryId: 'cat-1',
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a product by id', async () => {
      const mockProduct = {
        id: 'product-1',
        title: 'Test Product',
        price: 99.99,
        category: { id: 'cat-1', name: 'Test Category' },
        variants: [],
      };

      prismaService.product.findUnique.mockResolvedValue(mockProduct);

      const result = await service.findOne('product-1');

      expect(result).toEqual(mockProduct);
      expect(prismaService.product.findUnique).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        include: {
          category: true,
          variants: true,
        },
      });
    });

    it('should throw NotFoundException if product not found', async () => {
      prismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a product successfully', async () => {
      const updateData: UpdateProductDto = { title: 'Updated Product' };
      const mockProduct = {
        id: 'product-1',
        title: 'Updated Product',
        price: 99.99,
      };

      prismaService.product.findUnique.mockResolvedValue(mockProduct);
      prismaService.product.update.mockResolvedValue(mockProduct);

      const result = await service.update('product-1', updateData);

      expect(result).toEqual(mockProduct);
      expect(prismaService.product.update).toHaveBeenCalledWith({
        where: { id: 'product-1' },
        data: updateData,
      });
    });

    it('should throw NotFoundException if product to update does not exist', async () => {
      const updateData: UpdateProductDto = { title: 'Updated Product' };

      prismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.update('invalid-id', updateData)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a product successfully', async () => {
      const mockProduct = {
        id: 'product-1',
        title: 'Test Product',
        price: 99.99,
      };

      prismaService.product.findUnique.mockResolvedValue(mockProduct);
      prismaService.product.delete.mockResolvedValue(mockProduct);

      const result = await service.remove('product-1');

      expect(result).toEqual(mockProduct);
      expect(prismaService.product.delete).toHaveBeenCalledWith({
        where: { id: 'product-1' },
      });
    });

    it('should throw NotFoundException if product to delete does not exist', async () => {
      prismaService.product.findUnique.mockResolvedValue(null);

      await expect(service.remove('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
