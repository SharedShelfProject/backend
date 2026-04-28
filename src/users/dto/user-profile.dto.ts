import { ApiProperty, OmitType } from '@nestjs/swagger';

export class UserProfileDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty({ nullable: true })
  bio: string | null;

  @ApiProperty({ nullable: true })
  avatarUrl: string | null;

  @ApiProperty()
  reputationScore: number;

  @ApiProperty()
  createdAt: Date;
}

export class PublicUserProfileDto extends OmitType(UserProfileDto, [
  'email',
] as const) {}
