import { apiClient } from '@/shared/api';
import { CreateRequestDto, RequestResponseDto, RequestsResponseDto } from './requests.dto';

/**
 * Создание запроса на обмен навыками
 */
export const createRequestApi = async (dto: CreateRequestDto) => {
  return apiClient.auth.post<RequestResponseDto, CreateRequestDto>('/api/skill-swap/requests', dto);
};

/**
 * Получение входящих запросов
 */
export const getIncomingRequestsApi = async () => {
  return apiClient.auth.get<RequestsResponseDto>('/api/skill-swap/requests/incoming');
};

/**
 * Получение исходящих запросов
 */
export const getOutgoingRequestsApi = async () => {
  return apiClient.auth.get<RequestsResponseDto>('/api/skill-swap/requests/outgoing');
};

/**
 * Принятие запроса
 */
export const acceptRequestApi = async (id: string) => {
  return apiClient.auth.patch<RequestResponseDto>(`/api/skill-swap/requests/${id}/accept`);
};

/**
 * Отклонение запроса
 */
export const rejectRequestApi = async (id: string) => {
  return apiClient.auth.patch<RequestResponseDto>(`/api/skill-swap/requests/${id}/reject`);
};

/**
 * Удаление запроса
 */
export const deleteRequestApi = async (id: string) => {
  return apiClient.auth.delete<void>(`/api/skill-swap/requests/${id}`);
};
