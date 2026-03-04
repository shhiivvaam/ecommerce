import { Controller, Post, Get, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiResponse,
} from '@nestjs/swagger';
import { GiftCardsService } from './gift-cards.service';
import { PurchaseGiftCardDto } from './dto/gift-card.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Gift Cards')
@Controller('gift-cards')
export class GiftCardsController {
  constructor(private readonly giftCardsService: GiftCardsService) {}

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase a new gift card' })
  @ApiResponse({
    status: 201,
    description: 'Gift card created and code returned',
  })
  purchase(@Body() dto: PurchaseGiftCardDto) {
    return this.giftCardsService.purchase(dto);
  }

  @Get('balance/:code')
  @ApiOperation({ summary: 'Get current balance of a gift card by its code' })
  @ApiNotFoundResponse({ description: 'Gift card not found' })
  getBalance(@Param('code') code: string) {
    return this.giftCardsService.getBalance(code);
  }
}
