import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from './base.entity';
import { Loan } from './loan.entity';
import { User } from './user.entity';

@Entity({ name: 'reputation_reviews' })
@Unique('UQ_reputation_review_loan_author', ['loan', 'author'])
export class ReputationReview extends BaseEntity {
  @ManyToOne(() => Loan, (loan) => loan.reviews, { nullable: false })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  @ManyToOne(() => User, (user) => user.writtenReviews, { nullable: false })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => User, (user) => user.receivedReviews, { nullable: false })
  @JoinColumn({ name: 'subject_id' })
  subject: User;

  @Column({ type: 'int' })
  rating: number;

  @Column({ name: 'reputation_delta', type: 'int', default: 0 })
  reputationDelta: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;
}
