import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ example: 900 })
  expiresIn: number;

  @ApiProperty({ example: 'Bearer' })
  tokenType: string;
}
