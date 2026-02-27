import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { RoleType } from '@prisma/client';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ─── Current user endpoints ───────────────────────────────────
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  getProfile(@Request() req: { user: { id: string; sub?: string } }) {
    return this.usersService.findOne((req.user.id || req.user.sub) as string);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user profile' })
  updateProfile(
    @Request() req: { user: { id: string; sub?: string } },
    @Body() updateData: UpdateUserDto,
  ) {
    return this.usersService.update(
      (req.user.id || req.user.sub) as string,
      updateData,
    );
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete current user profile' })
  deleteProfile(@Request() req: { user: { id: string; sub?: string } }) {
    return this.usersService.remove((req.user.id || req.user.sub) as string);
  }

  // ─── Admin endpoints ──────────────────────────────────────────
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all users (admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a specific user (admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id/block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle block/unblock a user (admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  toggleBlock(@Param('id') id: string) {
    return this.usersService.toggleBlock(id);
  }

  @Patch(':id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user role (admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  changeRole(@Param('id') id: string, @Body('role') role: RoleType) {
    return this.usersService.changeRole(id, role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleType.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user (admin)' })
  @ApiParam({ name: 'id', description: 'User ID' })
  deleteUser(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
