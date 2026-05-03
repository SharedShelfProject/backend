import {ApiProperty} from "@nestjs/swagger";
import {GroupDto} from "./group.dto";

export class GroupListDto {
    @ApiProperty({type: [GroupDto]})
    items: GroupDto[];

    @ApiProperty()
    total: number;

    @ApiProperty()
    page: number;

    @ApiProperty()
    limit: number;
}