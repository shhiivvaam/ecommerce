import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ReturnsService } from './returns.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RoleType } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateReturnRequestDto,
  UpdateReturnRequestStatusDto,
} from './dto/return.dto';

@ApiTags('Returns (RMA)')
@Controller('returns')
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @Post('order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a return request for a specific order (Customer)',
  })
  createReturnRequest(
    @Req() req: { user: { id: string; sub?: string } },
    @Param('orderId') orderId: string,
    @Body() dto: CreateReturnRequestDto,
  ) {
    return this.returnsService.createReturnRequest(
      req.user.sub || req.user.id,
      orderId,
      dto,
    );
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all return requests (Admin)' })
  findAllForAdmin() {
    return this.returnsService.findAllForAdmin();
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Approve, Reject, or Refund a return request (Admin)',
  })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateReturnRequestStatusDto,
  ) {
    return this.returnsService.updateStatus(id, dto);
  }
}
