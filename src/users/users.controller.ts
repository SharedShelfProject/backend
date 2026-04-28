import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { PublicUserProfileDto, UserProfileDto } from './dto/user-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get own profile' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  getMe(@CurrentUser() user: { id: string }): Promise<UserProfileDto> {
    return this.usersService.getOwnProfile(user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own profile' })
  @ApiResponse({ status: 200, type: UserProfileDto })
  updateMe(
    @CurrentUser() user: { id: string },
    @Body() dto: UpdateProfileDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete own account (soft delete)' })
  @ApiResponse({ status: 204 })
  deleteMe(@CurrentUser() user: { id: string }): Promise<void> {
    return this.usersService.softDelete(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get public profile by user ID' })
  @ApiResponse({ status: 200, type: PublicUserProfileDto })
  getPublicProfile(@Param('id') id: string): Promise<PublicUserProfileDto> {
    return this.usersService.getPublicProfile(id);
  }
}
