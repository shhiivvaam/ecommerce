import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrderStatus, RoleType } from '@prisma/client';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderResponseDto,
} from './dto/order.dto';
import { UpdateOrderTrackingDto } from './dto/tracking.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create an order',
    description: 'Create a new order for the authenticated user.',
  })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: OrderResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'JWT token is missing or invalid' })
  @UseGuards(OptionalJwtAuthGuard)
  create(
    @Request() req: { user?: { id?: string; userId?: string } },
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(
      req.user?.userId || req.user?.id,
      createOrderDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get my orders',
    description: 'Retrieve all orders for the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of orders',
    type: [OrderResponseDto],
  })
  @ApiUnauthorizedResponse({ description: 'JWT token is missing or invalid' })
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req: { user: { id: string; userId?: string } }) {
    return this.ordersService.findAllByUser(req.user.userId || req.user.id);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get an order by ID',
    description:
      'Retrieve a specific order. Users can only retrieve their own orders.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    example: 'clx_order_id_123',
  })
  @ApiResponse({
    status: 200,
    description: 'Order details',
    type: OrderResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'JWT token is missing or invalid' })
  @ApiNotFoundResponse({
    description: 'Order not found or does not belong to the user',
  })
  @UseGuards(JwtAuthGuard)
  findOne(
    @Request() req: { user: { id: string; userId?: string } },
    @Param('id') id: string,
  ) {
    return this.ordersService.findOne(id, req.user.userId || req.user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Update order status (admin)',
    description: 'Update the status of an order. Restricted to Admin roles.',
  })
  @ApiParam({
    name: 'id',
    description: 'Order ID',
    example: 'clx_order_id_123',
  })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiResponse({
    status: 200,
    description: 'Order status updated successfully',
    type: OrderResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'JWT token is missing or invalid' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  updateStatus(@Param('id') id: string, @Body('status') status: OrderStatus) {
    return this.ordersService.updateStatus(id, status);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Get all orders (admin)',
    description:
      'Retrieve all orders in the system. Restricted to Admin roles.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all orders',
    type: [OrderResponseDto],
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
    description: 'Items per page (default: 20, max: 100)',
    example: 20,
  })
  findAllAdmin(@Query('page') page = '1', @Query('limit') limit = '20') {
    const pageNumber = Number(page) || 1;
    const rawLimit = Number(limit) || 20;
    const limitNumber = Math.min(Math.max(rawLimit, 1), 100);
    return this.ordersService.findAll(pageNumber, limitNumber);
  }

  @Patch(':id/cancel')
  @ApiOperation({
    summary: 'Cancel an order',
    description:
      'Cancel a PENDING or PROCESSING order. Stock is restored automatically.',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiNotFoundResponse({ description: 'Order not found' })
  @UseGuards(JwtAuthGuard)
  cancelOrder(
    @Request() req: { user: { id: string; userId?: string } },
    @Param('id') id: string,
  ) {
    return this.ordersService.cancelOrder(id, req.user.userId || req.user.id);
  }

  @Get(':id/download/:productId')
  @ApiOperation({
    summary: 'Download a digital product from an order',
    description: 'Retrieve the file URL of a purchased digital product.',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns an object with downloadUrl property',
  })
  @ApiUnauthorizedResponse({ description: 'JWT token is missing or invalid' })
  @ApiNotFoundResponse({ description: 'Order or digital product not found' })
  @UseGuards(JwtAuthGuard)
  downloadDigitalAsset(
    @Request() req: { user: { id: string; userId?: string } },
    @Param('id') orderId: string,
    @Param('productId') productId: string,
  ) {
    return this.ordersService.getDigitalDownloadUrl(
      orderId,
      productId,
      req.user.userId || req.user.id,
    );
  }

  @Patch(':id/tracking')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiOperation({
    summary: 'Update order tracking (admin)',
    description:
      'Add or update a tracking number and carrier. Restricted to Admin roles.',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiBody({ type: UpdateOrderTrackingDto })
  updateTracking(
    @Param('id') id: string,
    @Body() data: UpdateOrderTrackingDto,
  ) {
    return this.ordersService.updateTracking(id, data);
  }

  @Get(':id/tracking')
  @ApiOperation({
    summary: 'Get order tracking',
    description: 'Retrieve dynamic tracking history for a specific order.',
  })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiQuery({
    name: 'sessionId',
    required: false,
    description: 'Guest session ID',
  })
  @UseGuards(OptionalJwtAuthGuard)
  getTracking(
    @Request() req: { user?: { id?: string; userId?: string } },
    @Param('id') id: string,
    @Query('sessionId') sessionId?: string,
  ) {
    return this.ordersService.getTracking(
      id,
      req.user?.userId || req.user?.id,
      sessionId,
    );
  }
}
