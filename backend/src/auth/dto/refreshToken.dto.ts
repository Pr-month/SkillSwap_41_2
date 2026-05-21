import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: '{{refreshToken}}', //'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    description: 'Refresh token',
  })
  @IsString()
  refreshToken!: string;
}
