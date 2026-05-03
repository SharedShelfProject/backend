import {ApiProperty} from "@nestjs/swagger";
import {IsBoolean} from "class-validator";

export class UpdateCatalogEntryDto {
    @ApiProperty({description: 'Whether the book is visible to group members'})
    @IsBoolean()
    isVisible: boolean;
}