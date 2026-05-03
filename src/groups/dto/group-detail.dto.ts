import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {GroupMemberDto} from "./group-member.dto";
import {GroupDto} from "./group.dto";

export class GroupDetailDto extends GroupDto {
    @ApiPropertyOptional({nullable: true})
    inviteCode: string | null;

    @ApiProperty({type: [GroupMemberDto]})
    members: GroupMemberDto[];
}