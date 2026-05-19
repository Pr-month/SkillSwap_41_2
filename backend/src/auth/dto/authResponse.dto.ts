import { ApiProperty } from '@nestjs/swagger';
import { UserResponseDto } from './userResponse.dto';

export class AuthResponseDto {
  @ApiProperty({
    example: 'jwt_access_token_example',
  })
  accessToken!: string;

  @ApiProperty({
    type: UserResponseDto,
    example: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: 'USER',
    },
  })
  user!: UserResponseDto;
}
