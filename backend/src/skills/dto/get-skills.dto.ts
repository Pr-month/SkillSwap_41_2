import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GetSkillsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'category должен быть целым числом' })
  @Min(1, { message: 'category должен быть больше 0' })
  category?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'owner должен быть целым числом' })
  @Min(1, { message: 'owner должен быть больше 0' })
  owner?: number;

  @IsOptional()
  @IsString()
  search?: string; // title + description

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit должен быть целым числом' })
  @Min(1, { message: 'limit должен быть больше 0' })
  @Max(100, { message: 'limit не должен превышать 100' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset должен быть целым числом' })
  @Min(0, { message: 'offset не должен быть меньше 0' })
  offset?: number;
}
