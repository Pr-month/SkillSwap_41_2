import { IsInt, IsNotEmpty } from 'class-validator';

export class CreateRequestDto {
  @IsInt()
  @IsNotEmpty()
  receiverId!: number;

  @IsInt()
  @IsNotEmpty()
  offeredSkillId!: number;

  @IsInt()
  @IsNotEmpty()
  requestedSkillId!: number;
}
