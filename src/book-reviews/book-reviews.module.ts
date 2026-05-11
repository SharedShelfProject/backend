import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module';
import { BookReview } from '../database/entities/book-review.entity';
import { Loan } from '../database/entities/loan.entity';
import { BookReviewsController } from './book-reviews.controller';
import { BookReviewsService } from './book-reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([BookReview, Loan]), AuthModule],
  controllers: [BookReviewsController],
  providers: [BookReviewsService],
})
export class BookReviewsModule {}
