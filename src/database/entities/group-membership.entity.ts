import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';

import { GroupMemberRole, GroupMemberStatus } from '../../common/enums';
import { BaseEntity } from './base.entity';
import { Group } from './group.entity';
import { User } from './user.entity';

@Entity({ name: 'group_memberships' })
@Unique('UQ_group_membership_group_user', ['group', 'user'])
export class GroupMembership extends BaseEntity {
  @ManyToOne(() => Group, (group) => group.memberships, { nullable: false })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User, (user) => user.memberships, { nullable: false })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: GroupMemberRole,
    default: GroupMemberRole.MEMBER,
  })
  role: GroupMemberRole;

  @Column({
    type: 'enum',
    enum: GroupMemberStatus,
    default: GroupMemberStatus.PENDING,
  })
  status: GroupMemberStatus;

  @Column({ name: 'joined_at', type: 'timestamptz', nullable: true })
  joinedAt: Date | null;
}
