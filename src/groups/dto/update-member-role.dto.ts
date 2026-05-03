import {ApiProperty} from "@nestjs/swagger";
import {GroupMemberRole} from "../../common/enums";
import {IsEnum} from "class-validator";

export class UpdateMemberRoleDto {
    @ApiProperty({enum: [GroupMemberRole.ADMIN, GroupMemberRole.MEMBER]})
    @IsEnum([GroupMemberRole.ADMIN, GroupMemberRole.MEMBER])
    role: GroupMemberRole.ADMIN | GroupMemberRole.MEMBER;
}