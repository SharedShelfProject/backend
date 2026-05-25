import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsProcessor implements OnModuleInit, OnModuleDestroy {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly notificationsService: NotificationsService) {}

  async onModuleInit(): Promise<void> {
    await this.runSafely();

    this.timer = setInterval(() => {
      void this.runSafely();
    }, this.notificationsService.getScanIntervalMs());
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async runSafely(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      await this.notificationsService.processLoanNotifications();
    } catch (error) {
      this.notificationsService.logProcessorFailure(error);
    } finally {
      this.isRunning = false;
    }
  }
}
