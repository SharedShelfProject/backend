import { Controller, Get, HttpCode, HttpStatus, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationDto } from './dto/notification.dto';
import { NotificationsCountDto } from './dto/notifications-count.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('my')
  @ApiOperation({ summary: 'List current user notifications' })
  @ApiResponse({ status: 200, type: [NotificationDto] })
  async listMyNotifications(
    @CurrentUser() user: { id: string },
  ): Promise<NotificationDto[]> {
    const notifications = await this.notificationsService.listForUser(user.id);
    return notifications.map((notification) => this.toDto(notification));
  }

  @Get('my/unread-count')
  @ApiOperation({ summary: 'Get unread notifications count for current user' })
  @ApiResponse({ status: 200, type: NotificationsCountDto })
  async getUnreadCount(
    @CurrentUser() user: { id: string },
  ): Promise<NotificationsCountDto> {
    const count = await this.notificationsService.countUnreadForUser(user.id);
    return { count };
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Mark all current user notifications as read' })
  @ApiResponse({ status: 204 })
  async markAllAsRead(@CurrentUser() user: { id: string }): Promise<void> {
    await this.notificationsService.markAllAsRead(user.id);
  }

  private toDto(notification: {
    id: string;
    type: NotificationDto['type'];
    title: string;
    body: string;
    isRead: boolean;
    loan?: { id: string } | null;
    scheduledFor: Date | null;
    sentAt: Date | null;
    createdAt: Date;
  }): NotificationDto {
    return {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      isRead: notification.isRead,
      loanId: notification.loan?.id ?? null,
      scheduledFor: notification.scheduledFor,
      sentAt: notification.sentAt,
      createdAt: notification.createdAt,
    };
  }
}
