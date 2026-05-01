import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {BookStatus} from '../../common/enums';

export class BookDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    author: string;

    @ApiPropertyOptional({nullable: true})
    isbn: string | null;

    @ApiPropertyOptional({nullable: true})
    genre: string | null;

    @ApiPropertyOptional({nullable: true})
    publicationYear: number | null;

    @ApiPropertyOptional({nullable: true})
    language: string | null;

    @ApiPropertyOptional({nullable: true})
    description: string | null;

    @ApiPropertyOptional({nullable: true})
    coverUrl: string | null;

    @ApiPropertyOptional({nullable: true})
    condition: string | null;

    @ApiProperty({enum: BookStatus})
    status: BookStatus;

    @ApiProperty()
    ownerId: string;

    @ApiProperty()
    ownerUsername: string;

    @ApiProperty()
    createdAt: Date;
}
