import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { BorrowRequestDto } from './borrow-request.dto';
import { LoanDto } from './loan.dto';

export class ApproveBorrowRequestResultDto {
  @ApiProperty({ type: BorrowRequestDto })
  request: BorrowRequestDto;

  @ApiPropertyOptional({ type: LoanDto, nullable: true })
  loan: LoanDto | null;
}
