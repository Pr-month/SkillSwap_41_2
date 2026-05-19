import { ApiProperty } from '@nestjs/swagger';

export class RefreshResponseDto {
  @ApiProperty({ example: 'jwt_access_token_example' })
  accessToken!: string;
}
