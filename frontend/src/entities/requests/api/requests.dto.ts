import { RequestStatus } from '../model/request.enums';

export interface CreateRequestDto {
  sender: string;
  receiver: string;
  offeredSkill: string;
  requestedSkill: string;
  status?: RequestStatus;
  isRead?: boolean;
}

export interface RequestResponseDto {
  id: string;
  fromUser: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  toUser: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  skill: {
    id: string;
    name: string;
  };
  status: RequestStatus;
  message?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface RequestsResponseDto {
  requests: RequestResponseDto[];
  total: number;
  page: number;
  totalPages: number;
}