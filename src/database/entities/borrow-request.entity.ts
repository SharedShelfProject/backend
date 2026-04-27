import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BorrowRequestStatus } from '../../common/enums';
import { BaseEntity } from './base.entity';
import { Book } from './book.entity';
import { GroupBook } from './group-book.entity';
import { User } from './user.entity';

@Entity({ name: 'borrow_requests' })
export class BorrowRequest extends BaseEntity {
  @ManyToOne(() => Book, (book) => book.borrowRequests, { nullable: false })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @ManyToOne(() => GroupBook, (groupBook) => groupBook.borrowRequests, {
    nullable: false,
  })
  @JoinColumn({ name: 'group_book_id' })
  groupBook: GroupBook;

  @ManyToOne(() => User, (user) => user.borrowRequests, { nullable: false })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @Column({
    type: 'enum',
    enum: BorrowRequestStatus,
    default: BorrowRequestStatus.PENDING,
  })
  status: BorrowRequestStatus;

  @Column({ name: 'queue_position', type: 'int' })
  queuePosition: number;

  @Column({ type: 'text', nullable: true })
  message: string | null;

  @Column({ name: 'requested_at', type: 'timestamptz', default: () => 'NOW()' })
  requestedAt: Date;

  @Column({ name: 'resolved_at', type: 'timestamptz', nullable: true })
  resolvedAt: Date | null;
}
