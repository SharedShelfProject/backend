import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from './base.entity';
import { Book } from './book.entity';
import { BorrowRequest } from './borrow-request.entity';
import { GroupMembership } from './group-membership.entity';
import { Group } from './group.entity';
import { Loan } from './loan.entity';
import { Notification } from './notification.entity';
import { ReputationReview } from './reputation-review.entity';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ name: 'first_name', type: 'varchar', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'text', nullable: true })
  bio: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 255, nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'reputation_score', type: 'int', default: 0 })
  reputationScore: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @OneToMany(() => Group, (group) => group.owner)
  ownedGroups: Group[];

  @OneToMany(() => GroupMembership, (membership) => membership.user)
  memberships: GroupMembership[];

  @OneToMany(() => Book, (book) => book.owner)
  books: Book[];

  @OneToMany(() => BorrowRequest, (borrowRequest) => borrowRequest.requester)
  borrowRequests: BorrowRequest[];

  @OneToMany(() => Loan, (loan) => loan.borrower)
  borrowedLoans: Loan[];

  @OneToMany(() => Loan, (loan) => loan.owner)
  ownedLoans: Loan[];

  @OneToMany(() => Notification, (notification) => notification.user)
  notifications: Notification[];

  @OneToMany(() => ReputationReview, (review) => review.author)
  writtenReviews: ReputationReview[];

  @OneToMany(() => ReputationReview, (review) => review.subject)
  receivedReviews: ReputationReview[];
}
