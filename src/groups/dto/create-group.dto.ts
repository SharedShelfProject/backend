import {ApiProperty, ApiPropertyOptional} from '@nestjs/swagger';
import {IsEnum, IsOptional, IsString, MaxLength, MinLength} from 'class-validator';
import {GroupVisibility} from '../../common/enums';

export class CreateGroupDto {
    @ApiProperty({example: 'Sci-Fi Readers'})
    @IsString()
    @MinLength(2)
    @MaxLength(150)
    name: string;

    @ApiPropertyOptional({example: 'A group for science fiction lovers'})
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    description?: string;

    @ApiPropertyOptional({enum: GroupVisibility, default: GroupVisibility.PRIVATE})
    @IsOptional()
    @IsEnum(GroupVisibility)
    visibility?: GroupVisibility;
}
