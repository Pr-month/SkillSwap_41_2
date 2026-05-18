import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FindUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page должен быть целым числом' })
  @Min(1, { message: 'page должен быть больше 0' })
  @Max(100, { message: 'page не должен превышать 100' })
  limit: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset должен быть целым числом' })
  @Min(1, { message: 'offset должен быть больше 0' })
  @Max(100, { message: 'offset не должен превышать 100' })
  offset: number;
}
