import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';

import { BaseEntity } from './base.entity';
import { Book } from './book.entity';
import { BorrowRequest } from './borrow-request.entity';
import { Group } from './group.entity';

@Entity({ name: 'group_books' })
@Unique('UQ_group_book_group_book', ['group', 'book'])
export class GroupBook extends BaseEntity {
  @ManyToOne(() => Group, (group) => group.catalogEntries, { nullable: false })
  @JoinColumn({ name: 'group_id' })
  group: Group;

  @ManyToOne(() => Book, (book) => book.catalogEntries, { nullable: false })
  @JoinColumn({ name: 'book_id' })
  book: Book;

  @Column({ name: 'is_visible', type: 'boolean', default: true })
  isVisible: boolean;

  @Column({ name: 'added_at', type: 'timestamptz', nullable: true })
  addedAt: Date | null;

  @OneToMany(() => BorrowRequest, (borrowRequest) => borrowRequest.groupBook)
  borrowRequests: BorrowRequest[];
}
