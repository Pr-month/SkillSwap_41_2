import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateRequestDto {
  @IsUUID()
  @IsNotEmpty()
  receiverId!: number;   // ID получателя (кому отправляем заявку)

  @IsUUID()
  @IsNotEmpty()
  offeredSkillId!: number;   // ID навыка, который предлагает отправитель

  @IsUUID()
  @IsNotEmpty()
  requestedSkillId!: number; // ID навыка, который хочет получить отправитель
}
