import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class ApproveBorrowRequestDto {
  @ApiProperty({
    description: 'Loan due date in ISO 8601 format',
    example: '2026-05-25T12:00:00.000Z',
  })
  @IsDateString()
  dueAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
