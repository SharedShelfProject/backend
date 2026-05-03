import {ApiProperty} from "@nestjs/swagger";
import {IsUUID} from "class-validator";

export class TransferOwnershipDto {
    @ApiProperty({description: 'UUID of the member to transfer ownership to'})
    @IsUUID()
    newOwnerId: string;
}