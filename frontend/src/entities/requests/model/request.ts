export enum RequestStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled'
}

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
