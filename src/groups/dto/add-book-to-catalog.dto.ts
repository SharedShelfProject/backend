import {ApiProperty} from "@nestjs/swagger";
import {IsUUID} from "class-validator";

export class AddBookToCatalogDto {
    @ApiProperty({description: 'UUID of the book to add'})
    @IsUUID()
    bookId: string;
}