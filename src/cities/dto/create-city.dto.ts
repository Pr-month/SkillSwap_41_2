import { IsOptional, IsString } from 'class-validator';

export class CreateCityDto {
  @IsString({ message: 'Название города должно быть строкой' })
  name!: string;

  @IsString({ message: 'Название страны должно быть строкой' })
  @IsOptional()
  country?: string;

  @IsString({ message: 'Название региона должно быть строкой' })
  @IsOptional()
  region?: string;
}
