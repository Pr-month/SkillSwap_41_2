import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FindUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit должен быть целым числом' })
  @Min(1, { message: 'limit должен быть больше 0' })
  @Max(100, { message: 'limit не должен превышать 100' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset должен быть целым числом' })
  @Min(0, { message: 'offset должен быть больше или равен 0' })
  @Max(100, { message: 'offset не должен превышать 100' })
  offset?: number;
}
