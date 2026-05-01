import {ApiPropertyOptional} from "@nestjs/swagger";
import {IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength} from "class-validator";
import {BookStatus} from "../../common/enums";

export class UpdateBookDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(200)
    title?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(150)
    author?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(30)
    isbn?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(100)
    genre?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsInt()
    @Min(1000)
    @Max(new Date().getFullYear())
    publicationYear?: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    language?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    description?: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @MaxLength(50)
    condition?: string;

    @ApiPropertyOptional({enum: BookStatus})
    @IsOptional()
    @IsEnum(BookStatus)
    status?: BookStatus;
}