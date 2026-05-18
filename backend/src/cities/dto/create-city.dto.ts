import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class CreateCityDto {
  @IsString({ message: 'Название города должно быть строкой' })
  @IsNotEmpty({ message: 'Название города не может быть пустым' })
  name!: string;

  @IsString({ message: 'Название страны должно быть строкой' })
  @IsOptional()
  country?: string;

  @IsString({ message: 'Название региона должно быть строкой' })
  @IsOptional()
  region?: string;
}
