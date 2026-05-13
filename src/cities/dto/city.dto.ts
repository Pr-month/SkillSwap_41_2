import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCityDto {
  @IsString({ message: 'Название города должно быть строкой' })
  name: string;

  @IsString({ message: 'Название страны должно быть строкой' })
  @IsOptional()
  country: string;

  @IsString({ message: 'Название региона должно быть строкой' })
  @IsOptional()
  region: string;
}

export class UpdateCityDto extends PartialType(CreateCityDto) {}

export class GetCitiesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
