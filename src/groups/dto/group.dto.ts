import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {GroupVisibility} from '../../common/enums';

export class GroupDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiPropertyOptional({nullable: true})
    description: string | null;

    @ApiProperty({enum: GroupVisibility})
    visibility: GroupVisibility;

    @ApiProperty()
    ownerId: string;

    @ApiProperty()
    ownerUsername: string;

    @ApiProperty()
    memberCount: number;

    @ApiProperty()
    createdAt: Date;
}