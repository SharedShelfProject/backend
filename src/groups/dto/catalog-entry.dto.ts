import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {BookDto} from "../../books/dto/book.dto";

export class CatalogEntryDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    groupId: string;

    @ApiProperty({type: () => BookDto})
    book: BookDto;

    @ApiProperty()
    isVisible: boolean;

    @ApiPropertyOptional({nullable: true})
    addedAt: Date | null;
}