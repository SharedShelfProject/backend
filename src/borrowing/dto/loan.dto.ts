import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { LoanStatus } from '../../common/enums';

export class LoanDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bookId: string;

  @ApiProperty()
  bookTitle: string;

  @ApiProperty()
  bookAuthor: string;

  @ApiProperty()
  groupId: string;

  @ApiProperty()
  borrowerId: string;

  @ApiProperty()
  borrowerUsername: string;

  @ApiProperty()
  ownerId: string;

  @ApiProperty()
  ownerUsername: string;

  @ApiProperty()
  borrowedAt: Date;

  @ApiProperty()
  dueAt: Date;

  @ApiPropertyOptional({ nullable: true })
  returnedAt: Date | null;

  @ApiProperty({ enum: LoanStatus })
  status: LoanStatus;

  @ApiPropertyOptional({ nullable: true })
  notes: string | null;
}

