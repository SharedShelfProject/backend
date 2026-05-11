import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { LoanDto } from './loan.dto';

export class ReturnLoanResultDto {
  @ApiProperty({ type: LoanDto })
  returnedLoan: LoanDto;

  @ApiPropertyOptional({ type: LoanDto, nullable: true })
  nextLoan: LoanDto | null;
}
