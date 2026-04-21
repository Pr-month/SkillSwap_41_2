import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  IsDateString,
  IsOptional,
  IsArray,
  IsNumber,
} from 'class-validator';
import { Gender } from '../../users/enums/users.enums';

export class RegisterDTO {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  //необязательные поля
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsString()
  about?: string;

  //проверяем что массив а также что элементы являются числами
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  wantToLearn?: number[];
}
