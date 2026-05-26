
import { getCookie } from '@/shared/utils/cookies';
import { api } from './apiClient';
import { TUpdateProfileData, TUpdateProfileResponse, TUsersResponse } from './types/users';
import { TAuthResponse, TLoginData } from './types/auth';
import { TSkillResponse } from './types/skill';
import { TCategoryesResponse } from './types/categories';

// Типы для запросов обмена навыками
export interface TCreateRequestDto {
  fromUserId: string;
  toUserId: string;
  skillId: string;
  message?: string;
}

export interface TRequestResponse {
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
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  message?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface TRequestsResponse {
  requests: TRequestResponse[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * Получение списка категорий
 */
export const getCategoriesApi = async () => {
  return api.get<TCategoryesResponse>('/api/categories');
}

/**
 * Получение списка навыков
 */
export const getSkillsApi = async () => {
  return api.get<TSkillResponse>('/api/skills');
};

/**
 * Получение списка пользователей
 */
export const getUsersApi = async () => {
  return api.get<TUsersResponse>('/api/users/all');
};

/**
 * Авторизация пользователя
 */
export const loginUserApi = async (data: TLoginData) => {
  return api.post<TAuthResponse, TLoginData>('/api/login', data);
};

/**
 * Обновление профиля пользователя
 */
export const updateProfileApi = (data: TUpdateProfileData) => {
  return api.patch<TUpdateProfileResponse, TUpdateProfileData>(
    '/api/profile',
    data,
    getCookie('accessToken') || '',
  );
};

/**
 * Создание запроса на обмен навыками
 */
export const createRequestApi = async (dto: TCreateRequestDto) => {
  return api.post<TRequestResponse, TCreateRequestDto>(
    '/api/skill-swap/requests',
    dto,
    getCookie('accessToken') || ''
  );
};

/**
 * Получение входящих запросов на обмен (от других пользователей к текущему)
 */
export const getIncomingRequestsApi = async () => {
  return api.get<TRequestsResponse>(
    '/api/skill-swap/requests/incoming',
    getCookie('accessToken') || ''
  );
};

/**
 * Получение исходящих запросов на обмен (созданных текущим пользователем)
 */
export const getOutgoingRequestsApi = async () => {
  return api.get<TRequestsResponse>(
    '/api/skill-swap/requests/outgoing',
    getCookie('accessToken') || ''
  );
};

/**
 * Принятие запроса на обмен
 */
export const acceptRequestApi = async (id: string) => {
  return api.patch<TRequestResponse>(
    `/api/skill-swap/requests/${id}/accept`,
    undefined,
    getCookie('accessToken') || ''
  );
};

/**
 * Отклонение запроса на обмен
 */
export const rejectRequestApi = async (id: string) => {
  return api.patch<TRequestResponse>(
    `/api/skill-swap/requests/${id}/reject`,
    undefined,
    getCookie('accessToken') || ''
  );
};

/**
 * Удаление запроса на обмен (доступно для исходящих запросов в статусе pending)
 */
export const deleteRequestApi = async (id: string) => {
  return api.delete<void>(
    `/api/skill-swap/requests/${id}`,
    getCookie('accessToken') || ''
  );
};

// Экспорт всех функций для удобства использования в других модулях
export const skillSwapApi = {
  getCategoriesApi,
  getSkillsApi,
  getUsersApi,
  loginUserApi,
  updateProfileApi,
  createRequestApi,
  getIncomingRequestsApi,
  getOutgoingRequestsApi,
  acceptRequestApi,
  rejectRequestApi,
  deleteRequestApi,
};