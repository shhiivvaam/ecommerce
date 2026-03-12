import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  getCart(@Request() req: { user: { id?: string; sub?: string } }) {
    return this.cartService.getCart(req.user.id || req.user.sub!);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  addItem(
    @Request() req: { user: { id?: string; sub?: string } },
    @Body() addCartItemDto: AddCartItemDto,
  ) {
    return this.cartService.addItem(
      req.user.id || req.user.sub!,
      addCartItemDto,
    );
  }

  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  updateItem(
    @Request() req: { user: { id?: string; sub?: string } },
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(
      req.user.id || req.user.sub!,
      itemId,
      updateCartItemDto,
    );
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  removeItem(
    @Request() req: { user: { id?: string; sub?: string } },
    @Param('itemId') itemId: string,
  ) {
    return this.cartService.removeItem(req.user.id || req.user.sub!, itemId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear the entire cart' })
  clearCart(@Request() req: { user: { id?: string; sub?: string } }) {
    return this.cartService.clearCart(req.user.id || req.user.sub!);
  }
}
