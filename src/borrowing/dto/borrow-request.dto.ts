import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BorrowRequestStatus } from '../../common/enums';

export class BorrowRequestDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  bookId: string;

  @ApiProperty()
  groupBookId: string;

  @ApiProperty()
  requesterId: string;

  @ApiProperty()
  requesterUsername: string;

  @ApiProperty({ enum: BorrowRequestStatus })
  status: BorrowRequestStatus;

  @ApiProperty()
  queuePosition: number;

  @ApiPropertyOptional({ nullable: true })
  message: string | null;

  @ApiPropertyOptional({ nullable: true })
  approvedDueAt: Date | null;

  @ApiPropertyOptional({ nullable: true })
  approvalNotes: string | null;

  @ApiProperty()
  requestedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  resolvedAt: Date | null;
}
