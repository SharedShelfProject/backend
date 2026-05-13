import {ApiPropertyOptional} from '@nestjs/swagger';
import {IsEnum, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';
import {GroupVisibility} from '../../common/enums';

export class UpdateGroupDto {
    @ApiPropertyOptional({example: 'Sci-Fi Readers'})
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    name?: string;

    @ApiPropertyOptional({example: 'A group for science fiction lovers'})
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @ApiPropertyOptional({enum: GroupVisibility})
    @IsOptional()
    @IsEnum(GroupVisibility)
    visibility?: GroupVisibility;
}
