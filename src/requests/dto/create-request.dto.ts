import { IsInt } from 'class-validator';

export class CreateRequestDto {
  // Навык, предложенный пользователю
  @IsInt()
  offeredSkillId: number;

  // Навык, запрашиваемый пользователем
  @IsInt()
  requestedSkillId: number;
}
