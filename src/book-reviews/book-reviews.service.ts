import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { LoanStatus } from '../common/enums';
import { BookReview } from '../database/entities/book-review.entity';
import { Loan } from '../database/entities/loan.entity';
import { CreateBookReviewDto } from './dto/create-book-review.dto';
import { BookReviewDto } from './dto/book-review.dto';

@Injectable()
export class BookReviewsService {
  constructor(
    @InjectRepository(BookReview)
    private readonly bookReviewRepository: Repository<BookReview>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  async createReview(
    loanId: string,
    userId: string,
    dto: CreateBookReviewDto,
  ): Promise<BookReviewDto> {
    const loan = await this.loanRepository.findOne({
      where: { id: loanId },
      relations: ['book', 'borrower'],
    });

    if (!loan) {
      throw new NotFoundException('Loan not found');
    }

    if (loan.borrower.id !== userId) {
      throw new ForbiddenException('Only the borrower can leave a review for this book');
    }

    if (loan.status !== LoanStatus.RETURNED) {
      throw new BadRequestException('You can leave a review only after the book is returned');
    }

    const existingReview = await this.bookReviewRepository.findOne({
      where: { loan: { id: loanId } },
    });

    if (existingReview) {
      throw new ConflictException('A review for this loan already exists');
    }

    const review = this.bookReviewRepository.create({
      book: loan.book,
      loan,
      author: loan.borrower,
      rating: dto.rating,
      comment: dto.comment ?? null,
    });

    const savedReview = await this.bookReviewRepository.save(review);
    const reviewWithRelations = await this.bookReviewRepository.findOne({
      where: { id: savedReview.id },
      relations: ['book', 'loan', 'author'],
    });

    return this.toDto(reviewWithRelations!);
  }

  async getBookReviews(bookId: string): Promise<BookReviewDto[]> {
    const reviews = await this.bookReviewRepository.find({
      where: { book: { id: bookId } },
      relations: ['book', 'loan', 'author'],
      order: { createdAt: 'DESC' },
    });

    return reviews.map((review) => this.toDto(review));
  }

  private toDto(review: BookReview): BookReviewDto {
    return {
      id: review.id,
      bookId: review.book.id,
      loanId: review.loan.id,
      authorId: review.author.id,
      authorUsername: review.author.username,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,
    };
  }
}
