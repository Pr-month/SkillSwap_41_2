import { RequestStatus } from "@/entities/auth/model/types";

export interface CreateRequestDto {
  sender: string;
  receiver: string;
  offeredSkill: string;
  requestedSkill: string;
  status?: RequestStatus;
  isRead?: boolean;
}