import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Gender } from 'src/users/enums/users.enums';

export enum OAuthProvider {
  YANDEX = 'yandex',
  GOOGLE = 'google',
  GITHUB = 'github',
}

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
