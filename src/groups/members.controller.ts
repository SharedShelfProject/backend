import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Patch,
    Post,
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
import {MembersService} from './members.service';
import {UpdateMemberRoleDto} from "./dto/update-member-role.dto";
import {TransferOwnershipDto} from "./dto/transfer-ownership.dto";
import {MembershipDto} from "./dto/membership.dto";

@ApiTags('group-members')
@Controller('groups/:groupId/members')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MembersController {
    constructor(private readonly membersService: MembersService) {
    }

    @Get()
    @ApiOperation({summary: 'List all members of a group'})
    @ApiParam({name: 'groupId', description: 'Group UUID'})
    @ApiResponse({status: 200, type: [MembershipDto]})
    listMembers(
        @Param('groupId') groupId: string,
        @CurrentUser() user: { id: string },
    ): Promise<MembershipDto[]> {
        return this.membersService.listMembers(groupId, user.id);
    }

    @Patch(':userId/role')
    @ApiOperation({summary: 'Update member role (owner/admin only)'})
    @ApiParam({name: 'groupId', description: 'Group UUID'})
    @ApiParam({name: 'userId', description: 'Target user UUID'})
    @ApiResponse({status: 200, type: MembershipDto})
    updateRole(
        @Param('groupId') groupId: string,
        @Param('userId') targetUserId: string,
        @CurrentUser() user: { id: string },
        @Body() dto: UpdateMemberRoleDto,
    ): Promise<MembershipDto> {
        return this.membersService.updateMemberRole(groupId, targetUserId, user.id, dto);
    }

    @Delete(':userId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({summary: 'Remove a member from the group (owner/admin only)'})
    @ApiParam({name: 'groupId', description: 'Group UUID'})
    @ApiParam({name: 'userId', description: 'Target user UUID'})
    @ApiResponse({status: 204})
    removeMember(
        @Param('groupId') groupId: string,
        @Param('userId') targetUserId: string,
        @CurrentUser() user: { id: string },
    ): Promise<void> {
        return this.membersService.removeMember(groupId, targetUserId, user.id);
    }

    @Post(':userId/block')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Block a member (owner/admin only)'})
    @ApiParam({name: 'groupId', description: 'Group UUID'})
    @ApiParam({name: 'userId', description: 'Target user UUID'})
    @ApiResponse({status: 200, type: MembershipDto})
    blockMember(
        @Param('groupId') groupId: string,
        @Param('userId') targetUserId: string,
        @CurrentUser() user: { id: string },
    ): Promise<MembershipDto> {
        return this.membersService.blockMember(groupId, targetUserId, user.id);
    }

    @Post(':userId/unblock')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Unblock a member (owner/admin only)'})
    @ApiParam({name: 'groupId', description: 'Group UUID'})
    @ApiParam({name: 'userId', description: 'Target user UUID'})
    @ApiResponse({status: 200, type: MembershipDto})
    unblockMember(
        @Param('groupId') groupId: string,
        @Param('userId') targetUserId: string,
        @CurrentUser() user: { id: string },
    ): Promise<MembershipDto> {
        return this.membersService.unblockMember(groupId, targetUserId, user.id);
    }

    @Post('transfer-ownership')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({summary: 'Transfer group ownership (owner only)'})
    @ApiParam({name: 'groupId', description: 'Group UUID'})
    @ApiResponse({status: 200, type: [MembershipDto]})
    transferOwnership(
        @Param('groupId') groupId: string,
        @CurrentUser() user: { id: string },
        @Body() dto: TransferOwnershipDto,
    ): Promise<MembershipDto[]> {
        return this.membersService.transferOwnership(groupId, user.id, dto);
    }
}
