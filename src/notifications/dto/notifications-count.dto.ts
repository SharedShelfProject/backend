import { ApiProperty } from '@nestjs/swagger';

export class NotificationsCountDto {
  @ApiProperty()
  count: number;
}
