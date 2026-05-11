import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BookReviewsService } from './book-reviews.service';
import { BookReviewDto } from './dto/book-review.dto';
import { CreateBookReviewDto } from './dto/create-book-review.dto';

@ApiTags('book-reviews')
@Controller()
export class BookReviewsController {
  constructor(private readonly bookReviewsService: BookReviewsService) {}

  @Get('books/:bookId/reviews')
  @ApiOperation({ summary: 'Get all reviews for a book' })
  @ApiParam({ name: 'bookId', description: 'Book UUID' })
  @ApiResponse({ status: 200, type: [BookReviewDto] })
  getBookReviews(@Param('bookId') bookId: string): Promise<BookReviewDto[]> {
    return this.bookReviewsService.getBookReviews(bookId);
  }

  @Post('loans/:loanId/reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review for a book after a completed loan' })
  @ApiParam({ name: 'loanId', description: 'Loan UUID' })
  @ApiResponse({ status: 201, type: BookReviewDto })
  createReview(
    @Param('loanId') loanId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateBookReviewDto,
  ): Promise<BookReviewDto> {
    return this.bookReviewsService.createReview(loanId, user.id, dto);
  }
}
