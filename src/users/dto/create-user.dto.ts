import {
  IsArray,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Gender } from '../enums/users.enums';

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Пароль должен содержать как минимум одну букву и одну цифру.',
  })
  password!: string;

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  birthdate?: Date;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsUrl()
  avatar?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', {
    each: true,
    message: 'Каждый элемент должен быть валидным UUID',
  })
  wantToLearn?: string[];
}
