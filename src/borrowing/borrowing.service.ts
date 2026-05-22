import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';

import {
  BookStatus,
  BorrowRequestStatus,
  GroupMemberStatus,
  LoanStatus,
} from '../common/enums';
import { Book } from '../database/entities/book.entity';
import { BorrowRequest } from '../database/entities/borrow-request.entity';
import { GroupBook } from '../database/entities/group-book.entity';
import { GroupMembership } from '../database/entities/group-membership.entity';
import { Loan } from '../database/entities/loan.entity';
import { User } from '../database/entities/user.entity';
import { ApproveBorrowRequestDto } from './dto/approve-borrow-request.dto';
import { ApproveBorrowRequestResultDto } from './dto/approve-borrow-request-result.dto';
import { BorrowRequestDto } from './dto/borrow-request.dto';
import { CreateBorrowRequestDto } from './dto/create-borrow-request.dto';
import { LoanDto } from './dto/loan.dto';
import { ReturnLoanDto } from './dto/return-loan.dto';
import { ReturnLoanResultDto } from './dto/return-loan-result.dto';

const MAX_REPUTATION_SCORE = 100;
const MIN_REPUTATION_SCORE = 0;
const MILLISECONDS_IN_DAY = 1000 * 60 * 60 * 24;

@Injectable()
export class BorrowingService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(GroupBook)
    private readonly groupBookRepository: Repository<GroupBook>,
    @InjectRepository(GroupMembership)
    private readonly membershipRepository: Repository<GroupMembership>,
    @InjectRepository(BorrowRequest)
    private readonly borrowRequestRepository: Repository<BorrowRequest>,
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
  ) {}

  async createBorrowRequest(
    entryId: string,
    requesterId: string,
    dto: CreateBorrowRequestDto,
  ): Promise<BorrowRequestDto> {
    return this.dataSource.transaction(async (manager) => {
      const entry = await this.findEntryById(entryId, manager);
      const groupId = entry.group.id;

      await this.requireActiveMember(groupId, requesterId, manager);
      this.assertEntryIsRequestable(entry, requesterId);

      const existingPendingRequest = await manager.getRepository(BorrowRequest).findOne({
        where: {
          groupBook: { id: entry.id },
          requester: { id: requesterId },
          status: In([BorrowRequestStatus.PENDING, BorrowRequestStatus.APPROVED]),
        },
      });

      if (existingPendingRequest) {
        throw new BadRequestException('You already have an active request for this book');
      }

      const existingLoan = await manager.getRepository(Loan).findOne({
        where: {
          group: { id: groupId },
          book: { id: entry.book.id },
          borrower: { id: requesterId },
          status: In([LoanStatus.ACTIVE, LoanStatus.OVERDUE]),
        },
      });

      if (existingLoan) {
        throw new BadRequestException('You already have this book on loan');
      }

      const request = manager.getRepository(BorrowRequest).create({
        book: entry.book,
        groupBook: entry,
        requester: { id: requesterId } as User,
        status: BorrowRequestStatus.PENDING,
        queuePosition: 0,
        message: dto.message ?? null,
        approvedDueAt: null,
        approvalNotes: null,
        requestedAt: new Date(),
      });

      const savedRequest = await manager.getRepository(BorrowRequest).save(request);
      await this.syncBookStatus(entry.book.id, manager);

      const requestWithRelations = await manager.getRepository(BorrowRequest).findOne({
        where: { id: savedRequest.id },
        relations: ['requester', 'book', 'groupBook'],
      });

      return this.toBorrowRequestDto(requestWithRelations!);
    });
  }

  async listQueue(
    entryId: string,
    requesterId: string,
  ): Promise<BorrowRequestDto[]> {
    const entry = await this.findEntryById(entryId);
    const groupId = entry.group.id;

    await this.requireActiveMember(groupId, requesterId);

    const requests = await this.borrowRequestRepository.find({
      where: {
        groupBook: { id: entryId },
        status: In([BorrowRequestStatus.APPROVED, BorrowRequestStatus.PENDING]),
      },
      relations: ['requester', 'book', 'groupBook'],
    });

    requests.sort((left, right) => {
      const leftPriority = left.status === BorrowRequestStatus.APPROVED ? 0 : 1;
      const rightPriority = right.status === BorrowRequestStatus.APPROVED ? 0 : 1;

      if (leftPriority !== rightPriority) {
        return leftPriority - rightPriority;
      }

      if (left.status === BorrowRequestStatus.APPROVED && right.status === BorrowRequestStatus.APPROVED) {
        return left.queuePosition - right.queuePosition;
      }

      return left.requestedAt.getTime() - right.requestedAt.getTime();
    });

    return requests.map((request) => this.toBorrowRequestDto(request));
  }

  async approveBorrowRequest(
    requestId: string,
    requesterId: string,
    dto: ApproveBorrowRequestDto,
  ): Promise<ApproveBorrowRequestResultDto> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.getRepository(BorrowRequest).findOne({
        where: {
          id: requestId,
        },
        relations: [
          'requester',
          'book',
          'book.owner',
          'groupBook',
          'groupBook.group',
          'groupBook.book',
          'groupBook.book.owner',
        ],
      });

      if (!request) {
        throw new NotFoundException('Borrow request not found');
      }

      const groupId = request.groupBook.group.id;
      const membership = await this.requireActiveMember(groupId, requesterId, manager);
      this.assertCanManageEntry(request.groupBook, membership, requesterId);

      if (request.status !== BorrowRequestStatus.PENDING) {
        throw new BadRequestException('Only pending requests can be approved');
      }

      const requesterMembership = await this.requireActiveMember(
        groupId,
        request.requester.id,
        manager,
      );
      void requesterMembership;

      const dueAt = new Date(dto.dueAt);
      if (Number.isNaN(dueAt.getTime())) {
        throw new BadRequestException('Invalid due date');
      }

      const now = new Date();
      if (dueAt <= now) {
        throw new BadRequestException('Due date must be in the future');
      }

      request.status = BorrowRequestStatus.APPROVED;
      request.approvedDueAt = dueAt;
      request.approvalNotes = dto.notes ?? null;
      request.resolvedAt = null;

      const activeLoan = await manager.getRepository(Loan).findOne({
        where: {
          book: { id: request.book.id },
          status: In([LoanStatus.ACTIVE, LoanStatus.OVERDUE]),
        },
      });

      const approvedQueueLength = await manager.getRepository(BorrowRequest).count({
        where: {
          groupBook: { id: request.groupBook.id },
          status: BorrowRequestStatus.APPROVED,
        },
      });

      request.queuePosition = approvedQueueLength + 1;
      await manager.getRepository(BorrowRequest).save(request);

      let loan: Loan | null = null;
      if (!activeLoan && request.queuePosition === 1) {
        loan = await this.activateApprovedRequest(request.id, manager);
      }

      await this.reindexApprovedRequests(request.groupBook.id, manager);
      await this.syncBookStatus(request.book.id, manager);

      const requestWithRelations = await manager.getRepository(BorrowRequest).findOne({
        where: { id: request.id },
        relations: ['requester', 'book', 'groupBook'],
      });

      return {
        request: this.toBorrowRequestDto(requestWithRelations!),
        loan: loan ? this.toLoanDto(loan) : null,
      };
    });
  }

  async rejectBorrowRequest(
    requestId: string,
    requesterId: string,
  ): Promise<BorrowRequestDto> {
    return this.resolvePendingRequest(
      requestId,
      requesterId,
      BorrowRequestStatus.REJECTED,
    );
  }

  async cancelBorrowRequest(
    requestId: string,
    requesterId: string,
  ): Promise<BorrowRequestDto> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.getRepository(BorrowRequest).findOne({
        where: {
          id: requestId,
          requester: { id: requesterId },
        },
        relations: ['requester', 'book', 'groupBook', 'groupBook.group'],
      });

      if (!request) {
        throw new NotFoundException('Borrow request not found');
      }

      const groupId = request.groupBook.group.id;
      await this.requireActiveMember(groupId, requesterId, manager);

      if (![BorrowRequestStatus.PENDING, BorrowRequestStatus.APPROVED].includes(request.status)) {
        throw new BadRequestException('Only pending or approved requests can be cancelled');
      }

      request.status = BorrowRequestStatus.CANCELLED;
      request.queuePosition = 0;
      request.resolvedAt = new Date();
      await manager.getRepository(BorrowRequest).save(request);

      await this.reindexApprovedRequests(request.groupBook.id, manager);
      await this.syncBookStatus(request.book.id, manager);

      return this.toBorrowRequestDto(request);
    });
  }

  async listMyLoans(requesterId: string): Promise<LoanDto[]> {
    const loans = await this.loanRepository.find({
      where: {
        borrower: { id: requesterId },
        status: In([LoanStatus.ACTIVE, LoanStatus.OVERDUE]),
      },
      relations: ['book', 'group', 'borrower', 'owner'],
      order: { dueAt: 'ASC', borrowedAt: 'DESC' },
    });

    return loans.map((loan) => this.toLoanDto(loan));
  }

  async listLoans(groupId: string, requesterId: string): Promise<LoanDto[]> {
    await this.requireActiveMember(groupId, requesterId);

    const loans = await this.loanRepository.find({
      where: {
        group: { id: groupId },
      },
      relations: ['book', 'group', 'borrower', 'owner'],
      order: { borrowedAt: 'DESC' },
    });

    return loans.map((loan) => this.toLoanDto(loan));
  }

  async returnLoan(
    loanId: string,
    requesterId: string,
    dto: ReturnLoanDto,
  ): Promise<ReturnLoanResultDto> {
    return this.dataSource.transaction(async (manager) => {
      const loan = await manager.getRepository(Loan).findOne({
        where: {
          id: loanId,
        },
        relations: ['book', 'group', 'borrower', 'owner'],
      });

      if (!loan) {
        throw new NotFoundException('Loan not found');
      }

      const groupId = loan.group.id;

      const isBorrower = loan.borrower.id === requesterId;

      if (!isBorrower) {
        throw new ForbiddenException('Only the borrower can return this loan');
      }

      if (![LoanStatus.ACTIVE, LoanStatus.OVERDUE].includes(loan.status)) {
        throw new BadRequestException('Only active loans can be returned');
      }

      loan.status = LoanStatus.RETURNED;
      loan.returnedAt = new Date();
      if (dto.notes !== undefined) {
        loan.notes = dto.notes;
      }

      this.applyBorrowerReputationUpdate(loan);
      await manager.getRepository(User).save(loan.borrower);
      await manager.getRepository(Loan).save(loan);
      const nextLoan = await this.activateNextApprovedRequest(loan.book.id, groupId, manager);
      await this.syncBookStatus(loan.book.id, manager);

      return {
        returnedLoan: this.toLoanDto(loan),
        nextLoan: nextLoan ? this.toLoanDto(nextLoan) : null,
      };
    });
  }

  private async resolvePendingRequest(
    requestId: string,
    requesterId: string,
    nextStatus: BorrowRequestStatus.REJECTED | BorrowRequestStatus.EXPIRED,
  ): Promise<BorrowRequestDto> {
    return this.dataSource.transaction(async (manager) => {
      const request = await manager.getRepository(BorrowRequest).findOne({
        where: {
          id: requestId,
        },
        relations: [
          'requester',
          'book',
          'book.owner',
          'groupBook',
          'groupBook.group',
          'groupBook.book',
          'groupBook.book.owner',
        ],
      });

      if (!request) {
        throw new NotFoundException('Borrow request not found');
      }

      const groupId = request.groupBook.group.id;
      const membership = await this.requireActiveMember(groupId, requesterId, manager);
      this.assertCanManageEntry(request.groupBook, membership, requesterId);

      if (![BorrowRequestStatus.PENDING, BorrowRequestStatus.APPROVED].includes(request.status)) {
        throw new BadRequestException('Only pending or approved requests can be updated');
      }

      request.status = nextStatus;
      request.queuePosition = 0;
      request.resolvedAt = new Date();
      await manager.getRepository(BorrowRequest).save(request);

      await this.reindexApprovedRequests(request.groupBook.id, manager);
      await this.syncBookStatus(request.book.id, manager);

      return this.toBorrowRequestDto(request);
    });
  }

  private async requireActiveMember(
    groupId: string,
    userId: string,
    manager?: EntityManager,
  ): Promise<GroupMembership> {
    const membership = await (manager ?? this.dataSource.manager)
      .getRepository(GroupMembership)
      .findOne({
        where: {
          group: { id: groupId },
          user: { id: userId },
          status: GroupMemberStatus.ACTIVE,
        },
        relations: ['user', 'group'],
      });

    if (!membership) {
      throw new ForbiddenException('You are not an active member of this group');
    }

    return membership;
  }

  private async findEntryById(
    entryId: string,
    manager?: EntityManager,
  ): Promise<GroupBook> {
    const entry = await (manager ?? this.dataSource.manager).getRepository(GroupBook).findOne({
      where: {
        id: entryId,
      },
      relations: ['group', 'book', 'book.owner'],
    });

    if (!entry) {
      throw new NotFoundException('Catalog entry not found');
    }

    return entry;
  }

  private assertEntryIsRequestable(entry: GroupBook, requesterId: string): void {
    if (!entry.isVisible) {
      throw new BadRequestException('This catalog entry is hidden');
    }

    if (entry.book.owner.id === requesterId) {
      throw new BadRequestException('You cannot request your own book');
    }

    if (entry.book.status === BookStatus.UNAVAILABLE) {
      throw new BadRequestException('This book is currently unavailable');
    }
  }

  private assertCanManageEntry(
    entry: GroupBook,
    membership: GroupMembership,
    requesterId: string,
  ): void {
    void membership;
    const isBookOwner = entry.book.owner.id === requesterId;

    if (!isBookOwner) {
      throw new ForbiddenException('Only the book owner can manage the queue');
    }
  }

  private async reindexApprovedRequests(
    groupBookId: string,
    manager: EntityManager,
  ): Promise<void> {
    const approvedRequests = await manager.getRepository(BorrowRequest).find({
      where: {
        groupBook: { id: groupBookId },
        status: BorrowRequestStatus.APPROVED,
      },
      order: { queuePosition: 'ASC', requestedAt: 'ASC', createdAt: 'ASC' },
    });

    for (const [index, request] of approvedRequests.entries()) {
      request.queuePosition = index + 1;
    }

    if (approvedRequests.length > 0) {
      await manager.getRepository(BorrowRequest).save(approvedRequests);
    }
  }

  private async activateNextApprovedRequest(
    bookId: string,
    groupId: string,
    manager: EntityManager,
  ): Promise<Loan | null> {
    const nextRequest = await manager.getRepository(BorrowRequest).findOne({
      where: {
        book: { id: bookId },
        groupBook: { group: { id: groupId } },
        status: BorrowRequestStatus.APPROVED,
      },
      relations: ['requester', 'book', 'book.owner', 'groupBook', 'groupBook.group'],
      order: { queuePosition: 'ASC', requestedAt: 'ASC', createdAt: 'ASC' },
    });

    if (!nextRequest) {
      return null;
    }

    return this.activateApprovedRequest(nextRequest.id, manager);
  }

  private async activateApprovedRequest(
    requestId: string,
    manager: EntityManager,
  ): Promise<Loan> {
    const request = await manager.getRepository(BorrowRequest).findOne({
      where: { id: requestId },
      relations: ['requester', 'book', 'book.owner', 'groupBook', 'groupBook.group'],
    });

    if (!request) {
      throw new NotFoundException('Borrow request not found');
    }

    if (request.status !== BorrowRequestStatus.APPROVED) {
      throw new BadRequestException('Only approved requests can be activated');
    }

    if (!request.approvedDueAt) {
      throw new BadRequestException('Approved request is missing a due date');
    }

    const loan = manager.getRepository(Loan).create({
      book: request.book,
      group: request.groupBook.group,
      borrower: request.requester,
      owner: request.book.owner,
      borrowedAt: new Date(),
      dueAt: request.approvedDueAt,
      status: LoanStatus.ACTIVE,
      notes: request.approvalNotes,
    });

    const savedLoan = await manager.getRepository(Loan).save(loan);

    request.status = BorrowRequestStatus.FULFILLED;
    request.queuePosition = 0;
    request.resolvedAt = new Date();
    await manager.getRepository(BorrowRequest).save(request);

    await this.reindexApprovedRequests(request.groupBook.id, manager);

    const loanWithRelations = await manager.getRepository(Loan).findOne({
      where: { id: savedLoan.id },
      relations: ['book', 'group', 'borrower', 'owner'],
    });

    return loanWithRelations!;
  }

  private async syncBookStatus(bookId: string, manager: EntityManager): Promise<void> {
    const bookRepository = manager.getRepository(Book);
    const book = await bookRepository.findOne({ where: { id: bookId } });

    if (!book) {
      throw new NotFoundException('Book not found');
    }

    const activeLoan = await manager.getRepository(Loan).findOne({
      where: {
        book: { id: bookId },
        status: In([LoanStatus.ACTIVE, LoanStatus.OVERDUE]),
      },
    });

    if (activeLoan) {
      book.status = BookStatus.BORROWED;
      await bookRepository.save(book);
      return;
    }

    const approvedRequestsCount = await manager.getRepository(BorrowRequest).count({
      where: {
        book: { id: bookId },
        status: BorrowRequestStatus.APPROVED,
      },
    });

    if (approvedRequestsCount > 0) {
      book.status = BookStatus.QUEUED;
      await bookRepository.save(book);
      return;
    }

    if (book.status !== BookStatus.UNAVAILABLE) {
      book.status = BookStatus.AVAILABLE;
      await bookRepository.save(book);
    }
  }

  private toBorrowRequestDto(request: BorrowRequest): BorrowRequestDto {
    return {
      id: request.id,
      bookId: request.book.id,
      groupBookId: request.groupBook.id,
      requesterId: request.requester.id,
      requesterUsername: request.requester.username,
      status: request.status,
      queuePosition: request.queuePosition,
      message: request.message,
      approvedDueAt: request.approvedDueAt,
      approvalNotes: request.approvalNotes,
      requestedAt: request.requestedAt,
      resolvedAt: request.resolvedAt,
    };
  }

  private toLoanDto(loan: Loan): LoanDto {
    return {
      id: loan.id,
      bookId: loan.book.id,
      bookTitle: loan.book.title,
      bookAuthor: loan.book.author,
      groupId: loan.group.id,
      borrowerId: loan.borrower.id,
      borrowerUsername: loan.borrower.username,
      ownerId: loan.owner.id,
      ownerUsername: loan.owner.username,
      borrowedAt: loan.borrowedAt,
      dueAt: loan.dueAt,
      returnedAt: loan.returnedAt,
      status: loan.status,
      notes: loan.notes,
    };
  }

  private applyBorrowerReputationUpdate(loan: Loan): void {
    const returnedAt = loan.returnedAt;
    if (!returnedAt) {
      throw new BadRequestException('Returned loan must have a returned date');
    }

    const reputationDelta = this.calculateReputationDelta(loan.dueAt, returnedAt);
    loan.borrower.reputationScore = this.clampReputationScore(
      loan.borrower.reputationScore + reputationDelta,
    );
  }

  private calculateReputationDelta(dueAt: Date, returnedAt: Date): number {
    if (returnedAt <= dueAt) {
      return 2;
    }

    const overdueDays = Math.ceil(
      (returnedAt.getTime() - dueAt.getTime()) / MILLISECONDS_IN_DAY,
    );

    if (overdueDays <= 3) {
      return -2;
    }

    if (overdueDays <= 7) {
      return -5;
    }

    if (overdueDays <= 14) {
      return -10;
    }

    return -20;
  }

  private clampReputationScore(score: number): number {
    return Math.max(MIN_REPUTATION_SCORE, Math.min(MAX_REPUTATION_SCORE, score));
  }
}
