import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BaseEntity } from './base.entity';
import { BorrowRequest } from './borrow-request.entity';
import { GroupBook } from './group-book.entity';
import { Loan } from './loan.entity';
import { User } from './user.entity';

export enum BookStatus {
  AVAILABLE = 'available',
  QUEUED = 'queued',
  BORROWED = 'borrowed',
  UNAVAILABLE = 'unavailable',
}

@Entity({ name: 'books' })
export class Book extends BaseEntity {
  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'varchar', length: 150 })
  author: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  isbn: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  genre: string | null;

  @Column({ name: 'publication_year', type: 'int', nullable: true })
  publicationYear: number | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  language: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'cover_url', type: 'varchar', length: 255, nullable: true })
  coverUrl: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  condition: string | null;

  @Column({
    type: 'enum',
    enum: BookStatus,
    default: BookStatus.AVAILABLE,
  })
  status: BookStatus;

  @ManyToOne(() => User, (user) => user.books, { nullable: false })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => GroupBook, (groupBook) => groupBook.book)
  catalogEntries: GroupBook[];

  @OneToMany(() => BorrowRequest, (borrowRequest) => borrowRequest.book)
  borrowRequests: BorrowRequest[];

  @OneToMany(() => Loan, (loan) => loan.book)
  loans: Loan[];
}
