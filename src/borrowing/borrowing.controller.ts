import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BorrowingService } from './borrowing.service';
import { ApproveBorrowRequestDto } from './dto/approve-borrow-request.dto';
import { ApproveBorrowRequestResultDto } from './dto/approve-borrow-request-result.dto';
import { BorrowRequestDto } from './dto/borrow-request.dto';
import { CreateBorrowRequestDto } from './dto/create-borrow-request.dto';
import { LoanDto } from './dto/loan.dto';
import { ReturnLoanDto } from './dto/return-loan.dto';
import { ReturnLoanResultDto } from './dto/return-loan-result.dto';

@ApiTags('borrowing')
@Controller()
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BorrowingController {
  constructor(private readonly borrowingService: BorrowingService) {}

  @Post('catalog/:entryId/requests')
  @ApiOperation({ summary: 'Create a borrow request and join the queue for a group book' })
  @ApiParam({ name: 'entryId', description: 'Catalog entry UUID' })
  @ApiResponse({ status: 201, type: BorrowRequestDto })
  createBorrowRequest(
    @Param('entryId') entryId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: CreateBorrowRequestDto,
  ): Promise<BorrowRequestDto> {
    return this.borrowingService.createBorrowRequest(entryId, user.id, dto);
  }

  @Get('catalog/:entryId/requests')
  @ApiOperation({ summary: 'Get the current queue for a group book' })
  @ApiParam({ name: 'entryId', description: 'Catalog entry UUID' })
  @ApiResponse({ status: 200, type: [BorrowRequestDto] })
  listQueue(
    @Param('entryId') entryId: string,
    @CurrentUser() user: { id: string },
  ): Promise<BorrowRequestDto[]> {
    return this.borrowingService.listQueue(entryId, user.id);
  }

  @Post('requests/:requestId/approve')
  @ApiOperation({ summary: 'Approve a request and either queue it or activate the loan immediately' })
  @ApiParam({ name: 'requestId', description: 'Borrow request UUID' })
  @ApiResponse({ status: 201, type: ApproveBorrowRequestResultDto })
  approveBorrowRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ApproveBorrowRequestDto,
  ): Promise<ApproveBorrowRequestResultDto> {
    return this.borrowingService.approveBorrowRequest(requestId, user.id, dto);
  }

  @Post('requests/:requestId/reject')
  @ApiOperation({ summary: 'Reject a pending request and reindex the queue' })
  @ApiParam({ name: 'requestId', description: 'Borrow request UUID' })
  @ApiResponse({ status: 201, type: BorrowRequestDto })
  rejectBorrowRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: { id: string },
  ): Promise<BorrowRequestDto> {
    return this.borrowingService.rejectBorrowRequest(requestId, user.id);
  }

  @Post('requests/:requestId/cancel')
  @ApiOperation({ summary: 'Cancel your own pending or approved request' })
  @ApiParam({ name: 'requestId', description: 'Borrow request UUID' })
  @ApiResponse({ status: 201, type: BorrowRequestDto })
  cancelBorrowRequest(
    @Param('requestId') requestId: string,
    @CurrentUser() user: { id: string },
  ): Promise<BorrowRequestDto> {
    return this.borrowingService.cancelBorrowRequest(requestId, user.id);
  }

  @Get('loans/my')
  @ApiOperation({ summary: 'List active loans borrowed by current user' })
  @ApiResponse({ status: 200, type: [LoanDto] })
  listMyLoans(
    @CurrentUser() user: { id: string },
  ): Promise<LoanDto[]> {
    return this.borrowingService.listMyLoans(user.id);
  }

  @Get('loans')
  @ApiOperation({ summary: 'List all loans in a group' })
  @ApiParam({ name: 'groupId', description: 'Group UUID' })
  @ApiResponse({ status: 200, type: [LoanDto] })
  listLoans(
    @Param('groupId') groupId: string,
    @CurrentUser() user: { id: string },
  ): Promise<LoanDto[]> {
    return this.borrowingService.listLoans(groupId, user.id);
  }

  @Post('loans/:loanId/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Return a borrowed book and update its status' })
  @ApiParam({ name: 'loanId', description: 'Loan UUID' })
  @ApiResponse({ status: 200, type: ReturnLoanResultDto })
  returnLoan(
    @Param('loanId') loanId: string,
    @CurrentUser() user: { id: string },
    @Body() dto: ReturnLoanDto,
  ): Promise<ReturnLoanResultDto> {
    return this.borrowingService.returnLoan(loanId, user.id, dto);
  }
}

