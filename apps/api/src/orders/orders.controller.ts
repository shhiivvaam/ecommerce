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
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OrderStatus, RoleType } from '@prisma/client';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  OrderResponseDto,
} from './dto/order.dto';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
@UseGuards(JwtAuthGuard)
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
  create(
    @Request() req: { user: { id: string; userId?: string } },
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.create(
      req.user.userId || req.user.id,
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
  cancelOrder(
    @Request() req: { user: { id: string; userId?: string } },
    @Param('id') id: string,
  ) {
    return this.ordersService.cancelOrder(id, req.user.userId || req.user.id);
  }
}
