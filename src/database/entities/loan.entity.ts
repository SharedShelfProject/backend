import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { LoanStatus } from '../../common/enums';
import { BaseEntity } from './base.entity';
import { Book } from './book.entity';
import { Group } from './group.entity';
import { Notification } from './notification.entity';
import { ReputationReview } from './reputation-review.entity';
import { User } from './user.entity';

@Entity({ name: 'loans' })
export class Loan extends BaseEntity {
  @ManyToOne(() => Book, (book) => book.loans, { nullable: false })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @ManyToOne(() => Group, (group) => group.loans, { nullable: false })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => User, (user) => user.borrowedLoans, { nullable: false })
  @JoinColumn({ name: 'borrower_id' })
  borrower: User;

  @ManyToOne(() => User, (user) => user.ownedLoans, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ name: 'borrowed_at', type: 'timestamptz', default: () => 'NOW()' })
  borrowedAt: Date;

  @Column({ name: 'due_at', type: 'timestamptz' })
  dueAt: Date;

  @Column({ name: 'returned_at', type: 'timestamptz', nullable: true })
  returnedAt: Date | null;

  @Column({
    type: 'enum',
    enum: LoanStatus,
    default: LoanStatus.ACTIVE,
  })
  status: LoanStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => Notification, (notification) => notification.loan)
  notifications: Notification[];

  @OneToMany(() => ReputationReview, (review) => review.loan)
  reviews: ReputationReview[];
}
