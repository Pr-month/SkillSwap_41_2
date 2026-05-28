import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Gender } from 'src/users/enums/users.enums';
import { OAuthProvider } from '../auth.enums';

export class OAuthUserDto {
  @IsOptional()
  @IsEnum(OAuthProvider)
  provider?: OAuthProvider;

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  avatar?: string;
}
