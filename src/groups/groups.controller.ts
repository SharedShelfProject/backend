import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import {
    ApiBearerAuth,
    ApiOperation,
    ApiParam,
    ApiResponse,
    ApiTags,
} from '@nestjs/swagger';

import {CurrentUser} from '../auth/decorators/current-user.decorator';
import {JwtAuthGuard} from '../auth/guards/jwt-auth.guard';
import {CreateGroupDto} from './dto/create-group.dto';
import {JoinGroupDto} from './dto/join-group.dto';
import {SearchGroupsDto} from './dto/search-groups.dto';
import {GroupsService} from './groups.service';
import {GroupDetailDto} from "./dto/group-detail.dto";
import {GroupListDto} from "./dto/group-list.dto";

@ApiTags('groups')
@Controller('groups')
export class GroupsController {
    constructor(private readonly groupsService: GroupsService) {
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({summary: 'Create a new group'})
    @ApiResponse({status: 201, type: GroupDetailDto})
    createGroup(
        @CurrentUser() user: { id: string },
        @Body() dto: CreateGroupDto,
    ): Promise<GroupDetailDto> {
        return this.groupsService.createGroup(user.id, dto);
    }

    @Get()
    @ApiOperation({summary: 'Search groups'})
    @ApiResponse({status: 200, type: GroupListDto})
    searchGroups(@Query() dto: SearchGroupsDto): Promise<GroupListDto> {
        return this.groupsService.searchGroups(dto);
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({summary: 'Get groups I am a member of'})
    @ApiResponse({status: 200, type: GroupListDto})
    getMyGroups(@CurrentUser() user: { id: string }): Promise<GroupListDto> {
        return this.groupsService.getMyGroups(user.id);
    }

    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({summary: 'Get group by ID'})
    @ApiParam({name: 'id', description: 'Group UUID'})
    @ApiResponse({status: 200, type: GroupDetailDto})
    getGroup(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ): Promise<GroupDetailDto> {
        return this.groupsService.getGroupById(id, user.id);
    }

    @Post(':id/join')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Join a group'})
    @ApiParam({name: 'id', description: 'Group UUID'})
    @ApiResponse({status: 200, type: GroupDetailDto})
    joinGroup(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
        @Body() dto: JoinGroupDto,
    ): Promise<GroupDetailDto> {
        return this.groupsService.joinGroup(id, user.id, dto);
    }

    @Delete(':id/leave')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Leave a group'})
    @ApiParam({name: 'id', description: 'Group UUID'})
    @ApiResponse({status: 204})
    leaveGroup(
        @Param('id') id: string,
        @CurrentUser() user: { id: string },
    ): Promise<void> {
        return this.groupsService.leaveGroup(id, user.id);
    }
}
