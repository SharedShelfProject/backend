import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Book } from './entities/book.entity';
import { BookReview } from './entities/book-review.entity';
import { BorrowRequest } from './entities/borrow-request.entity';
import { GroupBook } from './entities/group-book.entity';
import { GroupMembership } from './entities/group-membership.entity';
import { Group } from './entities/group.entity';
import { Loan } from './entities/loan.entity';
import { Notification } from './entities/notification.entity';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Group,
      GroupMembership,
      Book,
      BookReview,
      GroupBook,
      BorrowRequest,
      Loan,
      Notification,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class SharedShelfDatabaseModule {}
