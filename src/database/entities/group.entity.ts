import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from './base.entity';
import { GroupBook } from './group-book.entity';
import { GroupMembership } from './group-membership.entity';
import { Loan } from './loan.entity';
import { User } from './user.entity';

export enum GroupVisibility {
  OPEN = 'open',
  PRIVATE = 'private',
}

@Entity({ name: 'groups' })
export class Group extends BaseEntity {
  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({
    type: 'enum',
    enum: GroupVisibility,
    default: GroupVisibility.PRIVATE,
  })
  visibility: GroupVisibility;

  @Column({ name: 'invite_code', type: 'varchar', length: 32, nullable: true })
  inviteCode: string | null;

  @ManyToOne(() => User, (user) => user.ownedGroups, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => GroupMembership, (membership) => membership.group)
  memberships: GroupMembership[];

  @OneToMany(() => GroupBook, (groupBook) => groupBook.group)
  catalogEntries: GroupBook[];

  @OneToMany(() => Loan, (loan) => loan.group)
  loans: Loan[];
}
