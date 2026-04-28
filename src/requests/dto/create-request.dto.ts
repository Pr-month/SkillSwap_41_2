import { IsEnum, IsInt, IsBoolean, IsOptional } from 'class-validator';
import { RequestStatus } from '../enums/request.enums';

export class CreateRequestDto {
  // Пользователь, получающий запрос
  @IsInt()
  receiverId: number;

  // Навык, предложенный пользователю
  @IsInt()
  offeredSkillId: number;

  // Навык, запрашиваемый пользователем
  @IsInt()
  requestedSkillId: number;

  // PENDING, ACCEPTED, REJECTED, IN_PROGRESS, DONE
  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsBoolean()
  isRead?: boolean;
}
