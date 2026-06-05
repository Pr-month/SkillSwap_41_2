import { RequestStatus } from "./request.enums";

export interface Request {
  id: string;
  sender: string;
  receiver: string;
  offeredSkill: string;
  requestedSkill: string;
  status: RequestStatus;
  isRead: boolean;
  createdAt: string;
}