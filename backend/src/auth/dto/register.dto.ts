import {
  IsEmail,
  IsEnum,
  IsString,
  MinLength,
  IsDateString,
  IsOptional,
  IsArray,
  IsInt,
} from 'class-validator';
import { Gender } from '../../users/enums/users.enums';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class RegisterDTO {
  @ApiProperty({
    description: 'Имя пользователя',
    example: 'John Doe',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Email пользователя',
    example: 'john.doe@example.com',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'Пароль пользователя',
    example: 'password123',
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    description: 'Дата рождения пользователя',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiPropertyOptional({
    description: 'ID города пользователя',
    example: 123,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  city?: number;

  @ApiPropertyOptional({
    enum: Gender,
    example: Gender.MALE,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({
    description: 'Информация о пользователе',
    example: 'Люблю программирование',
  })
  @IsOptional()
  @IsString()
  about?: string;

  @ApiPropertyOptional({
    type: [Number],
    description: 'ID навыков для изучения',
    example: [1, 2, 3],
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  wantToLearn?: number[];
}
