import { PartialType } from '@nestjs/mapped-types';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsArray,
  MaxLength,
  MinLength,
  IsInt,
} from 'class-validator';
import { CreateSkillDto } from 'src/skills/dto/create-skill.dto';

export class CategoryDto {
  @IsUUID()
  id!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  name!: string;

  @IsOptional()
  parent?: { id: string; name: string };

  @IsOptional()
  @IsArray()
  children?: { id: string; name: string }[];
}

export class CreateCategoryDto {
  @IsString({ message: 'Имя категории должно быть строкой' })
  @MinLength(2, { message: 'Минимальная длина имени — 2 символа' })
  @MaxLength(50, { message: 'Максимальная длина имени — 50 символов' })
  name!: string;

  @IsOptional()
  @IsInt({ message: 'parentId должен быть целым числом' })
  parentId?: number;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
