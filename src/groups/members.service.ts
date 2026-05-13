import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {GroupMemberRole, GroupMemberStatus} from '../common/enums';
import {Group} from '../database/entities/group.entity';
import {GroupMembership} from '../database/entities/group-membership.entity';
import {UpdateMemberRoleDto} from "./dto/update-member-role.dto";
import {TransferOwnershipDto} from "./dto/transfer-ownership.dto";
import {MembershipDto} from "./dto/membership.dto";

@Injectable()
export class MembersService {
    constructor(
        @InjectRepository(Group)
        private readonly groupRepository: Repository<Group>,
        @InjectRepository(GroupMembership)
        private readonly membershipRepository: Repository<GroupMembership>,
    ) {
    }

    async listMembers(groupId: string, requesterId: string): Promise<MembershipDto[]> {
        await this.requireActiveMember(groupId, requesterId);

        const memberships = await this.membershipRepository.find({
            where: {group: {id: groupId}},
            relations: ['user'],
            order: {joinedAt: 'ASC'},
        });

        return memberships.map(this.toDto);
    }

    async updateMemberRole(
        groupId: string,
        targetUserId: string,
        requesterId: string,
        dto: UpdateMemberRoleDto,
    ): Promise<MembershipDto> {
        const requesterMembership = await this.requireActiveMember(groupId, requesterId);

        if (requesterMembership.role !== GroupMemberRole.OWNER) {
            throw new ForbiddenException('Only the group owner can change member roles');
        }

        const targetMembership = await this.findMembership(groupId, targetUserId);

        if (targetMembership.role === GroupMemberRole.OWNER) {
            throw new ForbiddenException('Cannot change the role of the group owner');
        }


        targetMembership.role = dto.role;
        await this.membershipRepository.save(targetMembership);

        return this.toDto(targetMembership);
    }

    async removeMember(
        groupId: string,
        targetUserId: string,
        requesterId: string,
    ): Promise<void> {
        const requesterMembership = await this.requireActiveMember(groupId, requesterId);

        if (targetUserId === requesterId) {
            throw new BadRequestException('Use the leave endpoint to leave a group');
        }

        if (requesterMembership.role !== GroupMemberRole.OWNER) {
            throw new ForbiddenException('Only the group owner can remove members');
        }

        const targetMembership = await this.findMembership(groupId, targetUserId);

        if (targetMembership.role === GroupMemberRole.OWNER) {
            throw new ForbiddenException('Cannot remove the group owner');
        }


        await this.membershipRepository.remove(targetMembership);
    }

    async blockMember(
        groupId: string,
        targetUserId: string,
        requesterId: string,
    ): Promise<MembershipDto> {
        const requesterMembership = await this.requireActiveMember(groupId, requesterId);

        if (requesterMembership.role !== GroupMemberRole.OWNER) {
            throw new ForbiddenException('Only the group owner can block members');
        }

        if (targetUserId === requesterId) {
            throw new BadRequestException('Cannot block yourself');
        }

        const targetMembership = await this.findMembership(groupId, targetUserId);

        if (targetMembership.role === GroupMemberRole.OWNER) {
            throw new ForbiddenException('Cannot block the group owner');
        }


        targetMembership.status = GroupMemberStatus.BLOCKED;
        await this.membershipRepository.save(targetMembership);

        return this.toDto(targetMembership);
    }

    async unblockMember(
        groupId: string,
        targetUserId: string,
        requesterId: string,
    ): Promise<MembershipDto> {
        const requesterMembership = await this.requireActiveMember(groupId, requesterId);

        if (requesterMembership.role !== GroupMemberRole.OWNER) {
            throw new ForbiddenException('Only the group owner can unblock members');
        }

        const targetMembership = await this.membershipRepository.findOne({
            where: {
                group: {id: groupId},
                user: {id: targetUserId},
                status: GroupMemberStatus.BLOCKED,
            },
            relations: ['user'],
        });

        if (!targetMembership) {
            throw new NotFoundException('Blocked membership not found');
        }

        targetMembership.status = GroupMemberStatus.ACTIVE;
        await this.membershipRepository.save(targetMembership);

        return this.toDto(targetMembership);
    }

    async transferOwnership(
        groupId: string,
        requesterId: string,
        dto: TransferOwnershipDto,
    ): Promise<MembershipDto[]> {
        const requesterMembership = await this.requireActiveMember(groupId, requesterId);

        if (requesterMembership.role !== GroupMemberRole.OWNER) {
            throw new ForbiddenException('Only the group owner can transfer ownership');
        }

        if (dto.newOwnerId === requesterId) {
            throw new BadRequestException('Cannot transfer ownership to yourself');
        }

        const group = await this.groupRepository.findOne({where: {id: groupId}});
        if (!group) throw new NotFoundException('Group not found');

        const newOwnerMembership = await this.membershipRepository.findOne({
            where: {
                group: {id: groupId},
                user: {id: dto.newOwnerId},
                status: GroupMemberStatus.ACTIVE,
            },
            relations: ['user'],
        });

        if (!newOwnerMembership) {
            throw new NotFoundException('Target user is not an active member of this group');
        }

        requesterMembership.role = GroupMemberRole.ADMIN;
        newOwnerMembership.role = GroupMemberRole.OWNER;
        group.owner = newOwnerMembership.user;

        await this.groupRepository.save(group);
        await this.membershipRepository.save([requesterMembership, newOwnerMembership]);

        return [this.toDto(requesterMembership), this.toDto(newOwnerMembership)];
    }

    private async requireActiveMember(
        groupId: string,
        userId: string,
    ): Promise<GroupMembership> {
        const membership = await this.membershipRepository.findOne({
            where: {
                group: {id: groupId},
                user: {id: userId},
                status: GroupMemberStatus.ACTIVE,
            },
            relations: ['user'],
        });

        if (!membership) {
            throw new ForbiddenException('You are not an active member of this group');
        }

        return membership;
    }

    private async findMembership(groupId: string, userId: string): Promise<GroupMembership> {
        const membership = await this.membershipRepository.findOne({
            where: {group: {id: groupId}, user: {id: userId}},
            relations: ['user'],
        });

        if (!membership) {
            throw new NotFoundException('Member not found in this group');
        }

        return membership;
    }

    private toDto(membership: GroupMembership): MembershipDto {
        return {
            id: membership.id,
            userId: membership.user.id,
            username: membership.user.username,
            avatarUrl: membership.user.avatarUrl ?? null,
            role: membership.role,
            status: membership.status,
            joinedAt: membership.joinedAt,
        };
    }
}

