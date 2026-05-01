import {ApiProperty, ApiPropertyOptional} from "@nestjs/swagger";
import {IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength} from "class-validator";

export class CreateBookDto {
    @ApiProperty({example: 'Dune'})
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title: string;

    @ApiProperty({example: 'Frank Herbert'})
    @IsString()
    @MinLength(1)
    @MaxLength(150)
    author: string;

    @ApiPropertyOptional({example: '978-0-441-17271-9'})
    @IsOptional()
    @IsString()
    @MaxLength(30)
    isbn?: string;

    @ApiPropertyOptional({example: 'Science Fiction'})
    @IsOptional()
    @IsString()
    @MaxLength(100)
    genre?: string;

    @ApiPropertyOptional({example: 1965})
    @IsOptional()
    @IsInt()
    @Min(1000)
    @Max(new Date().getFullYear())
    publicationYear?: number;

    @ApiPropertyOptional({example: 'English'})
    @IsOptional()
    @IsString()
    @MaxLength(50)
    language?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional({example: 'good'})
    @IsOptional()
    @IsString()
    @MaxLength(50)
    condition?: string;
}