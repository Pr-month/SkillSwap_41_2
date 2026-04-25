import {
	IsArray,
	IsNotEmpty,
	IsNumber,
	IsString,
} from 'class-validator';

export class CreateSkillDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsNumber()
  categoryId!: number;

  @IsArray()
  @IsString({ each: true })
  images!: string[];
}
