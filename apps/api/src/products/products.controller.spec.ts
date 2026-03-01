import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { CreateProductDto } from './dto/product.dto';

describe('ProductsController', () => {
  let controller: ProductsController;
  let productsService: jest.Mocked<ProductsService>;

  beforeEach(async () => {
    const mockProductsService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
      imports: [
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
        CacheModule.register(),
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ProductsController>(ProductsController);
    productsService = module.get(ProductsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a product', async () => {
      const createProductDto: CreateProductDto = {
        title: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        categoryId: 'category-1',
        gallery: ['image1.jpg'],
        stock: 10,
      };

      const mockProduct = {
        id: 'product-1',
        ...createProductDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      productsService.create.mockResolvedValue(mockProduct as any);

      const result = await controller.create(createProductDto);

      expect(result).toEqual(mockProduct);
      expect(productsService.create).toHaveBeenCalledWith(createProductDto);
    });
  });

  describe('findAll', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        { id: '1', title: 'Product 1', price: 99.99 },
        { id: '2', title: 'Product 2', price: 149.99 },
      ];

      const mockResponse = {
        data: mockProducts,
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      productsService.findAll.mockResolvedValue(mockResponse as any);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(mockResponse);
      expect(productsService.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
      });
    });
  });

  describe('findOne', () => {
    it('should return a single product', async () => {
      const mockProduct = {
        id: 'product-1',
        title: 'Test Product',
        price: 99.99,
        description: 'Test Description',
      };

      productsService.findOne.mockResolvedValue(mockProduct as any);

      const result = await controller.findOne('product-1');

      expect(result).toEqual(mockProduct);
      expect(productsService.findOne).toHaveBeenCalledWith('product-1');
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const updateData = { title: 'Updated Product' };
      const mockProduct = {
        id: 'product-1',
        title: 'Updated Product',
        price: 99.99,
      };

      productsService.update.mockResolvedValue(mockProduct as any);

      const result = await controller.update('product-1', updateData);

      expect(result).toEqual(mockProduct);
      expect(productsService.update).toHaveBeenCalledWith(
        'product-1',
        updateData,
      );
    });
  });

  describe('remove', () => {
    it('should delete a product', async () => {
      const mockProduct = { id: 'product-1', title: 'Test Product' };

      productsService.remove.mockResolvedValue(mockProduct as any);

      const result = await controller.remove('product-1');

      expect(result).toEqual(mockProduct);
      expect(productsService.remove).toHaveBeenCalledWith('product-1');
    });
  });
});
