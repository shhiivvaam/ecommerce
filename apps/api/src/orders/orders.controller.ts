import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrderStatus } from '@prisma/client';
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
  @ApiOperation({
    summary: 'Update order status',
    description:
      'Update the status of an order. Typically restricted to Admin roles.',
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
}
