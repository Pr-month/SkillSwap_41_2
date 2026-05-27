import { IsInt, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRequestDto {
  @ApiProperty({
    description: 'ID навыка отправителя',
    example: 3,
  })
  @IsInt()
  @IsNotEmpty()
  offeredSkillId!: number;

  @ApiProperty({
    description: 'ID навыка который отправитель хочет получить',
    example: 4,
  })
  @IsInt()
  @IsNotEmpty()
  requestedSkillId!: number;
}
