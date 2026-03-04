import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AffiliatesService } from './affiliates.service';
import { RegisterAffiliateDto } from './dto/affiliate.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Affiliates')
@Controller('affiliates')
export class AffiliatesController {
  constructor(private readonly affiliatesService: AffiliatesService) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register for the affiliate program' })
  @ApiResponse({ status: 201, description: 'Affiliate account created' })
  register(
    @Req() req: { user: { id: string; sub?: string } },
    @Body() dto: RegisterAffiliateDto,
  ) {
    return this.affiliatesService.register(req.user.sub || req.user.id, dto);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'View your affiliate dashboard' })
  getDashboard(@Req() req: { user: { id: string; sub?: string } }) {
    return this.affiliatesService.getDashboard(req.user.sub || req.user.id);
  }
}
