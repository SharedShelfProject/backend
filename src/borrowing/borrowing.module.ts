import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { Book } from '../database/entities/book.entity';
import { BorrowRequest } from '../database/entities/borrow-request.entity';
import { GroupBook } from '../database/entities/group-book.entity';
import { GroupMembership } from '../database/entities/group-membership.entity';
import { Loan } from '../database/entities/loan.entity';
import { BorrowingController } from './borrowing.controller';
import { BorrowingService } from './borrowing.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, GroupBook, GroupMembership, BorrowRequest, Loan]),
    AuthModule,
  ],
  controllers: [BorrowingController],
  providers: [BorrowingService],
  exports: [BorrowingService],
})
export class BorrowingModule {}
