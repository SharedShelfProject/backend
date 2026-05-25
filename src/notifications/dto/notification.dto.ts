import { ApiProperty } from '@nestjs/swagger';

import { NotificationType } from '../../common/enums';

export class NotificationDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: NotificationType })
  type: NotificationType;

  @ApiProperty()
  title: string;

  @ApiProperty()
  body: string;

  @ApiProperty()
  isRead: boolean;

  @ApiProperty({ nullable: true })
  loanId: string | null;

  @ApiProperty({ nullable: true })
  scheduledFor: Date | null;

  @ApiProperty({ nullable: true })
  sentAt: Date | null;

  @ApiProperty()
  createdAt: Date;
}
