import {
  Body,
  Controller,
  Delete,
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
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

type AuthRequest = { user: { id: string; sub?: string } };

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('products/:productId/reviews')
  @ApiOperation({ summary: 'Get all reviews for a product' })
  @ApiParam({ name: 'productId', type: String })
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
  getProductReviews(
    @Param('productId') productId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    const pageNumber = Number(page) || 1;
    const rawLimit = Number(limit) || 20;
    const safeLimit = Math.min(Math.max(rawLimit, 1), 100);
    return this.reviewsService.getProductReviews(
      productId,
      pageNumber,
      safeLimit,
    );
  }

  @Post('products/:productId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a review for a product' })
  @ApiParam({ name: 'productId', type: String })
  createReview(
    @Request() req: AuthRequest,
    @Param('productId') productId: string,
    @Body() dto: CreateReviewDto,
  ) {
    const userId = (req.user.id || req.user.sub) as string;
    return this.reviewsService.createReview(userId, productId, dto);
  }

  @Patch('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update your review' })
  @ApiParam({ name: 'id', type: String })
  updateReview(
    @Request() req: AuthRequest,
    @Param('id') id: string,
    @Body() dto: CreateReviewDto,
  ) {
    const userId = (req.user.id || req.user.sub) as string;
    return this.reviewsService.updateReview(userId, id, dto);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete your review' })
  @ApiParam({ name: 'id', type: String })
  deleteReview(@Request() req: AuthRequest, @Param('id') id: string) {
    const userId = (req.user.id || req.user.sub) as string;
    return this.reviewsService.deleteReview(userId, id);
  }
}
