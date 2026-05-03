import {
    BadRequestException,
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {ILike, Repository} from 'typeorm';
import {randomBytes} from 'crypto';
import {GroupMemberRole, GroupMemberStatus, GroupVisibility} from '../common/enums';
import {Group} from '../database/entities/group.entity';
import {GroupMembership} from '../database/entities/group-membership.entity';
import {User} from '../database/entities/user.entity';
import {CreateGroupDto} from './dto/create-group.dto';
import {SearchGroupsDto} from './dto/search-groups.dto';
import {GroupDto} from './dto/group.dto';
import {JoinGroupDto} from './dto/join-group.dto';
import {GroupMemberDto} from "./dto/group-member.dto";
import {GroupDetailDto} from "./dto/group-detail.dto";
import {GroupListDto} from "./dto/group-list.dto";

@Injectable()
export class GroupsService {
    constructor(
        @InjectRepository(Group)
        private readonly groupRepository: Repository<Group>,
        @InjectRepository(GroupMembership)
        private readonly membershipRepository: Repository<GroupMembership>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {
    }

    async createGroup(userId: string, dto: CreateGroupDto): Promise<GroupDetailDto> {
        const owner = await this.findActiveUser(userId);

        const visibility = dto.visibility ?? GroupVisibility.PRIVATE;
        const inviteCode =
            visibility === GroupVisibility.PRIVATE ? randomBytes(16).toString('hex') : null;

        const group = this.groupRepository.create({
            name: dto.name,
            description: dto.description ?? null,
            visibility,
            inviteCode,
            owner,
        });

        await this.groupRepository.save(group);

        const membership = this.membershipRepository.create({
            group,
            user: owner,
            role: GroupMemberRole.OWNER,
            status: GroupMemberStatus.ACTIVE,
            joinedAt: new Date(),
        });

        await this.membershipRepository.save(membership);

        return this.toDetailDto(group, [membership]);
    }

    async searchGroups(dto: SearchGroupsDto): Promise<GroupListDto> {
        const {query, visibility, page = 1, limit = 20} = dto;

        const qb = this.groupRepository
            .createQueryBuilder('group')
            .leftJoin('group.owner', 'owner')
            .addSelect(['owner.id', 'owner.username'])
            .leftJoin('group.memberships', 'membership', 'membership.status = :active', {
                active: GroupMemberStatus.ACTIVE,
            })
            .loadRelationCountAndMap('group.memberCount', 'group.memberships', 'ms', (qb) =>
                qb.where('ms.status = :active', {active: GroupMemberStatus.ACTIVE}),
            );

        if (query) {
            qb.andWhere([{name: ILike(`%${query}%`)}, {description: ILike(`%${query}%`)}]);
        }

        if (visibility) {
            qb.andWhere('group.visibility = :visibility', {visibility});
        }

        qb.orderBy('group.createdAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit);

        const [groups, total] = await qb.getManyAndCount();

        return {
            items: groups.map((g) => this.toDto(g)),
            total,
            page,
            limit,
        };
    }

    async getGroupById(groupId: string, userId?: string): Promise<GroupDetailDto> {
        const group = await this.groupRepository.findOne({
            where: {id: groupId},
            relations: ['owner', 'memberships', 'memberships.user'],
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        const activeMembers = group.memberships.filter(
            (m) => m.status === GroupMemberStatus.ACTIVE,
        );

        if (group.visibility === GroupVisibility.PRIVATE) {
            const isMember = userId
                ? activeMembers.some((m) => m.user.id === userId)
                : false;
            if (!isMember) {
                throw new ForbiddenException('This group is private');
            }
        }

        const isMember = userId
            ? activeMembers.some((m) => m.user.id === userId)
            : false;

        const detailDto = this.toDetailDto(group, activeMembers);

        if (!isMember) {
            detailDto.inviteCode = null;
        }

        return detailDto;
    }

    async joinGroup(groupId: string, userId: string, dto: JoinGroupDto): Promise<GroupDetailDto> {
        const group = await this.groupRepository.findOne({
            where: {id: groupId},
            relations: ['owner', 'memberships', 'memberships.user'],
        });

        if (!group) {
            throw new NotFoundException('Group not found');
        }

        const existingMembership = group.memberships.find((m) => m.user.id === userId);

        if (existingMembership) {
            if (existingMembership.status === GroupMemberStatus.ACTIVE) {
                throw new ConflictException('Already a member of this group');
            }
            if (existingMembership.status === GroupMemberStatus.BLOCKED) {
                throw new ForbiddenException('You are blocked from this group');
            }
        }

        if (group.visibility === GroupVisibility.PRIVATE) {
            if (!dto.inviteCode || dto.inviteCode !== group.inviteCode) {
                throw new BadRequestException('Invalid or missing invite code');
            }
        }

        const user = await this.findActiveUser(userId);

        let membership: GroupMembership;
        if (existingMembership && existingMembership.status === GroupMemberStatus.PENDING) {
            existingMembership.status = GroupMemberStatus.ACTIVE;
            existingMembership.joinedAt = new Date();
            membership = await this.membershipRepository.save(existingMembership);
        } else {
            membership = this.membershipRepository.create({
                group,
                user,
                role: GroupMemberRole.MEMBER,
                status: GroupMemberStatus.ACTIVE,
                joinedAt: new Date(),
            });
            await this.membershipRepository.save(membership);
        }

        const updatedGroup = await this.groupRepository.findOne({
            where: {id: groupId},
            relations: ['owner', 'memberships', 'memberships.user'],
        });

        const activeMembers = updatedGroup!.memberships.filter(
            (m) => m.status === GroupMemberStatus.ACTIVE,
        );

        return this.toDetailDto(updatedGroup!, activeMembers);
    }

    async leaveGroup(groupId: string, userId: string): Promise<void> {
        const membership = await this.membershipRepository.findOne({
            where: {
                group: {id: groupId},
                user: {id: userId},
                status: GroupMemberStatus.ACTIVE,
            },
            relations: ['group'],
        });

        if (!membership) {
            throw new NotFoundException('Membership not found');
        }

        if (membership.role === GroupMemberRole.OWNER) {
            throw new BadRequestException('Group owner cannot leave. Transfer ownership or delete the group.');
        }

        await this.membershipRepository.remove(membership);
    }

    async getMyGroups(userId: string): Promise<GroupListDto> {
        const memberships = await this.membershipRepository.find({
            where: {user: {id: userId}, status: GroupMemberStatus.ACTIVE},
            relations: ['group', 'group.owner', 'group.memberships'],
        });

        const groups = memberships.map((m) => m.group);

        return {
            items: groups.map((g) => this.toDto(g)),
            total: groups.length,
            page: 1,
            limit: groups.length,
        };
    }

    private async findActiveUser(userId: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: {id: userId, isActive: true},
        });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        return user;
    }

    private toDto(group: Group & { memberCount?: number }): GroupDto {
        const activeMembers =
            group.memberships?.filter((m) => m.status === GroupMemberStatus.ACTIVE) ?? [];

        return {
            id: group.id,
            name: group.name,
            description: group.description,
            visibility: group.visibility,
            ownerId: group.owner.id,
            ownerUsername: group.owner.username,
            memberCount: (group as any).memberCount ?? activeMembers.length,
            createdAt: group.createdAt,
        };
    }

    private toDetailDto(group: Group, activeMembers: GroupMembership[]): GroupDetailDto {
        const members: GroupMemberDto[] = activeMembers.map((m) => ({
            id: m.user.id,
            username: m.user.username,
            avatarUrl: m.user.avatarUrl ?? null,
            role: m.role,
            joinedAt: m.joinedAt,
        }));

        return {
            id: group.id,
            name: group.name,
            description: group.description,
            visibility: group.visibility,
            ownerId: group.owner.id,
            ownerUsername: group.owner.username,
            memberCount: activeMembers.length,
            createdAt: group.createdAt,
            inviteCode: group.inviteCode,
            members,
        };
    }
}
