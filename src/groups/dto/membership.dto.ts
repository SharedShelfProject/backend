import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {GroupMemberRole, GroupMemberStatus} from "../../common/enums";

export class MembershipDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    userId: string;

    @ApiProperty()
    username: string;

    @ApiPropertyOptional({nullable: true})
    avatarUrl: string | null;

    @ApiProperty({enum: GroupMemberRole})
    role: GroupMemberRole;

    @ApiProperty({enum: GroupMemberStatus})
    status: GroupMemberStatus;

    @ApiPropertyOptional({nullable: true})
    joinedAt: Date | null;
}