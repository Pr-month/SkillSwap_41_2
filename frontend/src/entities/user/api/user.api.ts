import { TUpdateProfileData, TUserResponse, TUsersResponse } from './user.types';
import { apiClient } from '@/shared/api';

export type TGetUsersParams = {
  search?: string;
  limit?: number;
  offset?: number;
};

export const getUsersApi = async (params?: TGetUsersParams ) => {
  const res = await apiClient.get<TUsersResponse>('/api/users', { params });
  return res;
};

export const updateProfileApi = (data: TUpdateProfileData) => {
  return apiClient.auth.patch<TUserResponse, TUpdateProfileData>('/api/users/me', data);
};

export const getProfileApi = () => {
  return apiClient.auth.get<TUserResponse>('/api/users/me');
};

export const getUserApi = (id: string): Promise<TUserResponse> => {
  return apiClient.get<TUserResponse>(`/api/users/${id}`);
};

export const deleteProfileApi = (id: string) => {
  return apiClient.auth.delete(`/api/users/${id}`);
};

export const updateUserPasswordApi = (data: TUpdateProfileData) => {
  return apiClient.auth.put<TUserResponse, TUpdateProfileData>(`/api/users/me/password`, data);
};
