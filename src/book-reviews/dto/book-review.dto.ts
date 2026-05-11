import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BookReviewDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bookId: string;

  @ApiProperty()
  loanId: string;

  @ApiProperty()
  authorId: string;

  @ApiProperty()
  authorUsername: string;

  @ApiProperty()
  rating: number;

  @ApiPropertyOptional({ nullable: true })
  comment: string | null;

  @ApiProperty()
  createdAt: Date;
}
