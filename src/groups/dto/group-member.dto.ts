import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";

export class GroupMemberDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    username: string;

    @ApiPropertyOptional({nullable: true})
    avatarUrl: string | null;

    @ApiProperty()
    role: string;

    @ApiPropertyOptional({nullable: true})
    joinedAt: Date | null;
}