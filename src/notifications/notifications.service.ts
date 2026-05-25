import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { LoanStatus, NotificationType } from '../common/enums';
import { Loan } from '../database/entities/loan.entity';
import { Notification } from '../database/entities/notification.entity';

const DEFAULT_REMINDER_HOURS_BEFORE_DUE = 24;
const DEFAULT_SCAN_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Loan)
    private readonly loanRepository: Repository<Loan>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  getScanIntervalMs(): number {
    const value = Number.parseInt(
      process.env.NOTIFICATIONS_SCAN_INTERVAL_MS ?? '',
      10,
    );

    return Number.isFinite(value) && value > 0 ? value : DEFAULT_SCAN_INTERVAL_MS;
  }

  async processLoanNotifications(now: Date = new Date()): Promise<void> {
    await this.createDueSoonReminders(now);
    await this.markOverdueLoans(now);
  }

  private async createDueSoonReminders(now: Date): Promise<void> {
    const reminderThreshold = new Date(
      now.getTime() + this.getReminderHoursBeforeDue() * 60 * 60 * 1000,
    );

    const dueSoonLoans = await this.loanRepository.find({
      where: {
        status: LoanStatus.ACTIVE,
      },
      relations: ['book', 'borrower'],
    });

    const candidateLoans = dueSoonLoans.filter(
      (loan) => loan.dueAt > now && loan.dueAt <= reminderThreshold,
    );

    for (const loan of candidateLoans) {
      const exists = await this.notificationRepository.exist({
        where: {
          user: { id: loan.borrower.id },
          loan: { id: loan.id },
          type: NotificationType.LOAN_REMINDER,
        },
      });

      if (exists) {
        continue;
      }

      const notification = this.notificationRepository.create({
        user: loan.borrower,
        loan,
        type: NotificationType.LOAN_REMINDER,
        title: 'Book return reminder',
        body: `Please return "${loan.book.title}" by ${loan.dueAt.toISOString()}.`,
        isRead: false,
        scheduledFor: loan.dueAt,
        sentAt: now,
      });

      await this.notificationRepository.save(notification);
    }
  }

  private async markOverdueLoans(now: Date): Promise<void> {
    const activeAndOverdueLoans = await this.loanRepository.find({
      where: {
        status: In([LoanStatus.ACTIVE, LoanStatus.OVERDUE]),
      },
      relations: ['book', 'borrower'],
    });

    const overdueLoans = activeAndOverdueLoans.filter((loan) => loan.dueAt <= now);

    for (const loan of overdueLoans) {
      if (loan.status !== LoanStatus.OVERDUE) {
        loan.status = LoanStatus.OVERDUE;
        await this.loanRepository.save(loan);
      }

      const exists = await this.notificationRepository.exist({
        where: {
          user: { id: loan.borrower.id },
          loan: { id: loan.id },
          type: NotificationType.LOAN_OVERDUE,
        },
      });

      if (exists) {
        continue;
      }

      const notification = this.notificationRepository.create({
        user: loan.borrower,
        loan,
        type: NotificationType.LOAN_OVERDUE,
        title: 'Loan is overdue',
        body: `Your loan for "${loan.book.title}" is overdue since ${loan.dueAt.toISOString()}.`,
        isRead: false,
        scheduledFor: loan.dueAt,
        sentAt: now,
      });

      await this.notificationRepository.save(notification);
    }
  }

  private getReminderHoursBeforeDue(): number {
    const value = Number.parseInt(
      process.env.LOAN_REMINDER_HOURS_BEFORE_DUE ?? '',
      10,
    );

    return Number.isFinite(value) && value > 0
      ? value
      : DEFAULT_REMINDER_HOURS_BEFORE_DUE;
  }

  logProcessorFailure(error: unknown): void {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    this.logger.error(`Loan notification processing failed: ${message}`);
  }

  async listForUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: {
        user: { id: userId },
      },
      relations: ['loan'],
      order: { createdAt: 'DESC' },
    });
  }

  async countUnreadForUser(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: {
        user: { id: userId },
        isRead: false,
      },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );
  }
}
