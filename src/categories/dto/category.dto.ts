import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  MaxLength,
  MinLength,
  IsInt,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({
    description: 'UUID категории',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'Название категории',
    minLength: 2,
    maxLength: 50,
    example: 'Музыкальные инструменты',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @ApiPropertyOptional({
    description: 'Родительская категория',
  })
  @IsOptional()
  parent?: { id: string; name: string };

  @ApiPropertyOptional({
    description: 'Подкатегории',
    type: [Object],
  })
  @IsOptional()
  @IsArray()
  children?: { id: string; name: string }[];
}

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Название категории',
    minLength: 2,
    maxLength: 50,
    example: 'Игра на гитаре',
  })
  @IsString({ message: 'Имя категории должно быть строкой' })
  @MinLength(2, { message: 'Минимальная длина имени - 2 символа' })
  @MaxLength(50, { message: 'Максимальная длина имени - 50 символов' })
  name!: string;

  @ApiPropertyOptional({
    description: 'ID родительской категории',
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'parentId должен быть целым числом' })
  parentId?: number;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
