import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';

import { BaseEntity } from './base.entity';
import { Book } from './book.entity';
import { Loan } from './loan.entity';
import { User } from './user.entity';

@Entity({ name: 'book_reviews' })
@Unique('UQ_book_review_loan', ['loan'])
export class BookReview extends BaseEntity {
  @ManyToOne(() => Book, (book) => book.reviews, { nullable: false })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @ManyToOne(() => Loan, (loan) => loan.bookReviews, { nullable: false })
  @JoinColumn({ name: 'loan_id' })
  loan: Loan;

  @ManyToOne(() => User, (user) => user.bookReviews, { nullable: false })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string | null;
}
